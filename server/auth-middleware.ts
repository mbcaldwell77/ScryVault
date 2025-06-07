import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, userSessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { getJWTSecret } from "./auth-config";

interface AccessPayload extends jwt.JwtPayload {
  userId: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    subscriptionTier: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as AccessPayload;
    
    // Verify session is still valid
    const session = await db.select()
      .from(userSessions)
      .where(and(
        eq(userSessions.token, token),
        gt(userSessions.expiresAt, new Date())
      ))
      .limit(1);

    if (session.length === 0) {
      return res.status(403).json({ error: "Invalid token" });
    }

    // Get user details
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: user[0].id,
      email: user[0].email,
      subscriptionTier: user[0].subscriptionTier || "free",
      role: user[0].role || "user"
    };

    next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Optional authentication - adds user if token is valid but doesn't require it
export const optionalAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(); // Continue without user
  }

  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as AccessPayload;
    
    const session = await db.select()
      .from(userSessions)
      .where(and(
        eq(userSessions.token, token),
        gt(userSessions.expiresAt, new Date())
      ))
      .limit(1);

    if (session.length > 0) {
      const user = await db.select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (user.length > 0) {
        req.user = {
          id: user[0].id,
          email: user[0].email,
          subscriptionTier: user[0].subscriptionTier || "free",
          role: user[0].role || "user"
        };
      }
    }
  } catch (error) {
    // Silently continue without user if token is invalid
  }

  next();
};

// Admin authentication - requires admin role
export const authenticateAdmin = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  // First check regular authentication
  await authenticateToken(req, res, () => {
    // Then check admin role
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  });
};