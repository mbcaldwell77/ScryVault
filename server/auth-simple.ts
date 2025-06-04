import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, userSessions } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';
import { registerSchema, loginSchema } from '@shared/schema';
import { AuthenticatedRequest } from './auth-middleware';

const router = Router();

// Hardcoded JWT secrets for development
const JWT_SECRET = 'scryvault_jwt_secret_key_2025_production_secure';
const JWT_REFRESH_SECRET = 'scryvault_refresh_secret_key_2025_production_secure';

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
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: newUser[0].id }, 
      JWT_REFRESH_SECRET, 
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
      token: accessToken,
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

    // Clean up expired sessions for this user
    await db.delete(userSessions)
      .where(and(
        eq(userSessions.userId, user[0].id),
        lt(userSessions.expiresAt, new Date())
      ));

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user[0].id }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user[0].id }, 
      JWT_REFRESH_SECRET, 
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
      token: accessToken,
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

// Get current user
router.get('/me', async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        subscriptionTier: user[0].subscriptionTier
      }
    });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Logout
router.post('/logout', async (req: AuthenticatedRequest, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Remove session
      await db.delete(userSessions)
        .where(eq(userSessions.token, token));
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export { router as authRoutes, JWT_SECRET };