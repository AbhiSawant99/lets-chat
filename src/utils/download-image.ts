import fetch from "node-fetch";
import { uploadToCloudinary } from "@/utils/image-upload";

// Download image from URL and save locally
export async function downloadImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  // get format from Content-Type
  const contentType = response.headers.get("content-type");
  let extension = ".jpg"; // default fallback

  if (contentType) {
    if (contentType.includes("png")) extension = ".png";
    else if (contentType.includes("webp")) extension = ".webp";
    else if (contentType.includes("jpeg")) extension = ".jpg";
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return uploadToCloudinary(buffer, "chat_app_uploads");
}
