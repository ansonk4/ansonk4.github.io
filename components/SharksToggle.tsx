"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sharks";
/** Tells the ocean script (lib/ascii-sharks/boot.ts) to start or stop. */
const CHANGE_EVENT = "sharks-change";

/** Set before first paint by the inline script in app/layout.tsx. */
function isOn() {
  return document.documentElement.dataset.sharks !== "off";
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
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setEnabled(isOn());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const toggle = () => {
    const next = isOn() ? "off" : "on";
    document.documentElement.dataset.sharks = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The animation should still toggle if storage is blocked.
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
