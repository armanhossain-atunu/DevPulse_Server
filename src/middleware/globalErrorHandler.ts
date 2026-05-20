import type { NextFunction, Request, Response } from "express";

const globalErrorHandler = (err:unknown, req:Request, res:Response, next:NextFunction) => {
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "An unexpected error occurred.",
    stack: err instanceof Error ? err.stack : undefined,
  });
};

export default globalErrorHandler;
