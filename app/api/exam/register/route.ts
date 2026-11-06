import { NextRequest, NextResponse } from 'next/server';
import { registerOrResumeStudent } from '@/lib/exam-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, mobile_number, roll_number, college, branch } = body;

    const candidatePhone = (mobile_number || phone || '').trim();

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const phonePattern = /^[0-9+\-\s()]{7,15}$/;
    if (!candidatePhone || !phonePattern.test(candidatePhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid mobile number (min 7 digits).' },
        { status: 400 }
      );
    }

    // Default roll_number to mobile number if not explicitly provided
    const candidateRoll = (roll_number || candidatePhone).trim();
    const candidateCollege = (college || 'N/A').trim();
    const candidateBranch = (branch || 'N/A').trim();

    const result = await registerOrResumeStudent({
      name: name.trim(),
      roll_number: candidateRoll,
      email: email.trim(),
      phone: candidatePhone,
      college: candidateCollege,
      branch: candidateBranch,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during registration.' },
      { status: 400 }
    );
  }
}
