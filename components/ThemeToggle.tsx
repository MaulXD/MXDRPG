"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type ThemeMode } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    setTheme(getStoredTheme());
    const onChange = () => setTheme(getStoredTheme());
    window.addEventListener("eldarin-theme-change", onChange);
    return () => window.removeEventListener("eldarin-theme-change", onChange);
  }, []);

  function toggle() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" width="1em" height="1em">
            <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.75" />
            <path
              d="M12 2.5v2.2M12 19.3v2.2M4.5 12h2.2M17.3 12h2.2M6.4 6.4l1.55 1.55M16.05 16.05l1.55 1.55M17.6 6.4l-1.55 1.55M7.95 16.05 6.4 17.6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" width="1em" height="1em">
            <path
              d="M18.5 14.2a7.5 7.5 0 0 1-11-10 9 9 0 1 0 11 10z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="color-mix(in srgb, currentColor 12%, transparent)"
            />
          </svg>
        )}
      </span>
      <span className="theme-toggle-label">{theme === "dark" ? "Claro" : "Escuro"}</span>
    </button>
  );
}
