"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export interface RoomImage {
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

interface RoomImageUploadProps {
  value: RoomImage | null;
  onChange: (image: RoomImage | null) => void;
}

export function RoomImageUpload({ value, onChange }: RoomImageUploadProps) {
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
        <div className="relative h-40 w-full overflow-hidden rounded-md border">
          <Image
            src={value.url}
            alt="Room or cottage photo"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={() => onChange(null)}
            disabled={isUploading}
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent"
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImagePlus size={20} />
              Click to upload a photo
            </>
          )}
        </button>
      )}
      {value && !isUploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-muted-foreground underline"
        >
          Replace photo
        </button>
      )}
    </div>
  );
}
