import { Express } from "express";
import { createDataBackup, restoreFromBackup, validateEnvironmentSafety } from "./data-safety";
import { seedDevelopmentData, clearDevelopmentData } from "./seed-dev-data";
import { environmentLockdown } from "./environment-lockdown";

export function registerAdminRoutes(app: Express) {
  // Environment safety check endpoint
  app.get("/api/admin/environment", async (req, res) => {
    try {
      const lockdownStatus = environmentLockdown.getEnvironmentStatus();
      const dbValidation = await environmentLockdown.validateDatabaseConnection();
      const environmentInfo = await validateEnvironmentSafety();
      
      res.json({
        ...environmentInfo,
        lockdownStatus,
        dbValidation,
        protectionActive: true
      });
    } catch (error) {
      console.error("[ADMIN] Environment check failed:", error);
      res.status(500).json({ error: "Environment check failed" });
    }
  });

  // Create data backup
  app.post("/api/admin/backup", async (req, res) => {
    try {
      const { filename } = req.body;
      const backupPath = await createDataBackup(filename);
      res.json({ 
        success: true, 
        backupPath,
        message: "Backup created successfully"
      });
    } catch (error) {
      console.error("[ADMIN] Backup creation failed:", error);
      res.status(500).json({ error: "Backup creation failed" });
    }
  });

  // Restore from backup
  app.post("/api/admin/restore", async (req, res) => {
    try {
      const { backupPath } = req.body;
      if (!backupPath) {
        return res.status(400).json({ error: "Backup path is required" });
      }
      
      await restoreFromBackup(backupPath);
      res.json({ 
        success: true,
        message: "Data restored successfully"
      });
    } catch (error) {
      console.error("[ADMIN] Restore failed:", error);
      res.status(500).json({ error: "Restore failed" });
    }
  });

  // Seed development data (development only with lockdown protection)
  app.post("/api/admin/seed-dev", async (req, res) => {
    try {
      // CRITICAL: Multi-layer protection
      const lockdownStatus = environmentLockdown.getEnvironmentStatus();
      const dbValidation = await environmentLockdown.validateDatabaseConnection();
      
      console.log("[ADMIN] Seed request - Environment:", lockdownStatus.environment);
      console.log("[ADMIN] Seed request - Production check:", lockdownStatus.isProduction);
      console.log("[ADMIN] Seed request - Current book count:", dbValidation.bookCount);

      const books = await seedDevelopmentData();
      res.json({ 
        success: true, 
        booksCreated: books.length,
        environment: lockdownStatus.environment,
        protectionActive: true,
        message: "Development data seeded successfully with environment protection"
      });
    } catch (error) {
      console.error("[ADMIN] Development seeding blocked/failed:", error);
      res.status(403).json({ 
        error: error.message,
        environmentProtection: true,
        blocked: true
      });
    }
  });

  // Clear development data (development only with lockdown protection)
  app.delete("/api/admin/clear-dev", async (req, res) => {
    try {
      // CRITICAL: Multi-layer protection
      const lockdownStatus = environmentLockdown.getEnvironmentStatus();
      const dbValidation = await environmentLockdown.validateDatabaseConnection();
      
      console.log("[ADMIN] Clear request - Environment:", lockdownStatus.environment);
      console.log("[ADMIN] Clear request - Production check:", lockdownStatus.isProduction);
      console.log("[ADMIN] Clear request - Records to clear:", dbValidation.bookCount);

      await clearDevelopmentData();
      res.json({ 
        success: true,
        environment: lockdownStatus.environment,
        recordsCleared: dbValidation.bookCount,
        protectionActive: true,
        message: "Development data cleared successfully with environment protection"
      });
    } catch (error) {
      console.error("[ADMIN] Development data clearing blocked/failed:", error);
      res.status(403).json({ 
        error: error.message,
        environmentProtection: true,
        blocked: true
      });
    }
  });
}