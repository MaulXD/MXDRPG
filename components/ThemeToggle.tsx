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
        {theme === "dark" ? "☀" : "☾"}
      </span>
      <span className="theme-toggle-label">{theme === "dark" ? "Claro" : "Escuro"}</span>
    </button>
  );
}
