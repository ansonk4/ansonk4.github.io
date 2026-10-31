// Vendored from https://github.com/stackedlol/ascii-sharks (a0074c1), MIT License; see ./LICENSE.
import { AsciiRenderer, type GlassPatch } from "./renderer";
import { World, type SharkSpec } from "./world";

const STEP = 1 / 60;
const MAX_STEPS = 4;
/**
 * Draw at most this often (local change). The ocean moves a whole cell at a time, so
 * 30 frames a second looks the same as 60, and it halves the GPU work: every new
 * frame also makes the liquid glass blur repaint the sharks behind it.
 */
const FRAME_INTERVAL = 1000 / 30;

/**
 * Liquid glass (local change): the pieces of content that sit on a frosted patch, matching
 * the selectors in app/globals.css. The renderer frosts the ocean under them itself and
 * the engine sets <html data-canvas-glass>, which turns off the CSS backdrop-filter.
 */
const GLASS_PANELS = ".intro-panel, .content-sections, .playground-quote, .research-asset";
const GLASS_BUTTONS = ".theme-toggle, .sharks-toggle";
/** How far the round buttons' patch reaches past the button (the CSS `inset: -6px`). */
const BUTTON_REACH = 6;

/**
 * Wires World + AsciiRenderer to a canvas: fixed-timestep loop, resize,
 * pointer input, pausing off-screen, and prefers-reduced-motion.
 */
export class OceanEngine {
  private world: World;
  private renderer: AsciiRenderer;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private visible = true;
  private reducedMotion: MediaQueryList;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private disposed = false;
  private glassObserver: ResizeObserver;

  constructor(private canvas: HTMLCanvasElement, sharks?: SharkSpec[]) {
    this.world = new World(sharks);
    this.renderer = new AsciiRenderer(canvas);
    this.renderer.setFontFamily(getComputedStyle(canvas).fontFamily);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(canvas);
    // Content that changes size can move the glass without resizing the page.
    this.glassObserver = new ResizeObserver(() => this.measureGlass());
    document.querySelectorAll(`${GLASS_PANELS}, ${GLASS_BUTTONS}`).forEach((el) => this.glassObserver.observe(el));

    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);
    window.addEventListener("scroll", this.updateView, { passive: true });
    window.addEventListener("resize", this.updateView, { passive: true });

    this.resize();
    // Canvas text can't trigger a webfont load; once the mono face is in, redraw.
    document.fonts?.load(`600 16px ${getComputedStyle(canvas).fontFamily}`).then(() => {
      if (this.disposed) return;
      // The web font can move the content, and the glass with it.
      this.measureGlass();
      if (this.reducedMotion.matches) this.drawStill();
    });
    // Paint the first frame now rather than on the next animation frame, which can
    // wait behind the page's own startup work (local change).
    if (!this.reducedMotion.matches) this.renderer.render(this.world, STEP);
    this.schedule();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.glassObserver.disconnect();
    delete document.documentElement.dataset.canvasGlass;
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
    window.removeEventListener("scroll", this.updateView);
    window.removeEventListener("resize", this.updateView);
  }

  /** Tell the world which slice of the canvas is on screen. */
  private updateView = () => {
    const rect = this.canvas.getBoundingClientRect();
    const top = Math.max(0, -rect.top);
    const bottom = Math.min(rect.height, window.innerHeight - rect.top);
    this.world.view.top = top;
    this.world.view.height = Math.max(0, bottom - top);
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.updateView();
    this.renderer.resize(rect.width, rect.height, dpr);
    this.world.resize(rect.width, rect.height, this.renderer.cellWidth, this.renderer.cellHeight);
    this.measureGlass();
    if (this.reducedMotion.matches) this.drawStill();
  }

  /** Find where the glass patches sit on the canvas and hand them to the renderer. */
  private measureGlass() {
    if (this.disposed) return;
    const site = this.canvas.parentElement?.querySelector<HTMLElement>(".site-canvas");
    const patches: GlassPatch[] = [];
    if (site) {
      const feather = parseFloat(getComputedStyle(site).getPropertyValue("--glass-feather")) || 0;
      const origin = this.canvas.getBoundingClientRect();
      const add = (el: Element, reach: number, round: boolean) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        patches.push({
          x: r.left - origin.left - reach,
          y: r.top - origin.top - reach,
          w: r.width + reach * 2,
          h: r.height + reach * 2,
          round,
          feather,
        });
      };
      site.querySelectorAll(GLASS_PANELS).forEach((el) => add(el, feather, false));
      site.querySelectorAll(GLASS_BUTTONS).forEach((el) => add(el, BUTTON_REACH, true));
    }
    this.renderer.setGlass(patches);
    document.documentElement.dataset.canvasGlass = "";
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || this.reducedMotion.matches) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    // A little slack so a 60 Hz display reliably draws every other frame.
    if (now - this.last < FRAME_INTERVAL - 4) {
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
    if (this.world.time < 4) {
      for (let i = 0; i < 240; i++) this.world.step(STEP);
    }
    this.renderer.render(this.world, STEP);
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
