"use client";

import { useEffect, useRef } from "react";
import { useSharksEnabled } from "@/components/AsciiSharks";

/** Animated ASCII murmuration behind the page; it scrolls with the content. */
export function AsciiBoids() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useSharksEnabled();

  useEffect(() => {
    if (!enabled) return;
    let destroyed = false;
    let destroy: (() => void) | undefined;

    // The engine loads in its own chunk, only when the animation is on.
    import("@/lib/ascii-boids/engine").then(({ FlockEngine }) => {
      const canvas = canvasRef.current;
      if (destroyed || !canvas) return;
      const engine = new FlockEngine(canvas);
      destroy = () => engine.destroy();
    });

    return () => {
      destroyed = true;
      destroy?.();
    };
  }, [enabled]);

  return enabled ? <canvas ref={canvasRef} className="ascii-boids" aria-hidden="true" /> : null;
}
