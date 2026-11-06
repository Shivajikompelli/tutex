import { NextRequest, NextResponse } from 'next/server';
import { getExamSession } from '@/lib/exam-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('submission_id');

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission_id parameter' }, { status: 400 });
    }

    const sessionData = await getExamSession(submissionId);
    return NextResponse.json(sessionData, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve exam session.' },
      { status: 404 }
    );
  }
}

