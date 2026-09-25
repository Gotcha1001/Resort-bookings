// components/ColorThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  COLOR_THEMES,
  getColorTheme,
  type ColorTheme,
} from "@/lib/colorThemes";

interface ColorThemeContextValue {
  /** The admin's chosen theme, resolved with the "teal" fallback. */
  theme: ColorTheme;
  /** Every theme available in the picker. */
  themes: ColorTheme[];
  /** True once we're in resolved dark mode (not "system" -- resolved). */
  isDark: boolean;
}

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

/**
 * Mount once, near the root (inside ConvexClientProvider and next-themes'
 * ThemeProvider). Sets CSS custom properties on <html> that the rest of the
 * app reads: --background, --surface, --border, --accent,
 * --accent-foreground, --muted.
 *
 * Dark mode: background/surface follow the chosen theme.
 * Light mode: background/surface are always pinned to white -- only
 * border/accent/muted follow the theme. This isn't a convention that
 * component authors have to remember; LightPalette (see lib/colorThemes.ts)
 * has no background field, so a theme literally cannot supply one.
 */
export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const settings = useQuery(api.resortSettings.get);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const theme = useMemo(
    () => getColorTheme(settings?.colorTheme),
    [settings?.colorTheme],
  );

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty(
      "--border",
      isDark ? theme.dark.border : theme.light.border,
    );
    root.style.setProperty(
      "--accent",
      isDark ? theme.dark.accent : theme.light.accent,
    );
    root.style.setProperty(
      "--accent-foreground",
      isDark ? theme.dark.accentForeground : theme.light.accentForeground,
    );
    root.style.setProperty(
      "--muted",
      isDark ? theme.dark.muted : theme.light.muted,
    );

    if (isDark) {
      root.style.setProperty("--background", theme.dark.background);
      root.style.setProperty("--surface", theme.dark.surface);
    } else {
      // Light mode background/surface are never themed -- always white.
      root.style.setProperty("--background", "#ffffff");
      root.style.setProperty("--surface", "#ffffff");
    }

    root.setAttribute("data-color-theme", theme.id);
  }, [theme, isDark]);

  const value = useMemo<ColorThemeContextValue>(
    () => ({ theme, themes: COLOR_THEMES, isDark }),
    [theme, isDark],
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme(): ColorThemeContextValue {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) {
    throw new Error("useColorTheme must be used inside <ColorThemeProvider>");
  }
  return ctx;
}
