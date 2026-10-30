// Local addition (not upstream): a standalone entry, bundled by `npm run sharks` and
// inlined into the page by components/AsciiSharks.tsx, so the ocean starts as soon as
// the page paints instead of waiting for React to download and hydrate.
import { OceanEngine } from "./engine";
import type { SharkKind, SharkSpec } from "./world";

/** Dispatched on window by the page's on/off toggle after it flips <html data-sharks>. */
const CHANGE_EVENT = "sharks-change";
const KINDS: SharkKind[] = ["classic", "hammerhead", "zebra", "tiger", "greathammer", "mako", "thresher", "nurse"];
// The ocean covers the whole page, so a few more sharks than one screen would need.
const SIZES = [1, 0.9, 0.82, 0.76, 0.7];

/** A different mix of species on every visit, biggest first. */
function pickSharks(): SharkSpec[] {
  const kinds = [...KINDS];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return SIZES.map((size, i) => ({ kind: kinds[i], size }));
}

let engine: OceanEngine | null = null;
let engineCanvas: HTMLCanvasElement | null = null;

/** Start, keep, or stop the ocean to match the page and the on/off setting. */
function sync() {
  const canvas = document.querySelector<HTMLCanvasElement>("canvas.ascii-sharks");
  const on = document.documentElement.dataset.sharks !== "off";
  if (canvas && on) {
    if (engine && engineCanvas === canvas) return;
    engine?.destroy();
    engine = new OceanEngine(canvas, pickSharks());
    engineCanvas = canvas;
  } else {
    engine?.destroy();
    engine = null;
    engineCanvas = null;
  }
}

/**
 * Start once the page's text has painted. The ocean's frames are heavy enough to hold
 * back that first paint (and the web font swap), so they wait for it.
 */
function startAfterFirstPaint() {
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    sync();
  };
  try {
    new PerformanceObserver((list, observer) => {
      if (list.getEntriesByName("first-contentful-paint").length) {
        observer.disconnect();
        go();
      }
    }).observe({ type: "paint", buffered: true });
  } catch {
    // No paint timing: fall through to the timer.
  }
  // Browsers without paint timing, or a page that never reports it.
  window.addEventListener("load", () => setTimeout(go, 0), { once: true });
}

window.addEventListener(CHANGE_EVENT, sync);
startAfterFirstPaint();
