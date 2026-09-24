// app/(admin)/settings/page.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettingsPage() {
  const settings = useQuery(api.resortSettings.get);
  const updateSettings = useMutation(api.resortSettings.update);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load existing values once
  useEffect(() => {
    if (settings === undefined || hydrated) return;
    setName(settings?.name ?? "");
    setTagline(settings?.tagline ?? "");
    setLogoUrl(settings?.logoUrl ?? "");
    setHydrated(true);
  }, [settings, hydrated]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Resort name is required.");
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        name: trimmedName,
        tagline: tagline.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save settings",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (settings === undefined) {
    return <p className="text-sm text-stone-500">Loading settings…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
          Resort settings
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Name and tagline appear in the public navbar, landing page, and admin
          sidebar.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900"
      >
        <div>
          <Label htmlFor="name">Resort name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mountain View Cottages"
            className="mt-1.5"
            required
          />
        </div>

        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. A peaceful escape in the countryside"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-stone-400">
            Shown on the public homepage under the resort name.
          </p>
        </div>

        <div>
          <Label htmlFor="logoUrl">Logo URL (optional)</Label>
          <Input
            id="logoUrl"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-stone-400">
            Cloudinary or any public image URL. Leave blank to use the default
            icon.
          </p>
        </div>

        {logoUrl.trim() && (
          <div className="flex items-center gap-3 rounded-lg bg-stone-50 p-3 dark:bg-stone-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl.trim()}
              alt="Logo preview"
              className="h-12 w-12 rounded-lg object-cover"
            />
            <span className="text-sm text-stone-500">Preview</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSaving}
          className="w-full bg-teal-600 text-white hover:bg-teal-500 sm:w-auto"
        >
          {isSaving ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
