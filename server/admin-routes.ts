import { Express } from 'express';
import { createDataBackup, restoreFromBackup, validateEnvironmentSafety } from './data-safety';
import { seedDevelopmentData, clearDevelopmentData } from './seed-dev-data';

export function registerAdminRoutes(app: Express) {
  // Environment safety check endpoint
  app.get('/api/admin/environment', async (req, res) => {
    try {
      const environmentInfo = await validateEnvironmentSafety();
      res.json(environmentInfo);
    } catch (error) {
      console.error('[ADMIN] Environment check failed:', error);
      res.status(500).json({ error: 'Environment check failed' });
    }
  });

  // Create data backup
  app.post('/api/admin/backup', async (req, res) => {
    try {
      const { filename } = req.body;
      const backupPath = await createDataBackup(filename);
      res.json({ 
        success: true, 
        backupPath,
        message: 'Backup created successfully'
      });
    } catch (error) {
      console.error('[ADMIN] Backup creation failed:', error);
      res.status(500).json({ error: 'Backup creation failed' });
    }
  });

  // Restore from backup
  app.post('/api/admin/restore', async (req, res) => {
    try {
      const { backupPath } = req.body;
      if (!backupPath) {
        return res.status(400).json({ error: 'Backup path is required' });
      }
      
      await restoreFromBackup(backupPath);
      res.json({ 
        success: true,
        message: 'Data restored successfully'
      });
    } catch (error) {
      console.error('[ADMIN] Restore failed:', error);
      res.status(500).json({ error: 'Restore failed' });
    }
  });

  // Seed development data (development only)
  app.post('/api/admin/seed-dev', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
          error: 'Development seeding not allowed in production' 
        });
      }

      const books = await seedDevelopmentData();
      res.json({ 
        success: true, 
        booksCreated: books.length,
        message: 'Development data seeded successfully'
      });
    } catch (error) {
      console.error('[ADMIN] Development seeding failed:', error);
      res.status(500).json({ error: 'Development seeding failed' });
    }
  });

  // Clear development data (development only)
  app.delete('/api/admin/clear-dev', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
          error: 'Development data clearing not allowed in production' 
        });
      }

      await clearDevelopmentData();
      res.json({ 
        success: true,
        message: 'Development data cleared successfully'
      });
    } catch (error) {
      console.error('[ADMIN] Development data clearing failed:', error);
      res.status(500).json({ error: 'Development data clearing failed' });
    }
  });
}