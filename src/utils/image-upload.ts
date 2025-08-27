import fs from "fs";
import multer from "multer";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    if (file) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  },
});

// Export configured multer instance
export const upload = multer({ storage });

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
