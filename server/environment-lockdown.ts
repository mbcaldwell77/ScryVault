import { db } from './db';
import { books } from '@shared/schema';

export class EnvironmentLockdown {
  private static instance: EnvironmentLockdown;
  private readonly isProduction: boolean;
  private readonly isDevelopment: boolean;
  private readonly environment: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'unknown';
    this.isProduction = this.environment === 'production';
    this.isDevelopment = this.environment === 'development';
    
    console.log(`[LOCKDOWN] Environment detected: ${this.environment}`);
    console.log(`[LOCKDOWN] Production mode: ${this.isProduction}`);
    console.log(`[LOCKDOWN] Development mode: ${this.isDevelopment}`);
  }

  static getInstance(): EnvironmentLockdown {
    if (!EnvironmentLockdown.instance) {
      EnvironmentLockdown.instance = new EnvironmentLockdown();
    }
    return EnvironmentLockdown.instance;
  }

  /**
   * CRITICAL: Prevents any destructive operations in production
   */
  validateDestructiveOperation(operation: string): void {
    if (this.isProduction) {
      const error = `[LOCKDOWN] BLOCKED: ${operation} attempted in PRODUCTION environment. This operation is FORBIDDEN.`;
      console.error(error);
      throw new Error(error);
    }
    
    console.log(`[LOCKDOWN] ALLOWED: ${operation} in ${this.environment} environment`);
  }

  /**
   * CRITICAL: Validates database connection before any operations
   */
  async validateDatabaseConnection(): Promise<{
    environment: string;
    isProduction: boolean;
    bookCount: number;
    databaseUrl: string;
    connectionValid: boolean;
  }> {
    try {
      const bookCount = await db.select().from(books).then(results => results.length);
      const databaseUrl = process.env.DATABASE_URL || 'NOT_SET';
      
      const validation = {
        environment: this.environment,
        isProduction: this.isProduction,
        bookCount,
        databaseUrl: databaseUrl.substring(0, 50) + '...',
        connectionValid: true
      };

      console.log('[LOCKDOWN] Database validation:', validation);
      
      // CRITICAL WARNING for production
      if (this.isProduction && bookCount > 0) {
        console.warn('[LOCKDOWN] WARNING: Connected to PRODUCTION database with real data!');
        console.warn(`[LOCKDOWN] Book count: ${bookCount}`);
      }

      return validation;
    } catch (error) {
      console.error('[LOCKDOWN] Database validation failed:', error);
      throw new Error(`Database connection validation failed: ${error}`);
    }
  }

  /**
   * CRITICAL: Requires explicit confirmation for any data modification
   */
  requireExplicitConfirmation(operation: string, targetCount: number = 0): void {
    const message = `[LOCKDOWN] CONFIRMATION REQUIRED: ${operation} will affect ${targetCount} records in ${this.environment} environment`;
    console.warn(message);
    
    if (this.isProduction) {
      throw new Error(`[LOCKDOWN] PRODUCTION PROTECTION: ${operation} requires manual override in production`);
    }
  }

  /**
   * CRITICAL: Prevents seed operations in production
   */
  validateSeedOperation(): void {
    this.validateDestructiveOperation('DATABASE_SEEDING');
    
    if (this.isProduction) {
      throw new Error('[LOCKDOWN] ABSOLUTE BLOCK: Database seeding is permanently disabled in production');
    }
  }

  /**
   * CRITICAL: Prevents clear operations in production
   */
  validateClearOperation(): void {
    this.validateDestructiveOperation('DATABASE_CLEARING');
    
    if (this.isProduction) {
      throw new Error('[LOCKDOWN] ABSOLUTE BLOCK: Database clearing is permanently disabled in production');
    }
  }

  /**
   * Gets current environment status
   */
  getEnvironmentStatus() {
    return {
      environment: this.environment,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      protectionActive: true
    };
  }

  /**
   * CRITICAL: Validates any bulk operation
   */
  validateBulkOperation(operation: string, affectedRecords: number): void {
    if (affectedRecords > 10 && this.isProduction) {
      throw new Error(`[LOCKDOWN] BULK OPERATION BLOCKED: ${operation} affecting ${affectedRecords} records in production`);
    }
    
    if (affectedRecords > 0) {
      console.warn(`[LOCKDOWN] Bulk operation: ${operation} affecting ${affectedRecords} records in ${this.environment}`);
    }
  }
}

// Export singleton instance
export const environmentLockdown = EnvironmentLockdown.getInstance();