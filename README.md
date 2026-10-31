handcrafted with blood, sweat, tears, and Codex :)

## Ocean rendering

The animation uses a viewport-sized canvas with 128 CSS pixels of scroll margin
above and below it. The world and wake fields stay in page coordinates; only
rasterization and drawing are clipped. The canvas origin is aligned to physical
pixels to preserve glyph sharpness when scrolling.

This keeps the existing 30 fps scheduling, up-to-2× device pixel ratio, shark
shapes, shimmer, wake behavior, and `blur(9px) saturate(1.9)` glass. There is no
additional resolution or pixel-count cap. Hidden/offscreen pages stop scheduling
frames; resuming resets the clock so hidden time is not simulated. Scroll-only
repaints leave the animation and wake fields unchanged. Switching the ocean off
releases its pixel buffers.

Run `npm run test:sharks` for buffer, lifecycle, scroll/input, and reduced-motion
regressions. A headless Chrome pixel comparison against `9770544` covered all
eight shark species at three scroll positions and DPR 1, 1.25, and 2; all nine
visible canvas crops were identical. Desktop/mobile browser checks cover themes,
scrolling, resizing, reduced motion, and the persisted animation toggle.

Run `npm run sharks` after engine edits during development; `npm run build`
regenerates the bundle automatically before creating the static export.
