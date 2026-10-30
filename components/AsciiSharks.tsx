"use client";

import { useEffect, useRef, useState } from "react";
import type { SharkKind, SharkSpec } from "@/lib/ascii-sharks/world";

const STORAGE_KEY = "sharks";
const KINDS: SharkKind[] = ["classic", "hammerhead", "zebra", "tiger", "greathammer", "mako", "thresher", "nurse"];
const SIZES = [1, 0.88, 0.8, 0.72];

/** A different mix of species on every visit, biggest first. */
function pickSharks(): SharkSpec[] {
  const kinds = [...KINDS];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return SIZES.map((size, i) => ({ kind: kinds[i], size }));
}

function WaveIcon() {
  return (
    <svg className="sharks-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0" />
      <path d="M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0" />
      <path className="sharks-icon-slash" d="M4 21 20 3" />
    </svg>
  );
}

/** Animated ASCII ocean behind the page, with a toggle beside the theme switch. */
export function AsciiSharks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage can be blocked; default to on.
    }
    setEnabled(stored !== "off");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let destroyed = false;
    let destroy: (() => void) | undefined;

    // The engine loads in its own chunk, only when the animation is on.
    import("@/lib/ascii-sharks/engine").then(({ OceanEngine }) => {
      const canvas = canvasRef.current;
      if (destroyed || !canvas) return;
      const engine = new OceanEngine(canvas, pickSharks());
      destroy = () => engine.destroy();
    });

    return () => {
      destroyed = true;
      destroy?.();
    };
  }, [enabled]);

  const toggle = () => {
    const next = !enabled;
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // The toggle should still work if storage is blocked.
    }
    setEnabled(next);
  };

  return (
    <>
      {enabled && <canvas ref={canvasRef} className="ascii-sharks" aria-hidden="true" />}
      <button
        className="sharks-toggle"
        type="button"
        onClick={toggle}
        aria-label={enabled === false ? "Turn on background animation" : "Turn off background animation"}
        aria-pressed={enabled !== false}
        data-off={enabled === false ? "" : undefined}
      >
        <WaveIcon />
      </button>
    </>
  );
}
