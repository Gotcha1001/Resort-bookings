"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FacilitiesInputProps {
  facilities: string[];
  onChange: (facilities: string[]) => void;
}

export function FacilitiesInput({
  facilities,
  onChange,
}: FacilitiesInputProps) {
  const [draft, setDraft] = useState<string>("");

  function addFacility(): void {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (
      facilities.some(
        (facility) => facility.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setDraft("");
      return;
    }
    onChange([...facilities, trimmed]);
    setDraft("");
  }

  function removeFacility(target: string): void {
    onChange(facilities.filter((facility) => facility !== target));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addFacility();
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
        <Button type="button" variant="secondary" onClick={addFacility}>
          Add
        </Button>
      </div>
      {facilities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {facilities.map((facility) => (
            <span
              key={facility}
              className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
            >
              {facility}
              <button
                type="button"
                onClick={() => removeFacility(facility)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-100"
                aria-label={`Remove ${facility}`}
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
