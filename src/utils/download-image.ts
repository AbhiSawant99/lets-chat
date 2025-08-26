import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Download image from URL and save locally
export async function downloadImage(url: string, filenameBase: string) {
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

  // ensure uploads dir exists
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // final filename with extension
  const filename = `${filenameBase}${extension}`;
  const filePath = path.join(uploadDir, filename);

  // write file
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${filename}`; // relative path for MongoDB
}
