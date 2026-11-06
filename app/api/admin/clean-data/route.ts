import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { cleanAllSubmissionsData } from '@/lib/admin-service';

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      );
    }

    const result = await cleanAllSubmissionsData();
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to wipe student data.' },
      { status: 500 }
    );
  }
}

