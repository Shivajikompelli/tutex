import { NextRequest, NextResponse } from 'next/server';
import { recordTabViolation } from '@/lib/exam-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submission_id, event_type, details } = body;

    if (!submission_id || !event_type) {
      return NextResponse.json(
        { error: 'submission_id and event_type are required' },
        { status: 400 }
      );
    }

    const result = await recordTabViolation(submission_id, event_type, details);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to record event.' },
      { status: 400 }
    );
  }
}

