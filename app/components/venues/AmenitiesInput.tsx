// components/venues/AmenitiesInput.tsx
"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AmenitiesInputProps {
  amenities: string[];
  onChange: (amenities: string[]) => void;
}

export function AmenitiesInput({ amenities, onChange }: AmenitiesInputProps) {
  const [draft, setDraft] = useState<string>("");

  function addAmenity(): void {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (amenities.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...amenities, trimmed]);
    setDraft("");
  }

  function removeAmenity(target: string): void {
    onChange(amenities.filter((a) => a !== target));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addAmenity();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Sea view, Air conditioning, Wi-Fi"
        />
        <Button type="button" variant="secondary" onClick={addAmenity}>
          Add
        </Button>
      </div>
      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-foreground"
            >
              {amenity}
              <button
                type="button"
                onClick={() => removeAmenity(amenity)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${amenity}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
