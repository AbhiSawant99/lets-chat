import type { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";
import dotenv from "dotenv";
dotenv.config();

const http = require("http");
const mongoose = require("mongoose");
const express = require("express");
const userRoutes = require("./routes/userRoutes");

const PORT = process.env.PORT || 3000;
const dbURI = process.env.MONGODB_URI;

const app = express();

const server = http.createServer(app);

mongoose
  .connect(dbURI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server started listening at PORT - ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.log("Database connection error : ", error);
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
