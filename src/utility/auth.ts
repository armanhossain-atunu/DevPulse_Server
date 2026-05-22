import type { NextFunction, Request, Response } from "express";
import { sendResponse } from "./sendResponse";
import { verifyToken } from "./jwt";
import authServecs from "../api/services/auth.servecs";

export const auth = async (req: Request, res: Response, next: NextFunction) => {

    const Token = req.headers.authorization
    if(!Token){
        return sendResponse(res, { message: "No token provided", error: true }, 401);
    }

    const Payload = verifyToken(Token, "access");
    if (!Payload) {
        return sendResponse(res, { message: "Invalid token", error: true }, 401);
    }
    const user = await authServecs.getUserById(Payload.id);
    if (!user) {
        return sendResponse(res, { message: "User not found", error: true }, 404);
    }
    req.user = user;
    next();
}