import { Flock } from "./flock";

const STEP = 1 / 60;
const MAX_STEPS = 4;
const INK = "236,240,250";
// Heading glyphs for a lone bird, by octant starting east and turning clockwise (y points down).
const HEADING = ["-", "\\", "|", "/", "-", "\\", "|", "/"];
// Several birds in one cell read as a denser mark.
const DENSE = ["v", "*", "%", "#", "@"];

/**
 * Wires a Flock to a canvas and draws it as ASCII cells: one glyph per bird
 * pointing the way it flies, denser glyphs where the flock bunches up, and a
 * fading trail of dots behind it. Handles resize, pointer input, pausing
 * off-screen, and prefers-reduced-motion.
 */
export class FlockEngine {
  private flock = new Flock();
  private ctx: CanvasRenderingContext2D;
  private fontFamily = "monospace";
  private dpr = 1;
  private width = 0;
  private height = 0;
  private cw = 12;
  private ch = 18;
  private cols = 0;
  private rows = 0;
  private count = new Uint8Array(0);
  private sumX = new Float32Array(0);
  private sumY = new Float32Array(0);
  private trail = new Float32Array(0);
  private raf = 0;
  private last = 0;
  private acc = 0;
  private visible = true;
  private reducedMotion: MediaQueryList;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.fontFamily = getComputedStyle(canvas).fontFamily || this.fontFamily;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(canvas);

    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);
    window.addEventListener("scroll", this.updateView, { passive: true });
    window.addEventListener("resize", this.updateView, { passive: true });

    this.resize();
    // Canvas text can't trigger a webfont load; once the mono face is in, redraw.
    document.fonts?.load(`600 16px ${this.fontFamily}`).then(() => {
      if (!this.disposed && this.reducedMotion.matches) this.drawStill();
    });
    this.schedule();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
    window.removeEventListener("scroll", this.updateView);
    window.removeEventListener("resize", this.updateView);
  }

  /** Tell the flock which slice of the canvas is on screen. */
  private updateView = () => {
    const rect = this.canvas.getBoundingClientRect();
    const top = Math.max(0, -rect.top);
    const bottom = Math.min(rect.height, window.innerHeight - rect.top);
    this.flock.view.top = top;
    this.flock.view.height = Math.max(0, bottom - top);
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.cw = Math.min(Math.max(Math.round(rect.width / 124), 8), 13);
    this.ch = Math.round(this.cw * 1.45);
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);

    const cols = Math.ceil(rect.width / this.cw);
    const rows = Math.ceil(rect.height / this.ch);
    if (cols !== this.cols || rows !== this.rows) {
      this.cols = cols;
      this.rows = rows;
      const n = cols * rows;
      this.count = new Uint8Array(n);
      this.sumX = new Float32Array(n);
      this.sumY = new Float32Array(n);
      this.trail = new Float32Array(n);
    }

    this.updateView();
    this.flock.resize(rect.width, rect.height);
    if (this.reducedMotion.matches) this.drawStill();
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || this.reducedMotion.matches) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.flock.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    this.render(dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Reduced motion: let the flock form, then show a single frame without trails. */
  private drawStill() {
    if (this.flock.time < 6) {
      for (let i = 0; i < 360; i++) this.flock.step(STEP);
    }
    this.trail.fill(0);
    this.render(0);
  }

  private render(dt: number) {
    const { ctx, dpr, cols, rows, cw, ch, count, sumX, sumY, trail } = this;
    if (cols === 0) return;

    count.fill(0);
    sumX.fill(0);
    sumY.fill(0);
    for (const b of this.flock.boids) {
      const c = Math.floor(b.x / cw);
      const r = Math.floor(b.y / ch);
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      const i = r * cols + c;
      if (count[i] < 255) count[i]++;
      sumX[i] += b.vx;
      sumY[i] += b.vy;
    }

    // Trails fade in about half a second.
    const fade = Math.exp(-dt * 5);
    for (let i = 0; i < trail.length; i++) {
      trail[i] = count[i] > 0 ? Math.min(1, trail[i] * fade + 0.4) : trail[i] * fade;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawGrid();

    ctx.font = `600 ${Math.round(ch * 0.74)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Only the rows on screen (plus a margin) are worth drawing.
    const { top, height } = this.flock.view;
    const r0 = Math.max(0, Math.floor((top - 200) / ch));
    const r1 = Math.min(rows, Math.ceil((top + (height || this.height) + 200) / ch));
    for (let r = r0; r < r1; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const n = count[i];
        const x = c * cw + cw / 2;
        const y = r * ch + ch / 2;
        if (n === 0) {
          const t = trail[i];
          if (t < 0.08) continue;
          ctx.fillStyle = `rgba(${INK},${(t * 0.35).toFixed(2)})`;
          ctx.fillText(".", x, y);
        } else if (n === 1) {
          ctx.fillStyle = `rgba(${INK},0.7)`;
          ctx.fillText(headingGlyph(sumX[i], sumY[i]), x, y);
        } else {
          ctx.fillStyle = `rgba(${INK},${Math.min(1, 0.72 + n * 0.07).toFixed(2)})`;
          ctx.fillText(DENSE[Math.min(n - 2, DENSE.length - 1)], x, y);
        }
      }
    }
  }

  private drawGrid() {
    const { ctx, width: W, height: H, cw, ch, dpr } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = `rgba(${INK},0.05)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= this.cols; c++) {
      const x = Math.round(c * cw * dpr) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H * dpr);
    }
    for (let r = 0; r <= this.rows; r++) {
      const y = Math.round(r * ch * dpr) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(W * dpr, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private onMotionPreference = () => {
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      this.drawStill();
    } else {
      this.schedule();
    }
  };

  private toLocal(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    return { x, y, inside };
  }

  private onPointerMove = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    const p = this.flock.pointer;
    p.x = x;
    p.y = y;
    p.active = inside && e.pointerType !== "touch";
  };

  private onPointerDown = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    if (inside && !this.reducedMotion.matches) this.flock.scatter(x, y);
  };

  private onPointerLeave = () => {
    this.flock.pointer.active = false;
  };
}

function headingGlyph(vx: number, vy: number) {
  const octant = Math.round(Math.atan2(vy, vx) / (Math.PI / 4));
  return HEADING[(octant + 8) % 8];
}
