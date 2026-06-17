import {
  DEFAULT_THEME_ID,
  getThemePresetOrDefault,
  type ThemeId,
  type ThemePreset,
} from "./theme-presets";

const THEME_CACHE_KEY = "rikaz-theme-id";

export function applyTheme(preset: ThemePreset) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  Object.entries(preset.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.dataset.theme = preset.id;
}

export function applyThemeById(themeId: string) {
  applyTheme(getThemePresetOrDefault(themeId));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_CACHE_KEY, themeId);
  }
}

export function readCachedThemeId(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  const cached = window.localStorage.getItem(THEME_CACHE_KEY);
  if (cached && getThemePresetOrDefault(cached).id === cached) {
    return cached as ThemeId;
  }
  return DEFAULT_THEME_ID;
}

export async function fetchAndApplyTheme() {
  try {
    const { apiUrl } = await import("./api-client");
    const res = await fetch(apiUrl("/api/theme"), { cache: "no-store", credentials: "same-origin" });
    const json = await res.json();
    if (json.success && json.data?.themeId) {
      applyThemeById(json.data.themeId);
      return json.data.themeId as string;
    }
  } catch {
    // fall back to cached theme below
  }

  applyThemeById(readCachedThemeId());
  return readCachedThemeId();
}

export { DEFAULT_THEME_ID, THEME_CACHE_KEY };
