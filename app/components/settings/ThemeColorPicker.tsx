// components/settings/ThemeColorPicker.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  COLOR_THEMES,
  DEFAULT_COLOR_THEME_ID,
  type ColorTheme,
} from "@/lib/colorThemes";

export function ThemeColorPicker() {
  const settings = useQuery(api.resortSettings.get);
  const updateSettings = useMutation(api.resortSettings.update);

  const activeId = settings?.colorTheme ?? DEFAULT_COLOR_THEME_ID;
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ColorTheme>(
    () => COLOR_THEMES.find((t) => t.id === activeId) ?? COLOR_THEMES[0],
  );

  async function handleSelect(theme: ColorTheme) {
    if (theme.id === activeId) return;
    setSavingId(theme.id);
    try {
      await updateSettings({ colorTheme: theme.id });
      toast.success(`Switched to ${theme.name}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't save theme",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
          Color theme
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Changes the background in dark mode and the border/accent colors in
          both modes, across the whole site. Light mode background always stays
          white.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COLOR_THEMES.map((theme) => {
          const isActive = theme.id === activeId;
          const isSaving = savingId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelect(theme)}
              onMouseEnter={() => setPreviewTheme(theme)}
              disabled={isSaving}
              className={`group flex flex-col items-center gap-2 rounded-2xl border p-3 text-left transition ${
                isActive
                  ? "border-teal-500 ring-2 ring-teal-500/30"
                  : "border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700"
              }`}
            >
              <span
                className="relative flex h-12 w-12 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
                style={{ background: theme.swatch }}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white drop-shadow" />
                ) : isActive ? (
                  <Check className="h-4 w-4 text-white drop-shadow" />
                ) : null}
              </span>
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                {theme.name}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-stone-400">
                {theme.kind}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live preview -- shows both modes side by side without touching the
          real site theme, since ColorThemeProvider only updates on save. */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
          Preview · {previewTheme.name}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className="rounded-2xl border p-4"
            style={{
              background: "#ffffff",
              borderColor: previewTheme.light.border,
            }}
          >
            <p className="mb-2 text-xs font-medium text-stone-400">
              Light mode
            </p>
            <div
              className="rounded-xl border p-3 text-sm font-medium"
              style={{
                borderColor: previewTheme.light.border,
                color: previewTheme.light.accent,
              }}
            >
              Sample card & accent text
            </div>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={{
              background: previewTheme.dark.background,
              borderColor: previewTheme.dark.border,
            }}
          >
            <p className="mb-2 text-xs font-medium text-white/50">Dark mode</p>
            <div
              className="rounded-xl border p-3 text-sm font-medium"
              style={{
                background: previewTheme.dark.surface,
                borderColor: previewTheme.dark.border,
                color: previewTheme.dark.accent,
              }}
            >
              Sample card & accent text
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
