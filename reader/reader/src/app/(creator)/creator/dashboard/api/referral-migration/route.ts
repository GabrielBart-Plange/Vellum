import { NextRequest, NextResponse } from 'next/server';
import { runReferralMigration, getUsersNeedingReferralIds } from '@/lib/monetization/referralMigration';

/**
 * API route to migrate existing users with referral IDs
 * This should be called once to ensure all existing users can participate in the referral program
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin status
    const requestKey = request.headers.get('x-api-key');
    const migrationKey = process.env.REFERRAL_MIGRATION_KEY;

    if (!migrationKey || requestKey !== migrationKey) {
      console.warn(`🔒 [API] Unauthorized migration attempt`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await runReferralMigration();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Referral migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to migrate users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Check how many users need referral IDs
 */
export async function GET(request: NextRequest) {
  try {
    const count = await getUsersNeedingReferralIds();
    
    return NextResponse.json({
      success: true,
      usersNeedingReferralIds: count,
      migrationRequired: count > 0
    });
  } catch (error) {
    console.error('Error checking referral migration status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
