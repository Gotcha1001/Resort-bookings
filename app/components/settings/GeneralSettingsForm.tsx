// components/settings/GeneralSettingsForm.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField, type UploadedImage } from "./ImageUploadField";

// Resort name, tagline, logo and the public contact details. The name and
// logo show in the public navbar, admin navbar and admin sidebar; the contact
// details show on the Activities, Amenities and About pages.
export function GeneralSettingsForm() {
  const settings = useQuery(api.resortSettings.get);
  const updateSettings = useMutation(api.resortSettings.update);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<UploadedImage | null>(null);
  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load existing values once.
  useEffect(() => {
    if (settings === undefined || hydrated) return;
    setName(settings?.name ?? "");
    setTagline(settings?.tagline ?? "");
    setPhone(settings?.phone ?? "");
    setEmail(settings?.email ?? "");
    setAddress(settings?.address ?? "");
    if (settings?.logoUrl) {
      setLogo({ url: settings.logoUrl, publicId: settings.logoPublicId ?? "" });
      setInitialLogoUrl(settings.logoUrl);
    }
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
      // Only touch the logo if it actually changed, so saving the text
      // fields can never wipe (or re-delete) an untouched logo.
      const logoChanged = (logo?.url ?? null) !== initialLogoUrl;
      await updateSettings({
        name: trimmedName,
        tagline,
        phone,
        email,
        address,
        ...(logoChanged
          ? {
              logoUrl: logo ? logo.url : null,
              logoPublicId: logo ? logo.publicId : null,
            }
          : {}),
      });
      setInitialLogoUrl(logo?.url ?? null);
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
    return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-white p-6 dark:bg-surface"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Resort details
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The name and logo appear in the public navbar, admin navbar and admin
          sidebar.
        </p>
      </div>

      <div>
        <Label htmlFor="name">Resort name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mountain View Cottages"
          className="mt-1.5"
          maxLength={80}
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
          maxLength={200}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Shown on the public homepage and About page under the resort name.
        </p>
      </div>

      <div>
        <Label>Logo</Label>
        <div className="mt-1.5 max-w-xs">
          <ImageUploadField
            value={logo}
            onChange={setLogo}
            heightClass="h-32"
            emptyLabel="Upload a logo"
            alt="Resort logo"
            disabled={isSaving}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Leave empty to use the default icon.
        </p>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="text-base font-semibold text-foreground">
          Contact details
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown to guests on the Activities, Amenities and About pages. Leave a
          field blank to hide it.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone / WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +27 82 123 4567"
            className="mt-1.5"
            maxLength={40}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. stay@yourresort.co.za"
            className="mt-1.5"
            maxLength={120}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, town, province"
          className="mt-1.5"
          rows={2}
          maxLength={300}
        />
      </div>

      <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
