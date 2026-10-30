"use client";

import { useEffect, useRef } from "react";

/** Animated ASCII ocean behind the page. The engine loads after hydration in its own chunk. */
export function AsciiSharks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let destroyed = false;
    let destroy: (() => void) | undefined;

    import("@/lib/ascii-sharks/engine").then(({ OceanEngine }) => {
      const canvas = canvasRef.current;
      if (destroyed || !canvas) return;
      const engine = new OceanEngine(canvas);
      destroy = () => engine.destroy();
    });

    return () => {
      destroyed = true;
      destroy?.();
    };
  }, []);

  return <canvas ref={canvasRef} className="ascii-sharks" aria-hidden="true" />;
}
