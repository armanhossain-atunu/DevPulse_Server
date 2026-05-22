import config from "../config";
import type { RUser } from "../types";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const verifyToken = (token: string, type: "access" | "refresh") => {
  const secret = type === "access" ? config.jwt_secret : config.refresh_secret;
  const decoded = jwt.verify(token, secret);
  return decoded as JwtPayload;
};

export const signToken = (user: RUser & { id: number }) => {
  const payload = { id: user.id, name: user.name, role: user.role };
  const accessToken = jwt.sign(payload, config.jwt_secret, { expiresIn: "1d" });
  const refreshToken = jwt.sign(payload, config.refresh_secret, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// export const signToken = (Payload: RUser & { id: number }) => {
//   const accessToken = jwt.sign(Payload, config.jwt_secret, {
//     expiresIn: "1d",
//   });
//   const refreshToken = jwt.sign(Payload, config.refresh_secret, {
//     expiresIn: "7d",
//   });
//   return { accessToken, refreshToken };
// };
