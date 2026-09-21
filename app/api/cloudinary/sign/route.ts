import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";

// Signed uploads (no unsigned upload preset): the browser asks this route
// for a one-time signature, then uploads the file straight to Cloudinary
// itself. The API secret never leaves the server.
export async function POST(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary env vars are not configured" },
      { status: 500 },
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "resort-venues";

  // Every param that will be sent to Cloudinary (besides file, cloud_name,
  // api_key and signature) must be included here, sorted alphabetically.
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return NextResponse.json({
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  });
}
