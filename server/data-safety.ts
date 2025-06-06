import { db } from './db';
import { books } from '@shared/schema';
import fs from 'fs/promises';
import path from 'path';

export interface DataBackup {
  timestamp: string;
  environment: string;
  bookCount: number;
  books: any[];
}

export async function createDataBackup(filename?: string): Promise<string> {
  try {
    const allBooks = await db.select().from(books);
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'unknown';
    
    const backup: DataBackup = {
      timestamp,
      environment,
      bookCount: allBooks.length,
      books: allBooks
    };
    
    const backupFilename = filename || `backup-${environment}-${timestamp.replace(/[:.]/g, '-')}.json`;
    const backupPath = path.join(process.cwd(), 'backups', backupFilename);
    
    // Ensure backup directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    // Write backup file
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`[BACKUP] Created backup: ${backupPath}`);
    console.log(`[BACKUP] Environment: ${environment}, Books: ${allBooks.length}`);
    
    return backupPath;
  } catch (error) {
    console.error('[BACKUP] Error creating backup:', error);
    throw error;
  }
}

export async function restoreFromBackup(backupPath: string): Promise<void> {
  try {
    console.log(`[RESTORE] Starting restore from: ${backupPath}`);
    
    const backupData = await fs.readFile(backupPath, 'utf-8');
    const backup: DataBackup = JSON.parse(backupData);
    
    console.log(`[RESTORE] Backup from ${backup.timestamp}, ${backup.bookCount} books`);
    console.log(`[RESTORE] Backup environment: ${backup.environment}`);
    console.log(`[RESTORE] Current environment: ${process.env.NODE_ENV || 'unknown'}`);
    
    // Clear current data
    await db.delete(books);
    console.log('[RESTORE] Cleared existing books');
    
    // Restore books if any exist
    if (backup.books.length > 0) {
      await db.insert(books).values(backup.books);
      console.log(`[RESTORE] Restored ${backup.books.length} books`);
    }
    
    console.log('[RESTORE] Restore completed successfully');
  } catch (error) {
    console.error('[RESTORE] Error restoring backup:', error);
    throw error;
  }
}

export async function validateEnvironmentSafety(): Promise<{
  isProduction: boolean;
  isDevelopment: boolean;
  databaseUrl: string;
  bookCount: number;
  hasProductionData: boolean;
}> {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const databaseUrl = process.env.DATABASE_URL || 'not-set';
  
  // Count current books
  const bookCountResult = await db.select().from(books);
  const bookCount = bookCountResult.length;
  
  // Check if we have production-like data (recent dates, realistic pricing)
  const recentBooks = bookCountResult.filter(book => {
    const bookDate = new Date(book.createdAt as any);
    const daysSinceAdded = (Date.now() - bookDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceAdded < 30; // Books added in last 30 days
  });
  
  const hasProductionData = recentBooks.length > 0 && bookCount > 5;
  
  return {
    isProduction,
    isDevelopment,
    databaseUrl: databaseUrl.substring(0, 50) + '...', // Truncate for security
    bookCount,
    hasProductionData
  };
}