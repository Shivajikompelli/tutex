import { NextRequest, NextResponse } from 'next/server';
import { saveExamAnswer } from '@/lib/exam-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submission_id, question_id, answer_text, selected_option } = body;

    if (!submission_id || !question_id) {
      return NextResponse.json(
        { error: 'submission_id and question_id are required' },
        { status: 400 }
      );
    }

    const finalAnswer = typeof answer_text === 'string' ? answer_text : (typeof selected_option === 'string' ? selected_option : '');

    const result = await saveExamAnswer(
      submission_id,
      question_id,
      finalAnswer
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to save answer.' },
      { status: 400 }
    );
  }
}

