/**
 * Conway's Game of Life drawn as ASCII cells on a canvas behind the page.
 *
 * The board covers the whole canvas and wraps at the edges. New cells come in
 * as dense glyphs and calm down to lighter ones as they age, so the busy parts
 * of the board stand out and settled still lifes recede. Cells that die leave
 * a short dotted trail. To keep the board from settling into ash, patterns are
 * dropped onto the visible part now and then, and clicking drops one too.
 */
import { PATTERNS, type Pattern } from "./patterns";

const FONT_SIZE = 14;
const LINE_HEIGHT = 1.2;
/** Milliseconds per generation. */
const TICK = 210;
/** Initial soup density. */
const DENSITY = 0.12;
/** Generations between dropped patterns, and the population below which they come faster. */
const DROP_EVERY = 26;
const QUIET_FRACTION = 0.025;
/** How many generations a dead cell keeps its trail. */
const TRAIL = 4;

// Glyphs by age: newborn, young, adult, settled.
const LIVE_GLYPHS = ["@", "#", "*", "+"];
const LIVE_ALPHA = [1, 0.85, 0.62, 0.38];
const TRAIL_GLYPHS = [":", ":", ".", "."];
const TRAIL_ALPHA = [0.42, 0.3, 0.2, 0.12];
const GRID_ALPHA = 0.07;

function liveBucket(age: number) {
  if (age < 1) return 0;
  if (age < 4) return 1;
  if (age < 14) return 2;
  return 3;
}

export class LifeEngine {
  private ctx: CanvasRenderingContext2D;
  private cols = 0;
  private rows = 0;
  private cellW = 8;
  private cellH = FONT_SIZE * LINE_HEIGHT;
  private width = 0;
  private height = 0;
  private dpr = 1;
  /** 1 when alive. */
  private cells = new Uint8Array(0);
  private next = new Uint8Array(0);
  /** Generations alive, or generations since death for dead cells (capped). */
  private age = new Uint16Array(0);
  private generation = 0;
  private sinceDrop = 0;
  private lastTick = 0;
  private raf = 0;
  private visible = true;
  private disposed = false;
  private viewTop = 0;
  private viewHeight = 0;
  private ink = "#111";
  private accent = "#df421f";
  private fontFamily: string;
  private lastPointerCell = -1;
  private reducedMotion: MediaQueryList;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private themeObserver: MutationObserver;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d canvas unavailable");
    this.ctx = ctx;
    this.fontFamily = getComputedStyle(canvas).fontFamily;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.readTheme();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(canvas);
    // The theme toggle flips data-theme on <html>; pick up the new ink colours.
    this.themeObserver = new MutationObserver(() => {
      this.readTheme();
      this.draw(1);
    });
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("scroll", this.updateView, { passive: true });
    window.addEventListener("resize", this.updateView, { passive: true });

    this.resize();
    // Canvas text can't trigger a webfont load; once the mono face is in, measure again.
    document.fonts?.load(`${FONT_SIZE}px ${this.fontFamily}`).then(() => {
      if (!this.disposed) this.resize();
    });
    this.schedule();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.themeObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("scroll", this.updateView);
    window.removeEventListener("resize", this.updateView);
  }

  private readTheme() {
    const style = getComputedStyle(document.documentElement);
    this.ink = style.getPropertyValue("--color-text").trim() || "#111";
    this.accent = style.getPropertyValue("--accent-orange-color").trim() || "#df421f";
  }

  /** Which rows of the canvas are on screen; only those are drawn. */
  private updateView = () => {
    const rect = this.canvas.getBoundingClientRect();
    const top = Math.max(0, -rect.top);
    const bottom = Math.min(rect.height, window.innerHeight - rect.top);
    this.viewTop = top;
    this.viewHeight = Math.max(0, bottom - top);
    if (this.reducedMotion.matches) this.draw(1);
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.ctx.font = `${FONT_SIZE}px ${this.fontFamily}`;
    this.cellW = Math.max(6, this.ctx.measureText("M").width);

    const cols = Math.ceil(rect.width / this.cellW);
    const rows = Math.ceil(rect.height / this.cellH);
    if (cols !== this.cols || rows !== this.rows) this.reshape(cols, rows);
    this.updateView();
    if (this.reducedMotion.matches) this.drawStill();
    else this.draw(1);
  }

  /** Resize the board, keeping what overlaps the old one. */
  private reshape(cols: number, rows: number) {
    const fresh = this.cols === 0;
    const cells = new Uint8Array(cols * rows);
    const age = new Uint16Array(cols * rows).fill(TRAIL);
    for (let y = 0; y < Math.min(rows, this.rows); y++) {
      for (let x = 0; x < Math.min(cols, this.cols); x++) {
        cells[y * cols + x] = this.cells[y * this.cols + x];
        age[y * cols + x] = this.age[y * this.cols + x];
      }
    }
    // Rows or columns that are new get their own soup.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!fresh && y < this.rows && x < this.cols) continue;
        if (Math.random() < DENSITY) {
          cells[y * cols + x] = 1;
          age[y * cols + x] = 20;
        }
      }
    }
    this.cols = cols;
    this.rows = rows;
    this.cells = cells;
    this.next = new Uint8Array(cols * rows);
    this.age = age;
  }

  private step() {
    const { cols, rows, cells, next, age } = this;
    for (let y = 0; y < rows; y++) {
      const up = ((y - 1 + rows) % rows) * cols;
      const row = y * cols;
      const down = ((y + 1) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const l = (x - 1 + cols) % cols;
        const r = (x + 1) % cols;
        const n =
          cells[up + l] + cells[up + x] + cells[up + r] +
          cells[row + l] + cells[row + r] +
          cells[down + l] + cells[down + x] + cells[down + r];
        const i = row + x;
        const alive = cells[i] ? n === 2 || n === 3 : n === 3;
        if (alive) {
          age[i] = cells[i] ? Math.min(age[i] + 1, 999) : 0;
        } else {
          age[i] = cells[i] ? 0 : Math.min(age[i] + 1, TRAIL);
        }
        next[i] = alive ? 1 : 0;
      }
    }
    this.next = cells;
    this.cells = next;
    this.generation++;
    this.sinceDrop++;

    // Keep the visible part of the board lively.
    const [rowStart, rowEnd] = this.visibleRows();
    const visibleCells = Math.max(1, (rowEnd - rowStart) * cols);
    let visiblePopulation = 0;
    for (let i = rowStart * cols; i < rowEnd * cols; i++) visiblePopulation += next[i];
    const quiet = visiblePopulation / visibleCells < QUIET_FRACTION;
    if (this.sinceDrop >= (quiet ? DROP_EVERY / 3 : DROP_EVERY)) {
      this.sinceDrop = 0;
      const y = rowStart + Math.floor(Math.random() * Math.max(1, rowEnd - rowStart));
      this.drop(Math.floor(Math.random() * cols), y);
    }
  }

  private visibleRows(): [number, number] {
    const start = Math.max(0, Math.floor(this.viewTop / this.cellH) - 1);
    const end = Math.min(this.rows, Math.ceil((this.viewTop + this.viewHeight) / this.cellH) + 1);
    return [start, end];
  }

  /** Stamp a random pattern, in a random orientation, centred near (cx, cy). */
  private drop(cx: number, cy: number, pattern?: Pattern) {
    const p = pattern ?? PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const flipX = Math.random() < 0.5 ? -1 : 1;
    const flipY = Math.random() < 0.5 ? -1 : 1;
    const swap = Math.random() < 0.5;
    for (const [px, py] of p.cells) {
      let dx = (px - p.width / 2) * flipX;
      let dy = (py - p.height / 2) * flipY;
      if (swap) [dx, dy] = [dy, dx];
      const x = (((cx + Math.round(dx)) % this.cols) + this.cols) % this.cols;
      const y = (((cy + Math.round(dy)) % this.rows) + this.rows) % this.rows;
      const i = y * this.cols + x;
      if (!this.cells[i]) this.age[i] = 0;
      this.cells[i] = 1;
    }
  }

  /**
   * Draws the visible rows. `t` runs 0 → 1 across a generation, fading newborn
   * cells in and fresh trails out so the board doesn't tick visibly.
   */
  private draw(t: number) {
    const { ctx, cols, cellW, cellH, cells, age } = this;
    if (cols === 0) return;
    const [rowStart, rowEnd] = this.visibleRows();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, rowStart * cellH, this.width, (rowEnd - rowStart) * cellH);
    ctx.font = `${FONT_SIZE}px ${this.fontFamily}`;
    ctx.textBaseline = "top";

    // A faint dot grid, so empty board still reads as ASCII.
    ctx.fillStyle = this.ink;
    ctx.globalAlpha = GRID_ALPHA;
    for (let y = rowStart; y < rowEnd; y++) {
      const py = y * cellH;
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (!cells[i] && age[i] >= TRAIL) ctx.fillText("·", x * cellW, py);
      }
    }

    // Trails, then live cells, each bucket in one alpha.
    for (let b = 0; b < TRAIL; b++) {
      ctx.globalAlpha = TRAIL_ALPHA[b] * (b === 0 ? 0.4 + 0.6 * (1 - t) : 1);
      for (let y = rowStart; y < rowEnd; y++) {
        const py = y * cellH;
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (!cells[i] && age[i] === b) ctx.fillText(TRAIL_GLYPHS[b], x * cellW, py);
        }
      }
    }
    for (let b = 0; b < LIVE_GLYPHS.length; b++) {
      ctx.fillStyle = b === 0 ? this.accent : this.ink;
      ctx.globalAlpha = LIVE_ALPHA[b] * (b === 0 ? Math.min(1, 0.25 + t * 1.5) : 1);
      for (let y = rowStart; y < rowEnd; y++) {
        const py = y * cellH;
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (cells[i] && liveBucket(age[i]) === b) ctx.fillText(LIVE_GLYPHS[b], x * cellW, py);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || this.reducedMotion.matches) return;
    this.lastTick = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    if (now - this.lastTick >= TICK) {
      // After a long pause, don't try to catch up.
      this.lastTick = now - TICK > this.lastTick + TICK ? now : this.lastTick + TICK;
      this.step();
    }
    this.draw(Math.min(1, (now - this.lastTick) / TICK));
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Reduced motion: let the soup settle a little, then show a single frame. */
  private drawStill() {
    while (this.generation < 60) this.step();
    this.draw(1);
  }

  private onMotionPreference = () => {
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      this.drawStill();
    } else {
      this.schedule();
    }
  };

  private cellAt(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.cellW);
    const y = Math.floor((e.clientY - rect.top) / this.cellH);
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    return { x, y };
  }

  /** The pointer sows a few cells as it moves, which sometimes catch. */
  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" || this.reducedMotion.matches) return;
    const cell = this.cellAt(e);
    if (!cell) return;
    const index = cell.y * this.cols + cell.x;
    if (index === this.lastPointerCell) return;
    this.lastPointerCell = index;
    if (Math.random() > 0.45) return;
    const x = (cell.x + Math.floor(Math.random() * 3) - 1 + this.cols) % this.cols;
    const y = (cell.y + Math.floor(Math.random() * 3) - 1 + this.rows) % this.rows;
    const i = y * this.cols + x;
    if (!this.cells[i]) this.age[i] = 0;
    this.cells[i] = 1;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.reducedMotion.matches) return;
    const cell = this.cellAt(e);
    if (cell) this.drop(cell.x, cell.y);
  };
}
