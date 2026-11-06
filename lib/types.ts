export interface Student {
  id: string;
  name: string;
  roll_number: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_order: number;
  text: string;
  options: string[];
  visual_content?: string;
  correct_option?: string;
  marks: number;
  created_at: string;
}

export type SubmissionStatus =
  | 'in_progress'
  | 'submitted'
  | 'auto_submitted_time'
  | 'auto_submitted_tabs';

export interface Submission {
  id: string;
  exam_id: string;
  student_id: string;
  status: SubmissionStatus;
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
  tab_switch_count: number;
  question_ids?: string[];
  created_at: string;
}

export interface Answer {
  id?: string;
  submission_id: string;
  question_id: string;
  answer_text: string; // Selected Option: "A" | "B" | "C" | "D"
  updated_at?: string;
}

export interface TabEvent {
  id?: string;
  submission_id: string;
  event_type: 'visibility_hidden' | 'window_blur' | 'attempted_copy' | 'attempted_paste' | 'attempted_contextmenu';
  details?: string | null;
  created_at?: string;
}

export interface RegistrationPayload {
  name: string;
  email: string;
  phone: string;
  roll_number?: string;
  college?: string;
  branch?: string;
}

export interface ExamContextState {
  submission: Submission;
  student: Student;
  exam: Exam;
  questions: Question[];
  savedAnswers: Record<string, string>; // questionId -> selectedOption ("A" | "B" | "C" | "D")
  serverRemainingSeconds: number;
  tabSwitchCount: number;
}

export interface SubmissionAdminSummary {
  id: string;
  status: SubmissionStatus;
  started_at: string;
  submitted_at: string | null;
  tab_switch_count: number;
  student: Student;
  exam: Exam;
  answered_count: number;
  total_questions: number;
  score?: number;
  total_marks?: number;
}

export interface SubmissionDetail {
  submission: Submission;
  student: Student;
  exam: Exam;
  questions: Question[];
  answers: Record<string, string>;
  tab_events: TabEvent[];
  score: number;
  total_marks: number;
}

export function isOptionMatch(userAnswer?: string | null, correctOption?: string | null): boolean {
  if (!userAnswer || !correctOption) return false;

  const u = userAnswer.trim().toUpperCase();
  const c = correctOption.trim().toUpperCase();

  // 1. Direct match: 'A' === 'A'
  if (u === c) return true;

  // 2. Extract leading letter if stored as "A) ..." or "(A)" or "A. ..."
  const uLetter = u.match(/^[(\[]?([A-D])[)\]\.\s:]/i)?.[1] || (['A', 'B', 'C', 'D'].includes(u.charAt(0)) ? u.charAt(0) : null);
  const cLetter = c.match(/^[(\[]?([A-D])[)\]\.\s:]/i)?.[1] || (['A', 'B', 'C', 'D'].includes(c.charAt(0)) ? c.charAt(0) : null);

  if (uLetter && cLetter && uLetter === cLetter) {
    return true;
  }

  return false;
}
