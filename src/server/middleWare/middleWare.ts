import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
console.log("JWT_SECRET being used:", JWT_SECRET);

export interface AuthRequest extends Request {
  user?: { userId: string; email: string, username: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
console.log("Incoming Authorization header:", req.headers.authorization);
console.log("JWT_SECRET being used to verify:", JWT_SECRET);

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string, username: string };
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
