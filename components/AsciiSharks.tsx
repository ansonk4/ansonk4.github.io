import { readFileSync } from "node:fs";
import path from "node:path";

// Built from lib/ascii-sharks/boot.ts by `npm run sharks` (runs before dev and build).
const oceanScript = readFileSync(path.join(process.cwd(), "lib/ascii-sharks/ascii-sharks.min.js"), "utf8")
  // Keep a stray "</script" in the bundle from ending the inline tag early.
  .replace(/<\/script/gi, "<\\/script");

/**
 * Animated ASCII ocean behind the page; a viewport-sized canvas draws the
 * visible slice of a page-sized world, so the ocean scrolls with the content.
 * The engine is inlined right after the canvas, so it starts as soon as the
 * page first paints, without waiting for any download or for React.
 */
export function AsciiSharks() {
  return (
    <>
      {/* The inline script sizes the canvas before React hydrates, so its width
          and height differ from the server HTML on purpose. */}
      <canvas className="ascii-sharks" aria-hidden="true" suppressHydrationWarning />
      <script dangerouslySetInnerHTML={{ __html: oceanScript }} />
    </>
  );
}
