import { Router } from "express";
import { verifyJWT } from "@/service/auth-service";
import { upload } from "@/utils/image-upload";
import { updateUserController } from "@/controller/user-controller";

const userRoutes = Router();

userRoutes.put(
  "/update-user",
  verifyJWT,
  upload.single("photo"),
  updateUserController
);

export default userRoutes;
