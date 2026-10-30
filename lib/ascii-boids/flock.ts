/**
 * A murmuration of boids (Reynolds' separation, alignment, cohesion) that lives
 * on a page-sized canvas but keeps to the slice of it that is on screen.
 * Positions are in CSS pixels; a spatial hash keeps neighbour lookups cheap.
 */

const NEIGHBOR_RADIUS = 46;
const SEPARATION_RADIUS = 15;
/** Only the first few neighbours count, like starlings tracking ~7 others. */
const MAX_NEIGHBORS = 9;
const MAX_SPEED = 165;
const MIN_SPEED = 80;
const MAX_FORCE = 260;
const POINTER_RADIUS = 95;
const SCATTER_RADIUS = 180;

export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class Flock {
  boids: Boid[] = [];
  width = 0;
  height = 0;
  time = 0;
  /** Visible slice of the canvas, in canvas pixels (the canvas spans the whole page). */
  view = { top: 0, height: 0 };
  pointer = { x: 0, y: 0, active: false };

  private head = new Int32Array(0);
  private next = new Int32Array(0);
  private gridCols = 0;
  private gridRows = 0;
  // A slow-moving point the flock drifts towards, so it swirls instead of settling.
  private lure = { x: 0, y: 0, phase: Math.random() * 100 };

  private get viewTop() {
    return this.view.height > 0 ? this.view.top : 0;
  }

  private get viewHeight() {
    return this.view.height > 0 ? Math.min(this.view.height, this.height) : this.height;
  }

  resize(width: number, height: number) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    this.gridCols = Math.max(1, Math.ceil(width / NEIGHBOR_RADIUS));
    this.gridRows = Math.max(1, Math.ceil(height / NEIGHBOR_RADIUS));
    this.head = new Int32Array(this.gridCols * this.gridRows);

    // About one bird per 2,400 px² of screen, within limits that stay smooth on phones.
    const target = Math.round(Math.min(Math.max((width * this.viewHeight) / 2400, 140), 520));
    while (this.boids.length > target) this.boids.pop();
    while (this.boids.length < target) this.boids.push(this.spawn(first));
    this.next = new Int32Array(this.boids.length);
  }

  /** Start in a loose cloud near the middle of the screen, all heading roughly the same way. */
  private spawn(clustered: boolean): Boid {
    const vh = this.viewHeight;
    const cx = clustered ? this.width * 0.5 : Math.random() * this.width;
    const cy = this.viewTop + (clustered ? vh * 0.45 : Math.random() * vh);
    const spread = clustered ? Math.min(this.width, vh) * 0.22 : 0;
    const angle = -0.4 + (Math.random() - 0.5) * 1.2;
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    return {
      x: cx + (Math.random() - 0.5) * spread * 2,
      y: cy + (Math.random() - 0.5) * spread,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };
  }

  /** A click startles nearby birds outwards. */
  scatter(x: number, y: number) {
    for (const b of this.boids) {
      const dx = b.x - x;
      const dy = b.y - y;
      const d = Math.hypot(dx, dy);
      if (d > SCATTER_RADIUS || d < 0.01) continue;
      const push = (1 - d / SCATTER_RADIUS) * 420;
      b.vx += (dx / d) * push;
      b.vy += (dy / d) * push;
    }
  }

  step(dt: number) {
    this.time += dt;
    const { boids, width: W } = this;
    if (W === 0 || boids.length === 0) return;
    this.buildGrid();
    this.moveLure();

    const top = this.viewTop;
    const vh = this.viewHeight;
    const margin = Math.min(W, vh) * 0.15;
    const r2 = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;
    const s2 = SEPARATION_RADIUS * SEPARATION_RADIUS;
    const { head, next, gridCols, gridRows, pointer, lure } = this;

    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      let ax = 0;
      let ay = 0;
      let avx = 0;
      let avy = 0;
      let cx = 0;
      let cy = 0;
      let sx = 0;
      let sy = 0;
      let n = 0;

      const gc = Math.min(gridCols - 1, Math.max(0, Math.floor(b.x / NEIGHBOR_RADIUS)));
      const gr = Math.min(gridRows - 1, Math.max(0, Math.floor(b.y / NEIGHBOR_RADIUS)));
      search: for (let r = gr - 1; r <= gr + 1; r++) {
        if (r < 0 || r >= gridRows) continue;
        for (let c = gc - 1; c <= gc + 1; c++) {
          if (c < 0 || c >= gridCols) continue;
          for (let j = head[r * gridCols + c]; j !== -1; j = next[j]) {
            if (j === i) continue;
            const o = boids[j];
            const dx = o.x - b.x;
            const dy = o.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > r2) continue;
            avx += o.vx;
            avy += o.vy;
            cx += dx;
            cy += dy;
            if (d2 < s2 && d2 > 0.0001) {
              sx -= dx / d2;
              sy -= dy / d2;
            }
            if (++n >= MAX_NEIGHBORS) break search;
          }
        }
      }

      if (n > 0) {
        const k = 1.6 * alignWeight(avx / n, avy / n, b);
        ax += k * (avx / n - b.vx);
        ay += k * (avy / n - b.vy);
        ax += (cx / n) * 3;
        ay += (cy / n) * 3;
        ax += sx * 2200;
        ay += sy * 2200;
      }

      // Steer towards the lure at a steady pull, so the flock wheels around the screen.
      const lx = lure.x - b.x;
      const ly = lure.y - b.y;
      const ld = Math.hypot(lx, ly) || 1;
      ax += (lx / ld) * 75;
      ay += (ly / ld) * 75;

      // Soft walls at the screen edges; the farther out, the harder the pull back.
      if (b.x < margin) ax += (margin - b.x) * 8;
      else if (b.x > W - margin) ax -= (b.x - (W - margin)) * 8;
      if (b.y < top + margin) ay += Math.min(top + margin - b.y, vh) * 8;
      else if (b.y > top + vh - margin) ay -= Math.min(b.y - (top + vh - margin), vh) * 8;

      if (pointer.active) {
        const dx = b.x - pointer.x;
        const dy = b.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < POINTER_RADIUS && d > 0.01) {
          const k = (1 - d / POINTER_RADIUS) * 1600;
          ax += (dx / d) * k;
          ay += (dy / d) * k;
        }
      }

      const a = Math.hypot(ax, ay);
      if (a > MAX_FORCE * 4) {
        ax *= (MAX_FORCE * 4) / a;
        ay *= (MAX_FORCE * 4) / a;
      }
      b.vx += ax * dt;
      b.vy += ay * dt;

      // Off screen (after a long scroll), fly faster so the view doesn't stay empty.
      const outside = Math.max(0, top - b.y, b.y - (top + vh));
      const maxSpeed = MAX_SPEED * (1 + 4 * Math.min(1, outside / Math.max(vh, 1)));
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > maxSpeed) {
        b.vx *= maxSpeed / speed;
        b.vy *= maxSpeed / speed;
      } else if (speed < MIN_SPEED && speed > 0.001) {
        b.vx *= MIN_SPEED / speed;
        b.vy *= MIN_SPEED / speed;
      }
    }

    for (const b of boids) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.x = Math.min(Math.max(b.x, -40), W + 40);
      b.y = Math.min(Math.max(b.y, -40), this.height + 40);
    }
  }

  private buildGrid() {
    const { head, next, boids, gridCols, gridRows } = this;
    head.fill(-1);
    for (let i = 0; i < boids.length; i++) {
      const c = Math.min(gridCols - 1, Math.max(0, Math.floor(boids[i].x / NEIGHBOR_RADIUS)));
      const r = Math.min(gridRows - 1, Math.max(0, Math.floor(boids[i].y / NEIGHBOR_RADIUS)));
      const cell = r * gridCols + c;
      next[i] = head[cell];
      head[cell] = i;
    }
  }

  /** A Lissajous path over the visible screen, following it when the page scrolls. */
  private moveLure() {
    const t = this.time * 0.11 + this.lure.phase;
    const vh = this.viewHeight;
    this.lure.x = this.width * (0.5 + 0.34 * Math.sin(t * 1.3) * Math.cos(t * 0.37));
    this.lure.y = this.viewTop + vh * (0.5 + 0.3 * Math.sin(t * 0.9 + 1.7));
  }
}

/** Alignment is weaker when a bird is already flying with its neighbours. */
function alignWeight(vx: number, vy: number, b: Boid) {
  const m = Math.hypot(vx, vy) * Math.hypot(b.vx, b.vy);
  if (m < 0.001) return 1;
  const cos = (vx * b.vx + vy * b.vy) / m;
  return 1.2 - 0.6 * Math.max(0, cos);
}
