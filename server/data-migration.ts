import { db } from './db';
import { users, books } from '@shared/schema';
import { eq, isNull } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { environmentLockdown } from './environment-lockdown';

export async function createDefaultAdminUser(): Promise<{ id: number; email: string }> {
  try {
    console.log('[Migration] Creating default admin user...');
    
    const adminEmail = 'admin@scryvault.local';
    const adminPassword = 'admin123456'; // User should change this immediately
    
    // Check if admin user already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('[Migration] Admin user already exists');
      return { id: existingAdmin[0].id, email: existingAdmin[0].email };
    }
    
    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    const [adminUser] = await db.insert(users).values({
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      subscriptionTier: 'enterprise',
      isActive: true,
      emailVerified: true
    }).returning();
    
    console.log(`[Migration] Created admin user: ${adminEmail}`);
    console.log(`[Migration] Default password: ${adminPassword}`);
    console.log('[Migration] ⚠️  CHANGE THE ADMIN PASSWORD IMMEDIATELY');
    
    return { id: adminUser.id, email: adminUser.email };
  } catch (error) {
    console.error('[Migration] Error creating admin user:', error);
    throw error;
  }
}

export async function migrateExistingBooks(): Promise<void> {
  try {
    console.log('[Migration] Checking for books without user ownership...');
    
    // Validate environment safety
    environmentLockdown.validateBulkOperation('MIGRATE_BOOKS', 0);
    
    // Find books without userId
    const orphanedBooks = await db.select()
      .from(books)
      .where(isNull(books.userId));
    
    if (orphanedBooks.length === 0) {
      console.log('[Migration] No books need migration');
      return;
    }
    
    console.log(`[Migration] Found ${orphanedBooks.length} books without user ownership`);
    
    // Get or create admin user
    const adminUser = await createDefaultAdminUser();
    
    // Update books to belong to admin user
    const result = await db.update(books)
      .set({ userId: adminUser.id })
      .where(isNull(books.userId));
    
    console.log(`[Migration] Migrated ${orphanedBooks.length} books to admin user (${adminUser.email})`);
    console.log('[Migration] Books are now secure and protected by user authentication');
    
  } catch (error) {
    console.error('[Migration] Error migrating books:', error);
    throw error;
  }
}

export async function runDataMigration(): Promise<void> {
  try {
    console.log('[Migration] === STARTING DATABASE SECURITY MIGRATION ===');
    
    await migrateExistingBooks();
    
    console.log('[Migration] === MIGRATION COMPLETE ===');
    console.log('[Migration] Database is now secured with user authentication');
    console.log('[Migration] Default admin credentials:');
    console.log('[Migration]   Email: admin@scryvault.local');
    console.log('[Migration]   Password: admin123456');
    console.log('[Migration] ⚠️  CHANGE ADMIN PASSWORD IMMEDIATELY');
    
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    throw error;
  }
}