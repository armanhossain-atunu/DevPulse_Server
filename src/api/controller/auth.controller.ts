import type { Request, Response } from "express";
import authServecs from "../services/auth.servecs";
import { sendResponse } from "../../utility/sendResponse";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  // Here you would typically call a service to create the user in the database
  const user = await authServecs.createUser({ name, email, password, role });
  if (!user) {
    return sendResponse(
      res,
      { message: "Failed to create user", error: true },
      400,
    );
  }
  sendResponse(res, { message: "User created successfully", data: user }, 201);
};
