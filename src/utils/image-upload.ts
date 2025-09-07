import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "@/AppError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// memory storage so the file is kept in buffer (not written to disk)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicUrl: string) {
  const publicIdClean = getPublicIdFromUrl(publicUrl);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicIdClean,
      { invalidate: true },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
}

function getPublicIdFromUrl(url: string): string {
  const parts = url.split("/upload/");
  if (parts.length < 2) throw new AppError("Invalid Cloudinary URL");

  const path = parts[1].split("/");
  path.shift();
  const fullId = path.join("/");

  // Strip extension (.jpg, .png, etc.)
  return fullId.replace(/\.[^/.]+$/, "");
}
