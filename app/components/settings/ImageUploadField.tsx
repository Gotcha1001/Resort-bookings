// components/settings/ImageUploadField.tsx
"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface SignResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

interface ImageUploadFieldProps {
  value: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  /** Tailwind height class for the preview / drop box. */
  heightClass?: string;
  emptyLabel?: string;
  alt?: string;
  disabled?: boolean;
}

// Same signed-upload flow as RoomImageUpload: ask /api/cloudinary/sign for a
// signature, then upload straight to Cloudinary from the browser.
export function ImageUploadField({
  value,
  onChange,
  heightClass = "h-40",
  emptyLabel = "Click to upload a photo",
  alt = "Uploaded photo",
  disabled = false,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
      });
      if (!signResponse.ok) {
        throw new Error("Could not get an upload signature");
      }
      const sign: SignResponse = await signResponse.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sign.apiKey);
      formData.append("timestamp", String(sign.timestamp));
      formData.append("signature", sign.signature);
      formData.append("folder", sign.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      if (!uploadResponse.ok) {
        throw new Error("Upload to Cloudinary failed");
      }
      const uploaded: CloudinaryUploadResponse = await uploadResponse.json();
      onChange({ url: uploaded.secure_url, publicId: uploaded.public_id });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload image",
      );
    } finally {
      setIsUploading(false);
    }
  }

  const busy = isUploading || disabled;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFileSelected(event)}
      />

      {value ? (
        <div className="relative w-full overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL */}
          <img
            src={value.url}
            alt={alt}
            className={`${heightClass} w-full object-cover`}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={() => onChange(null)}
            disabled={busy}
            aria-label="Remove photo"
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`flex ${heightClass} w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent disabled:opacity-60`}
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImagePlus size={20} />
              {emptyLabel}
            </>
          )}
        </button>
      )}

      {value && !isUploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="text-xs text-muted-foreground underline"
        >
          Replace photo
        </button>
      )}
    </div>
  );
}
