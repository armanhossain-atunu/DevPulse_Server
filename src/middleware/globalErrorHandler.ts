import type { NextFunction, Request, Response } from "express";
import config from "../config";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(500).json({
    success: false,
    message:
      err instanceof Error ? err.message : "An unexpected error occurred.",
    stack:
      config.node_env === "development"
        ? undefined
        : err instanceof Error
          ? err.stack
          : undefined,
  });
};

export default globalErrorHandler;
