// lib/colorThemes.ts
//
// The theme library the admin picks from in Settings. A theme only ever
// controls: (1) the page/component background in dark mode, and (2) the
// border/accent colors in both modes. Light-mode background is not a field
// on this type at all -- it's always white, enforced structurally rather
// than by convention, so nothing can accidentally theme it.

export interface DarkPalette {
  /** Page background. Solid hex/rgb or a CSS gradient string. */
  background: string;
  /** Card / panel background, sits on top of `background`. */
  surface: string;
  border: string;
  accent: string;
  /** Text/icon color to use on top of `accent`. */
  accentForeground: string;
  /** Secondary/quiet text or fills. */
  muted: string;
}

export interface LightPalette {
  // Intentionally no `background` or `surface` field here -- light mode
  // background stays white everywhere, always.
  border: string;
  accent: string;
  accentForeground: string;
  muted: string;
}

export interface ColorTheme {
  id: string;
  name: string;
  kind: "solid" | "gradient";
  /** CSS background value used for the small swatch in the picker UI. */
  swatch: string;
  dark: DarkPalette;
  light: LightPalette;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "teal",
    name: "Teal (default)",
    kind: "solid",
    swatch: "#0d9488",
    dark: {
      background: "#0c0a09",
      surface: "#1c1917",
      border: "#292524",
      accent: "#2dd4bf",
      accentForeground: "#042f2e",
      muted: "#78716c",
    },
    light: {
      border: "#e7e5e4",
      accent: "#0d9488",
      accentForeground: "#f0fdfa",
      muted: "#a8a29e",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    kind: "solid",
    swatch: "#0284c7",
    dark: {
      background: "#0a0f1a",
      surface: "#111827",
      border: "#1f2937",
      accent: "#38bdf8",
      accentForeground: "#082f49",
      muted: "#64748b",
    },
    light: {
      border: "#e2e8f0",
      accent: "#0284c7",
      accentForeground: "#f0f9ff",
      muted: "#94a3b8",
    },
  },
  {
    id: "forest",
    name: "Forest",
    kind: "solid",
    swatch: "#15803d",
    dark: {
      background: "#0a0f0a",
      surface: "#111c13",
      border: "#1f2e22",
      accent: "#4ade80",
      accentForeground: "#052e16",
      muted: "#5f6f63",
    },
    light: {
      border: "#dcfce7",
      accent: "#15803d",
      accentForeground: "#f0fdf4",
      muted: "#9ab5a2",
    },
  },
  {
    id: "amber",
    name: "Amber",
    kind: "solid",
    swatch: "#d97706",
    dark: {
      background: "#120d05",
      surface: "#1c140a",
      border: "#2e2210",
      accent: "#fbbf24",
      accentForeground: "#451a03",
      muted: "#8a7554",
    },
    light: {
      border: "#fde9c8",
      accent: "#d97706",
      accentForeground: "#fffbeb",
      muted: "#d1a86a",
    },
  },
  {
    id: "rose",
    name: "Rose",
    kind: "solid",
    swatch: "#e11d48",
    dark: {
      background: "#12060a",
      surface: "#1d0d12",
      border: "#301a20",
      accent: "#fb7185",
      accentForeground: "#4c0519",
      muted: "#8a5c66",
    },
    light: {
      border: "#fecdd3",
      accent: "#e11d48",
      accentForeground: "#fff1f2",
      muted: "#d99aa5",
    },
  },
  {
    id: "slate",
    name: "Slate",
    kind: "solid",
    swatch: "#475569",
    dark: {
      background: "#0b0e13",
      surface: "#151920",
      border: "#242a33",
      accent: "#94a3b8",
      accentForeground: "#0f172a",
      muted: "#5f6b7a",
    },
    light: {
      border: "#e2e8f0",
      accent: "#475569",
      accentForeground: "#f8fafc",
      muted: "#a3adba",
    },
  },
  {
    id: "monochrome",
    name: "Monochrome",
    kind: "solid",
    swatch: "#18181b",
    dark: {
      background: "#000000",
      surface: "#111111",
      border: "#262626",
      accent: "#f4f4f5",
      accentForeground: "#111111",
      muted: "#737373",
    },
    light: {
      border: "#e5e5e5",
      accent: "#18181b",
      accentForeground: "#fafafa",
      muted: "#a3a3a3",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    kind: "gradient",
    swatch: "linear-gradient(135deg, #f97316 0%, #db2777 100%)",
    dark: {
      background:
        "linear-gradient(160deg, #1a0a08 0%, #2b0a1a 55%, #1a0a08 100%)",
      surface: "rgba(41, 20, 24, 0.72)",
      border: "#432032",
      accent: "#fb923c",
      accentForeground: "#431407",
      muted: "#a17272",
    },
    light: {
      border: "#fed7aa",
      accent: "#ea580c",
      accentForeground: "#fff7ed",
      muted: "#e0aa8a",
    },
  },
  {
    id: "violet-dusk",
    name: "Violet Dusk",
    kind: "gradient",
    swatch: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
    dark: {
      background:
        "linear-gradient(160deg, #0d0a17 0%, #170f2e 55%, #0d0a17 100%)",
      surface: "rgba(26, 20, 46, 0.72)",
      border: "#2e2350",
      accent: "#a78bfa",
      accentForeground: "#1e1b4b",
      muted: "#8b83b0",
    },
    light: {
      border: "#ede9fe",
      accent: "#7c3aed",
      accentForeground: "#f5f3ff",
      muted: "#c4b8ec",
    },
  },
  {
    id: "emerald-tide",
    name: "Emerald Tide",
    kind: "gradient",
    swatch: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
    dark: {
      background:
        "linear-gradient(160deg, #051512 0%, #062119 55%, #051512 100%)",
      surface: "rgba(9, 33, 27, 0.72)",
      border: "#0f3a2d",
      accent: "#2dd4bf",
      accentForeground: "#022c22",
      muted: "#6fa393",
    },
    light: {
      border: "#ccfbf1",
      accent: "#0d9488",
      accentForeground: "#f0fdfa",
      muted: "#9cd9cc",
    },
  },
  {
    id: "coral-reef",
    name: "Coral Reef",
    kind: "gradient",
    swatch: "linear-gradient(135deg, #fb7185 0%, #14b8a6 100%)",
    dark: {
      background:
        "linear-gradient(160deg, #14100c 0%, #1c1414 45%, #0c1716 100%)",
      surface: "rgba(30, 24, 24, 0.72)",
      border: "#3a2626",
      accent: "#fda4af",
      accentForeground: "#4c0519",
      muted: "#a68686",
    },
    light: {
      border: "#fecdd3",
      accent: "#e11d48",
      accentForeground: "#fff1f2",
      muted: "#dba3ac",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    kind: "gradient",
    swatch: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    dark: {
      background:
        "linear-gradient(160deg, #05070c 0%, #0b1120 55%, #05070c 100%)",
      surface: "rgba(15, 23, 42, 0.72)",
      border: "#1e293b",
      accent: "#818cf8",
      accentForeground: "#1e1b4b",
      muted: "#5b6478",
    },
    light: {
      border: "#e2e8f0",
      accent: "#334155",
      accentForeground: "#f8fafc",
      muted: "#aab3c2",
    },
  },
];

export const DEFAULT_COLOR_THEME_ID = "teal";

export const COLOR_THEME_IDS = COLOR_THEMES.map((t) => t.id);

export function getColorTheme(id: string | undefined | null): ColorTheme {
  return (
    COLOR_THEMES.find((t) => t.id === id) ??
    COLOR_THEMES.find((t) => t.id === DEFAULT_COLOR_THEME_ID)!
  );
}
