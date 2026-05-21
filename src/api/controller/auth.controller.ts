import type { Request, Response } from "express";
import authServecs from "../services/auth.servecs";
import { sendResponse } from "../../utility/sendResponse";
import { signToken } from "../../utility/jwt";
// user registration
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
  sendResponse(res, { message: "User registered successfully", data: user }, 201);
};
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authServecs.validateUser(email,password)
  if (!user) {
    return sendResponse(
      res,
      { message: "Invalid email or password", error: true },
      401,
    );
  }
  const { accessToken, refreshToken } = signToken(user);
  const result ={
    user,
    accessToken,
    refreshToken
   }
   return sendResponse(res, { message: "Login successful", data: result }, 200);
  }
  // sendResponse(res, { message: "Login successful", data: { user, accessToken, refreshToken } }, 200);

