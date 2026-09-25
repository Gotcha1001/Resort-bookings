// components/settings/AboutSettingsForm.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_ABOUT_HEADING,
  DEFAULT_LOCATION_TEXT,
  defaultAboutStory,
} from "@/lib/siteContent";

// The text blocks of the About page: heading + story + "where to find us".
// Blank fields fall back to friendly default text on the public page, so
// nothing is ever empty for guests.
export function AboutSettingsForm() {
  const settings = useQuery(api.resortSettings.get);
  const updateSettings = useMutation(api.resortSettings.update);

  const [heading, setHeading] = useState("");
  const [story, setStory] = useState("");
  const [locationText, setLocationText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const resortName = settings?.name ?? "Our Resort";

  useEffect(() => {
    if (settings === undefined || hydrated) return;
    setHeading(settings?.aboutHeading ?? "");
    setStory(settings?.aboutStory ?? "");
    setLocationText(settings?.aboutLocationText ?? "");
    setHydrated(true);
  }, [settings, hydrated]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) {
      toast.error("Save your resort name under the General tab first.");
      return;
    }
    setIsSaving(true);
    try {
      await updateSettings({
        aboutHeading: heading,
        aboutStory: story,
        aboutLocationText: locationText,
      });
      toast.success("About page saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save About page",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (settings === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-white p-6 dark:bg-surface"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          About page text
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Leave a field blank to show the default wording on the public page.
        </p>
      </div>

      <div>
        <Label htmlFor="aboutHeading">Story heading</Label>
        <Input
          id="aboutHeading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder={DEFAULT_ABOUT_HEADING}
          className="mt-1.5"
          maxLength={120}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="aboutStory">Our story</Label>
          <button
            type="button"
            onClick={() => setStory(defaultAboutStory(resortName))}
            className="text-xs text-accent underline"
          >
            Start from example text
          </button>
        </div>
        <Textarea
          id="aboutStory"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder={defaultAboutStory(resortName)}
          className="mt-1.5"
          rows={9}
          maxLength={10000}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Separate paragraphs with a blank line.
        </p>
      </div>

      <div>
        <Label htmlFor="aboutLocation">Where to find us</Label>
        <Textarea
          id="aboutLocation"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder={DEFAULT_LOCATION_TEXT}
          className="mt-1.5"
          rows={3}
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Your address from the General tab is shown next to this.
        </p>
      </div>

      <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Saving…" : "Save About page"}
      </Button>
    </form>
  );
}
