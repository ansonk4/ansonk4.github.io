"use client";

import { useEffect, useRef, useState } from "react";
import type { SharkKind, SharkSpec } from "@/lib/ascii-sharks/world";

const STORAGE_KEY = "sharks";
const CHANGE_EVENT = "sharks-change";
const KINDS: SharkKind[] = ["classic", "hammerhead", "zebra", "tiger", "greathammer", "mako", "thresher", "nurse"];
// The ocean covers the whole page, so a few more sharks than one screen would need.
const SIZES = [1, 0.9, 0.82, 0.76, 0.7];

/** A different mix of species on every visit, biggest first. */
function pickSharks(): SharkSpec[] {
  const kinds = [...KINDS];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return SIZES.map((size, i) => ({ kind: kinds[i], size }));
}

function readEnabled() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // Storage can be blocked; default to on.
    return true;
  }
}

/** Whether the background animation is on, kept in sync between the background and its toggle. */
export function useSharksEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setEnabled(readEnabled());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  return enabled;
}

/** Animated ASCII ocean behind the page; it scrolls with the content. */
export function AsciiSharks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useSharksEnabled();

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

  return enabled ? <canvas ref={canvasRef} className="ascii-sharks" aria-hidden="true" /> : null;
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

export function SharksToggle() {
  const enabled = useSharksEnabled();

  const toggle = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled === false ? "on" : "off");
    } catch {
      // Without storage the choice can't be kept, so leave the animation as it is.
      return;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
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
  );
}
