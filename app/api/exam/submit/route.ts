import { NextRequest, NextResponse } from 'next/server';
import { finalizeSubmission } from '@/lib/exam-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submission_id, reason } = body;

    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id is required' }, { status: 400 });
    }

    const result = await finalizeSubmission(submission_id, reason || 'manual');
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to finalize submission.' },
      { status: 400 }
    );
  }
}

