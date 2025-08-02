import { NextFunction, Request, Response } from "express";

const catchAsync =
  (func: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(func(req, res, next)).catch((err) => next(err));
  };

export default catchAsync;
