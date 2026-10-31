const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const path = require('node:path');
const { buildSync } = require('esbuild');

const { outputFiles } = buildSync({
  stdin: {
    contents: 'export { OceanEngine } from "./lib/ascii-sharks/engine"; export { AsciiRenderer } from "./lib/ascii-sharks/renderer";',
    resolveDir: path.resolve(__dirname, '..'),
  },
  bundle: true, write: false, format: 'iife', globalName: 'Ocean', platform: 'browser',
});

function setup({ reduced = false, width = 1440, height = 6000, viewportHeight = 900, dpr = 2 } = {}) {
  let now = 0;
  let id = 0;
  let scrollY = 0;
  const pending = new Map();
  const observers = [];
  const eventTarget = () => {
    const listeners = new Map();
    return {
      addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
      removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
      emit(type, event = {}) { for (const fn of listeners.get(type) || []) fn(event); },
    };
  };
  const page = { getBoundingClientRect: () => ({ width, height, top: -scrollY, left: 0 }) };
  function makeCanvas() {
    const calls = [];
    const ctx = new Proxy({}, { get(target, key) { return target[key] ?? ((...args) => calls.push([key, ...args])); } });
    return { width: 300, height: 150, style: {}, calls, getContext: () => ctx, parentElement: page };
  }
  const canvas = makeCanvas();
  const motion = Object.assign(eventTarget(), { matches: reduced });
  const document = Object.assign(eventTarget(), { hidden: false, documentElement: eventTarget(), createElement: makeCanvas });
  const window = Object.assign(eventTarget(), { innerHeight: viewportHeight, devicePixelRatio: dpr, matchMedia: () => motion });
  class Observer {
    constructor(fn) { this.fn = fn; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const context = vm.createContext({
    window, document, getComputedStyle: () => ({ fontFamily: 'monospace' }),
    performance: { now: () => now }, ResizeObserver: Observer, IntersectionObserver: Observer,
    requestAnimationFrame: fn => { pending.set(++id, fn); return id; }, cancelAnimationFrame: id => pending.delete(id),
  });
  vm.runInContext(outputFiles[0].text, context);
  const engine = new context.Ocean.OceanEngine(canvas);
  return {
    engine, canvas, window, document, motion, observers, pending,
    advance(ms, hz = 60) {
      const frames = Math.round(ms * hz / 1000);
      for (let i = 0; i < frames; i++) {
        now += 1000 / hz;
        const work = [...pending.values()]; pending.clear();
        for (const fn of work) fn(now);
      }
    },
    scroll(y) { scrollY = y; window.emit('scroll'); },
    renders: () => canvas.calls.filter(c => c[0] === 'clearRect').length,
  };
}

for (const hz of [60]) {
  test(`retains main's paint cadence at ${hz} Hz without slowing the simulation`, () => {
    const env = setup();
    env.advance(2000, hz);
    assert.ok(env.renders() >= 59 && env.renders() <= 61, `${env.renders()} renders`);
    assert.ok(Math.abs(env.engine.world.time - 2) < 0.06);
    env.engine.destroy();
  });
}

test('long pages use bounded buffers and retain world/input coordinates after scrolling', () => {
  const env = setup();
  env.advance(100);
  const { canvas, engine } = env;
  assert.equal(canvas.width, 1440 * 2);
  assert.equal(canvas.height, 1156 * 2);
  assert.equal(parseFloat(canvas.style.height), 1156);
  assert.equal(engine.world.height, 6000);
  const fish = engine.world.fish;
  const backing = [canvas.width, canvas.height];
  env.scroll(3200);
  env.advance(100);
  assert.deepEqual([canvas.width, canvas.height], backing);
  assert.equal(engine.world.fish, fish);
  assert.equal(engine.world.view.top, 3200);
  assert.equal(canvas.style.top, '3072px');
  env.window.emit('pointermove', { clientX: 100, clientY: 200, pointerType: 'mouse' });
  assert.equal(engine.world.pointer.y, 3400);
  env.window.emit('pointerdown', { clientX: 100, clientY: 200 });
  assert.equal(engine.world.events.at(-1).y, 3400);
  env.scroll(5100);
  env.advance(100);
  assert.equal(parseFloat(canvas.style.top) + parseFloat(canvas.style.height), 6000);
  engine.destroy();
});

test('hidden/offscreen pages stop scheduling and resume without catching up elapsed time', () => {
  const env = setup();
  env.advance(100);
  env.document.hidden = true;
  env.document.emit('visibilitychange');
  const before = env.renders();
  const time = env.engine.world.time;
  assert.equal(env.pending.size, 0);
  env.advance(10000);
  assert.equal(env.renders(), before);
  env.document.hidden = false;
  env.document.emit('visibilitychange');
  env.advance(100);
  assert.ok(env.engine.world.time - time < 0.12);
  env.observers[1].fn([{ isIntersecting: false }]);
  assert.equal(env.pending.size, 0);
  env.observers[1].fn([{ isIntersecting: true }]);
  env.advance(100);
  assert.ok(env.renders() > before);
  env.engine.destroy();
});

test('reduced motion paints on demand, stays still on scroll, and releases buffers on destroy', () => {
  const env = setup({ reduced: true });
  env.advance(100);
  const count = env.renders();
  const time = env.engine.world.time;
  assert.equal(env.pending.size, 0);
  env.advance(1000);
  assert.equal(env.renders(), count);
  env.scroll(1200);
  env.advance(100);
  assert.equal(env.renders(), count + 1);
  assert.equal(env.engine.world.time, time);
  env.motion.matches = false;
  env.motion.emit('change');
  env.advance(100);
  assert.ok(env.renders() > count + 1);
  env.engine.destroy();
  assert.equal(env.canvas.width * env.canvas.height, 0);
  assert.equal(env.engine.renderer.bg.width * env.engine.renderer.bg.height, 0);
  assert.equal(env.pending.size, 0);
  env.scroll(0);
  env.document.emit('visibilitychange');
  assert.equal(env.pending.size, 0);
  assert.ok(env.observers.every(o => o.disconnected));
});

test('drawing culls distant fish and translates visible world coordinates into the canvas', () => {
  const env = setup({ reduced: true });
  env.advance(100);
  const { world, renderer } = env.engine;
  world.events.length = 0;
  world.sharks = [];
  world.fish = [
    { alive: true, x: 100, y: 100, depth: 1, turn: 0, alarm: 0 },
    { alive: true, x: 100, y: 3100, depth: 1, turn: 0, alarm: 0 },
    { alive: true, x: 100, y: 5500, depth: 1, turn: 0, alarm: 0 },
  ];
  renderer.setView(3000);
  env.canvas.calls.length = 0;
  renderer.render(world, 0);
  const fishDraws = env.canvas.calls.filter(c => c[0] === 'fillText' && c[1] === '-');
  assert.equal(fishDraws.length, 1);
  assert.ok(fishDraws[0][3] > 3000 && fishDraws[0][3] < 3200);
  assert.ok(env.canvas.calls.some(c => c[0] === 'setTransform' && c[6] === -6000));
  env.engine.destroy();
});


test('scroll-only repaint leaves wake, heat, and simulation state unchanged', () => {
  const env = setup();
  env.advance(100);
  const { renderer, world } = env.engine;
  const energy = Array.from(renderer.energy);
  const heat = Array.from(renderer.heat);
  const time = world.time;
  world.events.push({ kind: 'splash', x: 100, y: 200 });
  renderer.setView(1000);
  renderer.render(world, 0);
  assert.deepEqual(Array.from(renderer.energy), energy);
  assert.deepEqual(Array.from(renderer.heat), heat);
  assert.equal(world.time, time);
  assert.equal(world.events.length, 1);
  env.engine.destroy();
});

test('fractional DPR keeps the canvas origin on physical pixels', () => {
  const env = setup({ dpr: 1.25 });
  env.scroll(641);
  env.advance(100);
  const offset = parseFloat(env.canvas.style.top);
  assert.equal(offset * 1.25, Math.round(offset * 1.25));
  assert.equal(env.canvas.width, 1800);
  assert.equal(env.canvas.height, 1445);
  env.engine.destroy();
});
