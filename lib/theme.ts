export type ThemeMode = "dark";

const STORAGE_KEY = "eldarin-theme";

/** Eldarin usa apenas tema escuro. */
export function getStoredTheme(): ThemeMode {
  return "dark";
}

export function applyTheme(_theme: ThemeMode = "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  try {
    localStorage.setItem(STORAGE_KEY, "dark");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("eldarin-theme-change"));
}

function themeColorRoot(): Element {
  const mesa = document.querySelector(".vtt-chrome[data-vtt-mesa]");
  return mesa ?? document.documentElement;
}

export function readThemeColor(varName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(themeColorRoot()).getPropertyValue(varName).trim();
  return value || fallback;
}
