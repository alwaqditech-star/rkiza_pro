export const DEFAULT_THEME_ID = "navy-gold";

export const THEME_IDS = [
  "navy-gold",
  "forest-emerald",
  "royal-purple",
  "ocean-blue",
  "burgundy",
  "charcoal-copper",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  swatches: [string, string, string];
  vars: Record<string, string>;
}

function themeVars(
  primary: string,
  primaryLight: string,
  primaryPale: string,
  primaryDark: string,
  accent: string,
  accentLight: string,
  accentPale: string,
  sidebarMid: string,
  sidebarEnd: string,
  brandRgb: string,
): Record<string, string> {
  const [r, g, b] = brandRgb.split(",").map((v) => v.trim());
  const activeR = primaryLight.replace("#", "");
  const ar = parseInt(activeR.slice(0, 2), 16);
  const ag = parseInt(activeR.slice(2, 4), 16);
  const ab = parseInt(activeR.slice(4, 6), 16);

  return {
    "--teal": primary,
    "--teal-light": primaryLight,
    "--teal-pale": primaryPale,
    "--teal-dark": primaryDark,
    "--gold": accent,
    "--gold-light": accentLight,
    "--gold-pale": accentPale,
    "--ink-soft": primary,
    "--slate": primaryLight,
    "--mist": "#7A8BAD",
    "--silver": "#D0D9EC",
    "--fog": primaryPale,
    "--snow": "#f8fbfd",
    "--sidebar-grad-1": primaryDark,
    "--sidebar-grad-2": primary,
    "--sidebar-grad-3": sidebarEnd,
    "--sidebar-mid": sidebarMid,
    "--sidebar-active-bg": `rgba(${ar}, ${ag}, ${ab}, 0.35)`,
    "--sidebar-sub-active-bg": `rgba(${ar}, ${ag}, ${ab}, 0.28)`,
    "--sidebar-sub-border": `rgba(${ar}, ${ag}, ${ab}, 0.35)`,
    "--brand-rgb": brandRgb,
    "--shadow-sm": `0 1px 4px rgba(${r}, ${g}, ${b}, 0.08)`,
    "--shadow-md": `0 4px 16px rgba(${r}, ${g}, ${b}, 0.12)`,
    "--shadow-lg": `0 8px 32px rgba(${r}, ${g}, ${b}, 0.16)`,
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "navy-gold",
    name: "كحلي وذهبي",
    description: "المظهر الافتراضي — أزرق داكن مع لمسات ذهبية",
    swatches: ["#1B2A4A", "#c9973a", "#EEF2FA"],
    vars: themeVars(
      "#1B2A4A",
      "#2C4A7C",
      "#EEF2FA",
      "#0F1C33",
      "#c9973a",
      "#f0c060",
      "#fdf3e0",
      "#1B2A4A",
      "#1e3060",
      "27, 42, 74",
    ),
  },
  {
    id: "forest-emerald",
    name: "أخضر غابي",
    description: "طابع طبيعي هادئ بدرجات الأخضر والذهبي",
    swatches: ["#1B4332", "#B8860B", "#E8F5EE"],
    vars: themeVars(
      "#1B4332",
      "#2D6A4F",
      "#E8F5EE",
      "#0B2E1F",
      "#B8860B",
      "#D4A843",
      "#FDF6E3",
      "#1B4332",
      "#245941",
      "27, 67, 50",
    ),
  },
  {
    id: "royal-purple",
    name: "بنفسجي ملكي",
    description: "أناقة بنفسجي عميق مع ذهبي فاخر",
    swatches: ["#3D1F5C", "#D4AF37", "#F3E8F8"],
    vars: themeVars(
      "#3D1F5C",
      "#6B2D7B",
      "#F3E8F8",
      "#2A0F33",
      "#D4AF37",
      "#E8C547",
      "#FBF5DC",
      "#3D1F5C",
      "#4E2868",
      "61, 31, 92",
    ),
  },
  {
    id: "ocean-blue",
    name: "أزرق محيطي",
    description: "أزرق منعش مع لمسة برتقالية دافئة",
    swatches: ["#0C4A6E", "#EA580C", "#E0F2FE"],
    vars: themeVars(
      "#0C4A6E",
      "#0369A1",
      "#E0F2FE",
      "#082F49",
      "#EA580C",
      "#FB923C",
      "#FFF7ED",
      "#0C4A6E",
      "#0E5A82",
      "12, 74, 110",
    ),
  },
  {
    id: "burgundy",
    name: "خمري كلاسيكي",
    description: "أحمر خمري راقٍ مع ذهبي كلاسيكي",
    swatches: ["#6B1D3A", "#C9A227", "#FCE8EF"],
    vars: themeVars(
      "#6B1D3A",
      "#922B4A",
      "#FCE8EF",
      "#3D0F1F",
      "#C9A227",
      "#E0BC4A",
      "#FBF5DC",
      "#6B1D3A",
      "#7A2444",
      "107, 29, 58",
    ),
  },
  {
    id: "charcoal-copper",
    name: "فحمي ونحاسي",
    description: "رمادي داكن عصري مع لمسات نحاسية",
    swatches: ["#2D3142", "#B87333", "#EDF0F5"],
    vars: themeVars(
      "#2D3142",
      "#4F5D75",
      "#EDF0F5",
      "#1A1D26",
      "#B87333",
      "#D4924A",
      "#FDF3E8",
      "#2D3142",
      "#3A4054",
      "45, 49, 66",
    ),
  },
];

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

export function getThemePreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id);
}

export function getThemePresetOrDefault(id: string): ThemePreset {
  return getThemePreset(id) ?? THEME_PRESETS[0];
}
