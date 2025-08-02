import express from "express";
import mongoose from "mongoose";
import http from "http";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";
import dotenv from "dotenv";
import { logger } from "./logger";

import userRoutes from "./routes/userRoutes";

dotenv.config();

const PORT = process.env.PORT || 3000;
const dbURI: string = process.env.MONGODB_URI ?? "";

const app = express();

const server = http.createServer(app);

mongoose
  .connect(dbURI)
  .then(() => {
    server.listen(PORT, () => {
      // console.log(`Server started listening at PORT - ${PORT}`);
      logger.info(`Server started listening at PORT - ${PORT}`);
    });
  })
  .catch((error: Error) => {
    logger.error("Database connection error: ", error);
    process.exit(1); // Exit the process with failure
  });

app.use(express.json());

app.use(userRoutes);

app.use((error: AppError, req: Request, res: Response, next: NextFunction) => {
  error.statusCode = error.statusCode || 500;
  const errorMessage = error.message || "An unknown error occurred!";

  res.status(error.statusCode).json({
    status: error.statusCode,
    message: errorMessage,
  });
});
