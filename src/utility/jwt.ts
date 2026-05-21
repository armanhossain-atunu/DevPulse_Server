import config from "../config";
import type { RUser } from "../types";
import jwt from "jsonwebtoken";

export const signToken = (Payload: RUser & { id: number }) => {
  const accessToken = jwt.sign(Payload, config.jwt_secret, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign(Payload, config.refresh_secret, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};
console.log(signToken( {id: 123, email: "user@example.com" , name: "John Doe" } as RUser & { id: number }));