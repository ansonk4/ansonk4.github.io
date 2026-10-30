"use client";

import { useEffect, useRef } from "react";
import { useSharksEnabled } from "@/components/AsciiSharks";

/** Game of Life in ASCII behind the page; it scrolls with the content. Shares the sharks' on/off toggle. */
export function AsciiLife() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useSharksEnabled();

  useEffect(() => {
    if (!enabled) return;
    let destroyed = false;
    let destroy: (() => void) | undefined;

    // The engine loads in its own chunk, only when the animation is on.
    import("@/lib/ascii-life/engine").then(({ LifeEngine }) => {
      const canvas = canvasRef.current;
      if (destroyed || !canvas) return;
      const engine = new LifeEngine(canvas);
      destroy = () => engine.destroy();
    });

    return () => {
      destroyed = true;
      destroy?.();
    };
  }, [enabled]);

  return enabled ? <canvas ref={canvasRef} className="ascii-life" aria-hidden="true" /> : null;
}
