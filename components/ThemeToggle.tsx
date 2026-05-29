"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getCurrentTheme(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === "dark" ? "dark" : "light";
}

function SunIcon() {
  return (
    <svg className="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="m4.22 4.22 2.12 2.12" />
      <path d="m17.66 17.66 2.12 2.12" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="m4.22 19.78 2.12-2.12" />
      <path d="m17.66 6.34 2.12-2.12" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.1 14.4A7.7 7.7 0 0 1 9.6 3.9 8.4 8.4 0 1 0 20.1 14.4Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  const toggleTheme = () => {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem("theme", nextTheme);
    } catch {
      // The visual theme should still change if storage is blocked.
    }
    setTheme(nextTheme);
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === "dark"}
    >
      <span className="theme-toggle-icon">
        <SunIcon />
        <MoonIcon />
      </span>
    </button>
  );
}
