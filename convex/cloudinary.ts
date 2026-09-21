// convex/cloudinary.ts
"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { createHash } from "crypto";

export const deleteImage = internalAction({
  args: { publicId: v.string() },
  handler: async (_ctx, { publicId }) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      console.error(
        "[cloudinary] Missing env vars; skipping delete for",
        publicId,
      );
      return;
    }
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
    const signature = createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      },
    );
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        "[cloudinary] Delete failed for",
        publicId,
        response.status,
        text,
      );
    }
  },
});
