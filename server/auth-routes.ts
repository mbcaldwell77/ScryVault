import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, userSessions } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';
import { registerSchema, loginSchema } from '@shared/schema';
import { AuthenticatedRequest } from './auth-middleware';
import { getJWTSecret, getJWTRefreshSecret, AUTH_CONFIG } from './auth-config';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get JWT secrets with fallback
    const jwtSecret = getJWTSecret();
    const jwtRefreshSecret = getJWTRefreshSecret();

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.insert(users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      subscriptionTier: 'free',
      isActive: true,
      emailVerified: false
    }).returning();

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: newUser[0].id }, 
      jwtSecret, 
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: newUser[0].id }, 
      jwtRefreshSecret, 
      { expiresIn: '7d' }
    );

    // Store session
    await db.insert(userSessions).values({
      userId: newUser[0].id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    console.log(`[Auth] New user registered: ${email}`);

    res.status(201).json({
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        firstName: newUser[0].firstName,
        lastName: newUser[0].lastName,
        subscriptionTier: newUser[0].subscriptionTier
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user[0].isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify JWT secrets are configured
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!jwtSecret || !jwtRefreshSecret) {
      console.error('[Auth] JWT secrets not configured');
      return res.status(500).json({ error: 'Authentication service not configured' });
    }

    // Clean up expired sessions for this user
    await db.delete(userSessions)
      .where(and(
        eq(userSessions.userId, user[0].id),
        lt(userSessions.expiresAt, new Date())
      ));

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user[0].id }, 
      jwtSecret, 
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user[0].id }, 
      jwtRefreshSecret, 
      { expiresIn: '7d' }
    );

    // Store session
    await db.insert(userSessions).values({
      userId: user[0].id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    console.log(`[Auth] User logged in: ${email}`);

    res.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        subscriptionTier: user[0].subscriptionTier
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await db.delete(userSessions).where(eq(userSessions.token, token));
      console.log('[Auth] User logged out');
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!jwtSecret || !jwtRefreshSecret) {
      return res.status(500).json({ error: 'Authentication service not configured' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;

    // Find valid session
    const session = await db.select()
      .from(userSessions)
      .where(eq(userSessions.refreshToken, refreshToken))
      .limit(1);

    if (session.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0 || !user[0].isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: user[0].id }, 
      jwtSecret, 
      { expiresIn: '1h' }
    );
    
    const newRefreshToken = jwt.sign(
      { userId: user[0].id }, 
      jwtRefreshSecret, 
      { expiresIn: '7d' }
    );

    // Update session
    await db.update(userSessions)
      .set({
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      })
      .where(eq(userSessions.id, session[0].id));

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get current user profile
router.get('/me', async (req: AuthenticatedRequest, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Authentication service not configured' });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    const user = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      subscriptionTier: users.subscriptionTier,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, decoded.userId))
    .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('[Auth] Get profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;