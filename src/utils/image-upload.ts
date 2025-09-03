import fs from "fs";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Storage configuration
// const storage = multer.diskStorage({
//   destination: "uploads/",
//   filename: (req, file, cb) => {
//     if (file) {
//       cb(null, Date.now() + path.extname(file.originalname));
//     }
//   },
// });

// // Export configured multer instance
// export const upload = multer({ storage });

// Save uploaded file (from multer)
export function saveLocalUpload(file: Express.Multer.File | undefined) {
  if (!file) return null;
  return `/uploads/${file.filename}`;
}

// Save image from URL (like Google profile pic)
export async function saveImageFromUrl(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch image: ${response.statusText}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = path.extname(url.split("?")[0]) || ".jpg"; // default jpg
  const finalName = filename + ext;

  const uploadPath = path.join(process.cwd(), "uploads", finalName);
  fs.writeFileSync(uploadPath, buffer);

  return `/uploads/${finalName}`;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for Multer
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => ({
//     folder: "chat_app_uploads", // your folder in Cloudinary
//     format: file.mimetype.split("/")[1], // jpg, png, etc
//     public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // unique name
//   }),
// });

// export const upload = multer({ storage });

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
    stream.end(buffer); // <--- here is where req.file.buffer goes
  });
}
