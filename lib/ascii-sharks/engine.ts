// Vendored from https://github.com/stackedlol/ascii-sharks (a0074c1), MIT License; see ./LICENSE.
import { AsciiRenderer } from "./renderer";
import { World, type SharkSpec } from "./world";

const STEP = 1 / 60;
const MAX_STEPS = 4;
/**
 * Keep the existing paint cadence; the world still advances in fixed 60 Hz steps.
 * Each new canvas frame also updates the liquid glass backdrop.
 */
const FRAME_INTERVAL = 1000 / 30;
// Includes room for the existing glass blur to sample beyond the viewport edge.
const SCROLL_MARGIN = 128;

/**
 * Wires World + AsciiRenderer to a canvas: fixed-timestep loop, resize,
 * pointer input, pausing off-screen, and prefers-reduced-motion.
 */
export class OceanEngine {
  private world: World;
  private renderer: AsciiRenderer;
  private page: HTMLElement;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private visible = true;
  private viewDirty = true;
  private stillSettled = false;
  private reducedMotion: MediaQueryList;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement, sharks?: SharkSpec[]) {
    this.page = canvas.parentElement!;
    this.world = new World(sharks);
    this.renderer = new AsciiRenderer(canvas);
    this.renderer.setFontFamily(getComputedStyle(canvas).fontFamily);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.resizeObserver = new ResizeObserver(this.invalidateView);
    this.resizeObserver.observe(this.page);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(this.page);

    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);
    window.addEventListener("scroll", this.invalidateView, { passive: true });
    window.addEventListener("resize", this.invalidateView, { passive: true });

    this.resize();
    // Canvas text can't trigger a webfont load; once the mono face is in, redraw.
    document.fonts?.load(`600 16px ${getComputedStyle(canvas).fontFamily}`).then(() => {
      if (!this.disposed && this.reducedMotion.matches) this.invalidateView();
    });
    // Paint the first frame now rather than on the next animation frame, which can
    // wait behind the page's own startup work (local change).
    if (!document.hidden) {
      if (this.reducedMotion.matches) this.drawStill();
      else this.renderer.render(this.world, STEP);
    }
    this.schedule();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
    window.removeEventListener("scroll", this.invalidateView);
    window.removeEventListener("resize", this.invalidateView);
    this.renderer.destroy();
  }

  /** Coalesce geometry changes and move/redraw the canvas in the same frame. */
  private invalidateView = () => {
    this.viewDirty = true;
    if (!this.raf && !this.disposed && this.visible && !document.hidden) {
      this.raf = requestAnimationFrame(this.frame);
    }
  };

  private resize() {
    const rect = this.page.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const top = Math.max(0, -rect.top);
    const bottom = Math.min(rect.height, window.innerHeight - rect.top);
    this.world.view.top = top;
    this.world.view.height = Math.max(0, bottom - top);
    // Preserve main's resolution. Only the surface's height changes, not its scale.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const height = Math.ceil(Math.min(rect.height, window.innerHeight + SCROLL_MARGIN * 2) * dpr) / dpr;
    const offset = Math.round(Math.max(0, Math.min(top - SCROLL_MARGIN, rect.height - height)) * dpr) / dpr;
    this.canvas.style.height = `${height}px`;
    this.canvas.style.top = `${offset}px`;
    this.renderer.resize(rect.width, rect.height, dpr, height);
    this.renderer.setView(offset);
    if (this.world.width !== rect.width || this.world.height !== rect.height) {
      this.world.resize(rect.width, rect.height, this.renderer.cellWidth, this.renderer.cellHeight);
    }
    this.viewDirty = false;
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.disposed || !this.visible || document.hidden) return;
    if (this.reducedMotion.matches && !this.viewDirty) return;
    this.last = performance.now();
    this.acc = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed || !this.visible || document.hidden) return;
    const viewChanged = this.viewDirty;
    if (viewChanged) this.resize();
    if (this.reducedMotion.matches) {
      this.drawStill();
      return;
    }
    // A little slack so a 60 Hz display reliably draws every other frame.
    if (now - this.last < FRAME_INTERVAL - 4) {
      // Keep fast scrolling covered without advancing the animation early.
      if (viewChanged) this.renderer.render(this.world, 0);
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.world.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    this.renderer.render(this.world, dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Reduced motion: let the ecosystem settle, then show a single frame. */
  private drawStill() {
    if (!this.stillSettled) {
      if (this.world.time < 4) {
        for (let i = 0; i < 240; i++) this.world.step(STEP);
      }
      this.stillSettled = true;
      this.renderer.render(this.world, STEP);
    } else {
      this.renderer.render(this.world, 0);
    }
  }

  private onMotionPreference = () => {
    this.viewDirty = true;
    this.schedule();
  };

  private onVisibilityChange = () => {
    this.onPointerLeave();
    this.viewDirty = true;
    this.schedule();
  };

  private toLocal(e: PointerEvent) {
    const rect = this.page.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    return { x, y, inside };
  }

  private onPointerMove = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    const p = this.world.pointer;
    p.x = x;
    p.y = y;
    p.active = inside && e.pointerType !== "touch";
  };

  private onPointerDown = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    if (inside && !this.reducedMotion.matches) this.world.splash(x, y);
  };

  private onPointerLeave = () => {
    this.world.pointer.active = false;
  };
}
