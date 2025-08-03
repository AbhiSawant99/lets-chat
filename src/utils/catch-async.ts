import { NextFunction, Request, Response } from "express";
import { AppError } from "../AppError";

const catchAsync =
  (func: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(func(req, res, next)).catch((err) =>
      next(new AppError(err))
    );
  };

export default catchAsync;
