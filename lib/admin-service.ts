import { getAdminSupabase } from './supabase/server';
import { SubmissionAdminSummary, SubmissionDetail, isOptionMatch } from './types';
import { mockDb } from './mock-db';

export function verifyAdminPassword(inputPassword?: string | null): boolean {
  const configuredPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (!inputPassword) return false;
  return inputPassword === configuredPassword;
}

export async function getAllSubmissionsSummary(): Promise<SubmissionAdminSummary[]> {
  try {
    const supabase = getAdminSupabase();

    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select(`
        id,
        status,
        started_at,
        submitted_at,
        tab_switch_count,
        student:students(*),
        exam:exams(*),
        answers:answers(question_id, answer_text)
      `)
      .order('created_at', { ascending: false });

    if (subError) {
      return mockDb.getAllSubmissionsSummary();
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('id, exam_id, marks, correct_option');

    const questionsList = questions || [];
    const questionsByExam: Record<string, number> = {};
    const questionMap: Record<string, any> = {};

    questionsList.forEach((q) => {
      questionsByExam[q.exam_id] = (questionsByExam[q.exam_id] || 0) + 1;
      questionMap[q.id] = q;
    });

    return (submissions || []).map((sub: any) => {
      const answeredCount = (sub.answers || []).filter(
        (a: any) => a.answer_text && a.answer_text.trim().length > 0
      ).length;

      let score = 0;
      (sub.answers || []).forEach((a: any) => {
        const q = questionMap[a.question_id];
        if (q && isOptionMatch(a.answer_text, q.correct_option)) {
          score += (q.marks || 1);
        }
      });

      const totalQ = questionsByExam[sub.exam?.id] || 45;

      return {
        id: sub.id,
        status: sub.status,
        started_at: sub.started_at,
        submitted_at: sub.submitted_at,
        tab_switch_count: sub.tab_switch_count || 0,
        student: sub.student,
        exam: sub.exam,
        answered_count: answeredCount,
        total_questions: totalQ,
        score,
        total_marks: totalQ * 1,
      };
    });
  } catch (e) {
    return mockDb.getAllSubmissionsSummary();
  }
}

export async function getSubmissionDetail(submissionId: string): Promise<SubmissionDetail> {
  try {
    const supabase = getAdminSupabase();

    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*, student:students(*), exam:exams(*)')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return mockDb.getSubmissionDetail(submissionId);
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', submission.exam_id)
      .order('question_order', { ascending: true });

    const { data: answersData } = await supabase
      .from('answers')
      .select('*')
      .eq('submission_id', submissionId);

    const questionsList = questions || [];
    const answersMap: Record<string, string> = {};
    if (answersData) {
      answersData.forEach((a) => {
        answersMap[a.question_id] = a.answer_text;
      });
    }

    let score = 0;
    questionsList.forEach((q) => {
      const userAns = answersMap[q.id];
      if (isOptionMatch(userAns, q.correct_option)) {
        score += (q.marks || 1);
      }
    });

    const { data: tabEvents } = await supabase
      .from('tab_events')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });

    return {
      submission,
      student: submission.student,
      exam: submission.exam,
      questions: questionsList,
      answers: answersMap,
      tab_events: tabEvents || [],
      score,
      total_marks: questionsList.length * 1,
    };
  } catch (e) {
    return mockDb.getSubmissionDetail(submissionId);
  }
}

export async function generateSubmissionsCSV(): Promise<string> {
  try {
    const supabase = getAdminSupabase();

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        id,
        status,
        started_at,
        submitted_at,
        tab_switch_count,
        student:students(*),
        exam:exams(*),
        answers:answers(question_id, answer_text)
      `)
      .order('created_at', { ascending: false });

    if (error || !submissions) {
      return mockDb.generateSubmissionsCSV();
    }

    const { data: allQuestions } = await supabase
      .from('questions')
      .select('*')
      .order('question_order', { ascending: true });

    const questionsList = allQuestions || [];

    const headers = [
      'Submission ID',
      'Student Name',
      'Mobile Number',
      'Email',
      'Academy Exam',
      'Status',
      'Score',
      'Total Marks',
      'Started At (UTC)',
      'Submitted At (UTC)',
      'Tab Violations',
      'Total Attempted',
      ...questionsList.map((q) => `Q${q.question_order} (Correct: ${q.correct_option})`),
    ];

    const escapeCSV = (field: any) => {
      if (field === null || field === undefined) return '""';
      const stringValue = String(field).replace(/"/g, '""');
      return `"${stringValue}"`;
    };

    const rows = submissions.map((sub: any) => {
      const student = sub.student || {};
      const answersMap: Record<string, string> = {};
      let score = 0;
      let answeredCount = 0;

      (sub.answers || []).forEach((a: any) => {
        answersMap[a.question_id] = a.answer_text;
        if (a.answer_text && a.answer_text.trim().length > 0) {
          answeredCount++;
        }
      });

      questionsList.forEach((q) => {
        const userAns = answersMap[q.id];
        if (isOptionMatch(userAns, q.correct_option)) {
          score += (q.marks || 1);
        }
      });

      const questionAnswers = questionsList.map((q) => answersMap[q.id] || 'Unattempted');

      return [
        sub.id,
        student.name || '',
        student.phone || student.roll_number || '',
        student.email || '',
        sub.exam?.title || 'Cyclotron Physics NEET Test',
        sub.status,
        score,
        questionsList.length * 1,
        sub.started_at ? new Date(sub.started_at).toISOString() : '',
        sub.submitted_at ? new Date(sub.submitted_at).toISOString() : '',
        sub.tab_switch_count || 0,
        answeredCount,
        ...questionAnswers,
      ].map(escapeCSV).join(',');
    });

    return [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  } catch (e) {
    return mockDb.generateSubmissionsCSV();
  }
}
