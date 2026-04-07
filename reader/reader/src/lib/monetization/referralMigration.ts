import { adminDb } from '@/lib/firebase-admin';

/**
 * Migration script to assign referral IDs to existing users
 * This ensures all users can participate in the referral program
 */
export async function migrateExistingUsers() {
  if (!adminDb) {
    console.error('Firebase Admin not initialized');
    return;
  }

  try {
    // Get all users without referralId
    const usersSnapshot = await adminDb.collection('users')
      .where('referralId', '==', null)
      .get();

    console.log(`Found ${usersSnapshot.size} users without referral IDs`);

    const batch = adminDb.batch();
    let migratedCount = 0;

    usersSnapshot.forEach((doc: any) => {
      const userRef = doc.ref;
      const referralId = `ARC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      batch.update(userRef, {
        referralId,
        updatedAt: new Date()
      });
      
      migratedCount++;
    });

    // Commit batch if there are users to migrate
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${migratedCount} users with referral IDs`);
    } else {
      console.log('All users already have referral IDs');
    }

    return migratedCount;
  } catch (error) {
    console.error('Error migrating existing users:', error);
    throw error;
  }
}

/**
 * Get count of users who need referral IDs
 */
export async function getUsersNeedingReferralIds() {
  if (!adminDb) return 0;

  try {
    const snapshot = await adminDb.collection('users')
      .where('referralId', '==', null)
      .count()
      .get();
    
    return snapshot.data().count;
  } catch (error) {
    console.error('Error counting users needing referral IDs:', error);
    return 0;
  }
}

/**
 * One-time migration script for existing users
 * This can be called from an admin route or server action
 */
export async function runReferralMigration() {
  const count = await getUsersNeedingReferralIds();
  
  if (count > 0) {
    console.log(`Starting migration for ${count} existing users...`);
    const migrated = await migrateExistingUsers();
    return {
      success: true,
      message: `Successfully assigned referral IDs to ${migrated} existing users`,
      migrated
    };
  }
  
  return {
    success: true,
    message: 'All users already have referral IDs',
    migrated: 0
  };
}
