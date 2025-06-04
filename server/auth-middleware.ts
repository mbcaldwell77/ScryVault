import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, userSessions } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getJWTSecret } from './auth-config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    subscriptionTier: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Verify session is still valid
    const session = await db.select()
      .from(userSessions)
      .where(and(
        eq(userSessions.token, token),
        gt(userSessions.expiresAt, new Date())
      ))
      .limit(1);

    if (session.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user details
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0 || !user[0].isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = {
      id: user[0].id,
      email: user[0].email,
      subscriptionTier: user[0].subscriptionTier
    };

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional authentication - adds user if token is valid but doesn't require it
export const optionalAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without user
  }

  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as any;
    
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

      if (user.length > 0 && user[0].isActive) {
        req.user = {
          id: user[0].id,
          email: user[0].email,
          subscriptionTier: user[0].subscriptionTier
        };
      }
    }
  } catch (error) {
    // Silently continue without user if token is invalid
  }

  next();
};