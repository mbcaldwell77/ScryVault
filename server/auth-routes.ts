import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users, userSessions, registerSchema, loginSchema } from "@shared/schema";
import { eq, and, lt, not, gt } from "drizzle-orm";
import { authenticateToken, authenticateAdmin, AuthenticatedRequest } from "./auth-middleware";
import { getJWTSecret, getJWTRefreshSecret, AUTH_CONFIG } from "./auth-config";

const router = Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
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
      subscriptionTier: "free"
    }).returning();

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: newUser[0].id }, 
      jwtSecret, 
      { expiresIn: "1h" }
    );
    
    const refreshToken = jwt.sign(
      { userId: newUser[0].id }, 
      jwtRefreshSecret, 
      { expiresIn: "7d" }
    );

    // Store session
    await db.insert(userSessions).values([
      {
        userId: newUser[0].id,
        token: accessToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      {
        userId: newUser[0].id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log(`[Auth] New user registered: ${email}`);

    res.status(201).json({
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        subscriptionTier: newUser[0].subscriptionTier,
        role: newUser[0].role || "user"
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return res.status(400).json({ error: "Invalid input data" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    console.debug(`[Auth] Login attempt: ${email}`);

    // Find user
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }


    // Verify password
    const isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get JWT secrets with fallback
    const jwtSecret = getJWTSecret();
    const jwtRefreshSecret = getJWTRefreshSecret();

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
      { expiresIn: "1h" }
    );
    
    const refreshToken = jwt.sign(
      { userId: user[0].id }, 
      jwtRefreshSecret, 
      { expiresIn: "7d" }
    );

    // Store session
    await db.insert(userSessions).values([
      {
        userId: user[0].id,
        token: accessToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      {
        userId: user[0].id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.debug(`[Auth] Login success for: ${email}`);

    res.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        subscriptionTier: user[0].subscriptionTier,
        role: user[0].role || "user"
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return res.status(400).json({ error: "Invalid input data" });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      await db.delete(userSessions).where(eq(userSessions.token, token));
      console.log("[Auth] User logged out");
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

async function handleRefresh(req: any, res: any) {
  try {
    const { refreshToken } = req.body;
    console.debug('[Auth] Refresh attempt');

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const jwtSecret = getJWTSecret();
    const jwtRefreshSecret = getJWTRefreshSecret();

    // Verify refresh token
    interface RefreshPayload extends jwt.JwtPayload {
      userId: number;
    }
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as RefreshPayload;

    // Find valid, non-expired session
    const session = await db.select()
      .from(userSessions)
      .where(and(eq(userSessions.token, refreshToken), gt(userSessions.expiresAt, new Date())))
      .limit(1);

    if (session.length === 0) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Get user
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: user[0].id }, 
      jwtSecret, 
      { expiresIn: "1h" }
    );
    
    const newRefreshToken = jwt.sign(
      { userId: user[0].id }, 
      jwtRefreshSecret, 
      { expiresIn: "7d" }
    );

    // Update session
    await db.delete(userSessions).where(eq(userSessions.token, refreshToken));
    await db.insert(userSessions).values([
      {
        userId: user[0].id,
        token: newAccessToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      {
        userId: user[0].id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.debug('[Auth] Refresh success');
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error("[Auth] Refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

// Refresh token
router.post("/refresh", handleRefresh);
// Legacy or alternate endpoint
router.post("/refresh-token", handleRefresh);

// All routes below this line require a valid access token
router.use(authenticateToken);

// Get current user profile
router.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db.select({
      id: users.id,
      email: users.email,
      subscriptionTier: users.subscriptionTier,
      role: users.role,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { id, email, subscriptionTier, role, createdAt } = user[0];
    res.json({ id, email, subscriptionTier, role, createdAt });
  } catch (error) {
    console.error("[Auth] Get profile error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Change password
router.post("/change-password", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    // Get current user data
    const userData = await db.select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (userData.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData[0].passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, req.user.id));

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update profile
router.put("/update-profile", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await db.select()
        .from(users)
        .where(and(eq(users.email, email), not(eq(users.id, req.user.id))))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email is already taken" });
      }
    }

    // Update user profile
    const updatedUser = await db.update(users)
      .set({
        email
      })
      .where(eq(users.id, req.user.id))
      .returning({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        createdAt: users.createdAt
      });

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: updatedUser[0], message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete account
router.delete("/delete-account", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Delete user sessions first
    await db.delete(userSessions)
      .where(eq(userSessions.userId, req.user.id));

    // Delete user account
    const deletedUser = await db.delete(users)
      .where(eq(users.id, req.user.id))
      .returning();

    if (deletedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin-only routes
// Get all users (admin only)
router.get("/admin/users", authenticateAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      subscriptionTier: users.subscriptionTier,
      role: users.role,
      createdAt: users.createdAt
    })
    .from(users)
    .orderBy(users.createdAt);

    res.json(allUsers);
  } catch (error) {
    console.error("[Admin] Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user role (admin only)
router.put("/admin/users/:id/role", authenticateAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
    }

    const updatedUser = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        role: users.role,
        createdAt: users.createdAt
      });

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`[Admin] User ${updatedUser[0].email} role updated to ${role} by ${req.user!.email}`);
    res.json({ user: updatedUser[0], message: "User role updated successfully" });
  } catch (error) {
    console.error("[Admin] Update user role error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// Delete user (admin only)
router.delete("/admin/users/:id", authenticateAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Delete user sessions first
    await db.delete(userSessions)
      .where(eq(userSessions.userId, userId));

    // Delete user
    const deletedUser = await db.delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`[Admin] User ${deletedUser[0].email} deleted by ${req.user!.email}`);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[Admin] Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;