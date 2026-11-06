import { getAdminSupabase } from './supabase/server';
import {
  RegistrationPayload,
  SubmissionStatus,
} from './types';
import { mockDb } from './mock-db';

export const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds server grace period for network latency

function shouldFallbackToMock(errorMsg?: string | null): boolean {
  if (!errorMsg) return false;
  const lower = errorMsg.toLowerCase();
  return (
    lower.includes('invalid api key') ||
    lower.includes('schema cache') ||
    lower.includes('relation') ||
    lower.includes('does not exist') ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('enotfound')
  );
}

export async function getActiveExam() {
  try {
    const supabase = getAdminSupabase();
    const { data: exam, error } = await supabase
      .from('exams')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (shouldFallbackToMock(error.message)) {
        console.warn(`[Supabase Notice] ${error.message} - Using local database.`);
        return mockDb.getActiveExam();
      }
      throw new Error(`Failed to fetch active exam: ${error.message}`);
    }

    if (!exam) {
      return mockDb.getActiveExam();
    }

    return exam;
  } catch (err: any) {
    if (shouldFallbackToMock(err.message)) {
      console.warn(`[Supabase Notice] ${err.message} - Using local database.`);
      return mockDb.getActiveExam();
    }
    throw err;
  }
}

export async function registerOrResumeStudent(payload: RegistrationPayload) {
  try {
    const supabase = getAdminSupabase();
    const activeExam = await getActiveExam();

    if (!activeExam) {
      return mockDb.registerOrResumeStudent(payload);
    }

    const candidatePhone = payload.phone.trim();
    const trimmedRoll = (payload.roll_number || candidatePhone).trim().toUpperCase();
    const trimmedEmail = payload.email.trim().toLowerCase();
    const candidateCollege = (payload.college || 'Intermediate').trim();
    const candidateBranch = (payload.branch || 'NEET Preparation').trim();

    // Check if student exists with this roll number or email
    const { data: existingStudents, error: studentSearchError } = await supabase
      .from('students')
      .select('*')
      .or(`roll_number.ilike.${trimmedRoll},email.ilike.${trimmedEmail}`);

    if (studentSearchError) {
      if (shouldFallbackToMock(studentSearchError.message)) {
        return mockDb.registerOrResumeStudent(payload);
      }
      throw new Error(`Database error while searching student: ${studentSearchError.message}`);
    }

    let student = existingStudents && existingStudents.length > 0 ? existingStudents[0] : null;

    if (student) {
      // If student exists but entered mismatched roll number or email
      if (
        student.roll_number.toUpperCase() !== trimmedRoll &&
        student.email.toLowerCase() === trimmedEmail
      ) {
        throw new Error(`The email "${trimmedEmail}" is already registered under a different Mobile Number.`);
      }
      if (
        student.roll_number.toUpperCase() === trimmedRoll &&
        student.email.toLowerCase() !== trimmedEmail
      ) {
        throw new Error(`The Mobile Number "${trimmedRoll}" is already registered under a different Email.`);
      }

      // Update student details if name, phone, etc. updated
      await supabase
        .from('students')
        .update({
          name: payload.name.trim(),
          phone: candidatePhone,
          college: candidateCollege,
          branch: candidateBranch,
        })
        .eq('id', student.id);
    } else {
      // Insert new student
      const { data: newStudent, error: insertStudentError } = await supabase
        .from('students')
        .insert({
          name: payload.name.trim(),
          roll_number: trimmedRoll,
          email: trimmedEmail,
          phone: candidatePhone,
          college: candidateCollege,
          branch: candidateBranch,
        })
        .select()
        .single();

      if (insertStudentError) {
        if (shouldFallbackToMock(insertStudentError.message)) {
          return mockDb.registerOrResumeStudent(payload);
        }
        throw new Error(`Failed to register student: ${insertStudentError.message}`);
      }
      student = newStudent;
    }

    // Check existing submission for this student and exam
    const { data: existingSubmission, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('exam_id', activeExam.id)
      .eq('student_id', student.id)
      .maybeSingle();

    if (subError) {
      if (shouldFallbackToMock(subError.message)) {
        return mockDb.registerOrResumeStudent(payload);
      }
      throw new Error(`Failed to check existing submission: ${subError.message}`);
    }

    if (existingSubmission) {
      const isCompleted = existingSubmission.status !== 'in_progress';
      const expiresAtMs = new Date(existingSubmission.expires_at).getTime();
      const isTimeExpired = Date.now() > expiresAtMs + GRACE_PERIOD_MS;

      if (isCompleted || isTimeExpired) {
        if (!isCompleted && isTimeExpired) {
          await supabase
            .from('submissions')
            .update({
              status: 'auto_submitted_time',
              submitted_at: new Date().toISOString(),
            })
            .eq('id', existingSubmission.id);
        }
        return {
          alreadySubmitted: true,
          submissionId: existingSubmission.id,
          examTitle: activeExam.title,
          status: existingSubmission.status === 'in_progress' ? 'auto_submitted_time' : existingSubmission.status,
        };
      }

      return {
        alreadySubmitted: false,
        isResuming: true,
        submissionId: existingSubmission.id,
        examId: activeExam.id,
        studentId: student.id,
      };
    }

    // Create new submission record
    const now = new Date();
    const expiresAt = new Date(now.getTime() + activeExam.duration_minutes * 60 * 1000);

    const { data: newSubmission, error: createSubError } = await supabase
      .from('submissions')
      .insert({
        exam_id: activeExam.id,
        student_id: student.id,
        status: 'in_progress',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        tab_switch_count: 0,
      })
      .select()
      .single();

    if (createSubError) {
      if (shouldFallbackToMock(createSubError.message)) {
        return mockDb.registerOrResumeStudent(payload);
      }
      throw new Error(`Failed to initialize submission: ${createSubError.message}`);
    }

    return {
      alreadySubmitted: false,
      isResuming: false,
      submissionId: newSubmission.id,
      examId: activeExam.id,
      studentId: student.id,
    };
  } catch (err: any) {
    if (shouldFallbackToMock(err.message)) {
      return mockDb.registerOrResumeStudent(payload);
    }
    throw err;
  }
}

export async function getExamSession(submissionId: string) {
  try {
    const supabase = getAdminSupabase();

    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*, student:students(*), exam:exams(*)')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      if (subError && shouldFallbackToMock(subError.message)) {
        return mockDb.getExamSession(submissionId);
      }
      return mockDb.getExamSession(submissionId);
    }

    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', submission.exam_id)
      .order('question_order', { ascending: true });

    if (qError) {
      throw new Error(`Failed to load questions: ${qError.message}`);
    }

    let orderedQuestions = questions || [];
    if (submission.question_ids && Array.isArray(submission.question_ids) && submission.question_ids.length > 0) {
      const qMap: Record<string, any> = {};
      orderedQuestions.forEach((q) => { qMap[q.id] = q; });
      orderedQuestions = submission.question_ids
        .map((qId: string, idx: number) => {
          const q = qMap[qId];
          if (!q) return null;
          return { ...q, question_order: idx + 1 };
        })
        .filter(Boolean);
    } else {
      orderedQuestions = orderedQuestions.slice(0, 45);
    }

    const { data: answersData, error: aError } = await supabase
      .from('answers')
      .select('*')
      .eq('submission_id', submissionId);

    if (aError) {
      throw new Error(`Failed to load answers: ${aError.message}`);
    }

    const savedAnswers: Record<string, string> = {};
    if (answersData) {
      answersData.forEach((a) => {
        savedAnswers[a.question_id] = a.answer_text;
      });
    }

    // Compute remaining seconds from server clock
    const nowMs = Date.now();
    const expiresAtMs = new Date(submission.expires_at).getTime();
    let remainingSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));

    let currentStatus = submission.status as SubmissionStatus;

    // Server-authoritative timeout check
    if (currentStatus === 'in_progress' && nowMs > expiresAtMs + GRACE_PERIOD_MS) {
      currentStatus = 'auto_submitted_time';
      remainingSeconds = 0;
      await supabase
        .from('submissions')
        .update({
          status: currentStatus,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', submissionId);
    }

    return {
      submission: {
        ...submission,
        status: currentStatus,
      },
      student: submission.student,
      exam: submission.exam,
      questions: orderedQuestions,
      savedAnswers,
      serverRemainingSeconds: remainingSeconds,
      tabSwitchCount: submission.tab_switch_count || 0,
      isClosed: currentStatus !== 'in_progress',
    };
  } catch (err: any) {
    if (shouldFallbackToMock(err.message)) {
      return mockDb.getExamSession(submissionId);
    }
    return mockDb.getExamSession(submissionId);
  }
}

export async function saveExamAnswer(
  submissionId: string,
  questionId: string,
  answerText: string
) {
  try {
    const supabase = getAdminSupabase();

    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('id, status, expires_at')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      if (subError && shouldFallbackToMock(subError.message)) {
        return mockDb.saveExamAnswer(submissionId, questionId, answerText);
      }
      return mockDb.saveExamAnswer(submissionId, questionId, answerText);
    }

    if (submission.status !== 'in_progress') {
      throw new Error('Exam is already finalized. No further changes allowed.');
    }

    const nowMs = Date.now();
    const expiresAtMs = new Date(submission.expires_at).getTime();

    if (nowMs > expiresAtMs + GRACE_PERIOD_MS) {
      await supabase
        .from('submissions')
        .update({
          status: 'auto_submitted_time',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', submissionId);
      throw new Error('Exam time limit has expired. Submission has been closed.');
    }

    const { error: upsertError } = await supabase
      .from('answers')
      .upsert(
        {
          submission_id: submissionId,
          question_id: questionId,
          answer_text: answerText,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'submission_id,question_id',
        }
      );

    if (upsertError) {
      if (shouldFallbackToMock(upsertError.message)) {
        return mockDb.saveExamAnswer(submissionId, questionId, answerText);
      }
      throw new Error(`Failed to save answer: ${upsertError.message}`);
    }

    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
    return {
      success: true,
      savedAt: new Date().toISOString(),
      remainingSeconds,
    };
  } catch (err: any) {
    if (shouldFallbackToMock(err.message)) {
      return mockDb.saveExamAnswer(submissionId, questionId, answerText);
    }
    return mockDb.saveExamAnswer(submissionId, questionId, answerText);
  }
}

export async function recordTabViolation(
  submissionId: string,
  eventType: 'visibility_hidden' | 'window_blur' | 'attempted_copy' | 'attempted_paste' | 'attempted_contextmenu',
  details?: string
) {
  try {
    const supabase = getAdminSupabase();

    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('id, status, tab_switch_count')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      if (subError && shouldFallbackToMock(subError.message)) {
        return mockDb.recordTabViolation(submissionId, eventType, details);
      }
      return mockDb.recordTabViolation(submissionId, eventType, details);
    }

    if (submission.status !== 'in_progress') {
      return { status: submission.status, tabSwitchCount: submission.tab_switch_count };
    }

    await supabase.from('tab_events').insert({
      submission_id: submissionId,
      event_type: eventType,
      details: details || null,
    });

    const isSwitchEvent = eventType === 'visibility_hidden' || eventType === 'window_blur';
    let newCount = submission.tab_switch_count;

    if (isSwitchEvent) {
      newCount = submission.tab_switch_count + 1;
      const shouldAutoSubmit = newCount >= 3;
      const newStatus: SubmissionStatus = shouldAutoSubmit ? 'auto_submitted_tabs' : 'in_progress';

      await supabase
        .from('submissions')
        .update({
          tab_switch_count: newCount,
          status: newStatus,
          ...(shouldAutoSubmit ? { submitted_at: new Date().toISOString() } : {}),
        })
        .eq('id', submissionId);

      return {
        tabSwitchCount: newCount,
        autoSubmitted: shouldAutoSubmit,
        status: newStatus,
      };
    }

    return {
      tabSwitchCount: newCount,
      autoSubmitted: false,
      status: submission.status,
    };
  } catch (err: any) {
    return mockDb.recordTabViolation(submissionId, eventType, details);
  }
}

export async function finalizeSubmission(
  submissionId: string,
  reason: 'manual' | 'timeout' | 'tab_violations' = 'manual'
) {
  try {
    const supabase = getAdminSupabase();

    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('id, status')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      if (subError && shouldFallbackToMock(subError.message)) {
        return mockDb.finalizeSubmission(submissionId, reason);
      }
      return mockDb.finalizeSubmission(submissionId, reason);
    }

    if (submission.status !== 'in_progress') {
      return { success: true, status: submission.status, alreadyFinalized: true };
    }

    let finalStatus: SubmissionStatus = 'submitted';
    if (reason === 'timeout') finalStatus = 'auto_submitted_time';
    if (reason === 'tab_violations') finalStatus = 'auto_submitted_tabs';

    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: finalStatus,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      if (shouldFallbackToMock(updateError.message)) {
        return mockDb.finalizeSubmission(submissionId, reason);
      }
      throw new Error(`Failed to finalize exam: ${updateError.message}`);
    }

    return {
      success: true,
      status: finalStatus,
      alreadyFinalized: false,
    };
  } catch (err: any) {
    return mockDb.finalizeSubmission(submissionId, reason);
  }
}
