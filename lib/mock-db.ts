import fs from 'fs';
import path from 'path';
import {
  Exam,
  Question,
  Student,
  Submission,
  Answer,
  TabEvent,
  RegistrationPayload,
  SubmissionStatus,
  SubmissionAdminSummary,
  SubmissionDetail,
  isOptionMatch,
} from './types';

interface MockDatabaseState {
  exams: Exam[];
  questions: Question[];
  students: Student[];
  submissions: Submission[];
  answers: Answer[];
  tab_events: TabEvent[];
}

const DB_FILE = path.resolve(process.cwd(), '.mock-db.json');

function loadQuestionsFile(): { order: number; text: string; visual_content?: string; options: string[]; correct_option?: string; marks: number }[] {
  try {
    const qPath = path.resolve(process.cwd(), 'questions.json');
    if (fs.existsSync(qPath)) {
      return JSON.parse(fs.readFileSync(qPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not read questions.json for mock db', e);
  }

  return [];
}

function initDefaultState(): MockDatabaseState {
  const defaultExamId = 'cyclotron-neet-001';
  const rawQuestions = loadQuestionsFile();

  const questions: Question[] = rawQuestions.map((q, idx) => ({
    id: `q-${idx + 1}`,
    exam_id: defaultExamId,
    question_order: q.order || idx + 1,
    text: q.text,
    visual_content: q.visual_content,
    options: q.options || [],
    correct_option: q.correct_option || 'A',
    marks: q.marks || 4,
    created_at: new Date().toISOString(),
  }));

  const exams: Exam[] = [
    {
      id: defaultExamId,
      title: process.env.EXAM_TITLE || 'Cyclotron Physics — NEET Physics Mock Test Series',
      description: 'Cyclotron Physics NEET-UG Preparatory Mock Test for Intermediate Students (45 MCQs, 45 Marks).',
      duration_minutes: parseInt(process.env.EXAM_DURATION_MINUTES || '45', 10),
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  return {
    exams,
    questions,
    students: [],
    submissions: [],
    answers: [],
    tab_events: [],
  };
}

class MockDB {
  private state: MockDatabaseState;

  constructor() {
    this.state = this.readState();
  }

  private readState(): MockDatabaseState {
    const def = initDefaultState();
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.questions = def.questions;
        parsed.exams = def.exams;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to read .mock-db.json, using defaults', e);
    }
    this.writeState(def);
    return def;
  }

  private writeState(stateToSave?: MockDatabaseState) {
    try {
      const s = stateToSave || this.state;
      fs.writeFileSync(DB_FILE, JSON.stringify(s, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to persist .mock-db.json', e);
    }
  }

  public cleanAllStudentData() {
    this.state.students = [];
    this.state.submissions = [];
    this.state.answers = [];
    this.state.tab_events = [];
    this.writeState();
    return { success: true, message: 'All student records cleared.' };
  }

  public getActiveExam(): Exam | null {
    return this.state.exams.find((e) => e.is_active) || this.state.exams[0] || null;
  }

  public registerOrResumeStudent(payload: RegistrationPayload) {
    const exam = this.getActiveExam();
    if (!exam) throw new Error('No active examination found.');

    const trimmedPhone = payload.phone.trim();
    const trimmedEmail = payload.email.trim().toLowerCase();

    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    const phone10 = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;

    // Check existing student by email or last 10 digits of phone or roll_number
    let student = this.state.students.find(
      (s) =>
        s.email.toLowerCase() === trimmedEmail ||
        (phone10.length >= 7 && (
          s.phone.replace(/\D/g, '').endsWith(phone10) ||
          s.roll_number.replace(/\D/g, '').endsWith(phone10)
        ))
    );

    if (student) {
      student.name = payload.name.trim();
    } else {
      student = {
        id: `student-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: payload.name.trim(),
        roll_number: trimmedPhone,
        email: trimmedEmail,
        phone: trimmedPhone,
        college: payload.college || 'Intermediate',
        branch: payload.branch || 'NEET Preparation',
        created_at: new Date().toISOString(),
      };
      this.state.students.push(student);
    }

    // Check if student already has ANY submission
    const existingSubmission = this.state.submissions.find(
      (sub) => sub.student_id === student!.id
    );

    const GRACE_PERIOD_MS = 30 * 1000;

    if (existingSubmission) {
      const isCompleted = existingSubmission.status !== 'in_progress';
      const expiresAtMs = new Date(existingSubmission.expires_at).getTime();
      const isTimeExpired = Date.now() > expiresAtMs + GRACE_PERIOD_MS;

      if (isCompleted || isTimeExpired) {
        if (!isCompleted && isTimeExpired) {
          existingSubmission.status = 'auto_submitted_time';
          existingSubmission.submitted_at = new Date().toISOString();
          this.writeState();
        }
        return {
          alreadySubmitted: true,
          submissionId: existingSubmission.id,
          examTitle: exam.title,
          status: existingSubmission.status,
        };
      }

      this.writeState();
      return {
        alreadySubmitted: false,
        isResuming: true,
        submissionId: existingSubmission.id,
        examId: exam.id,
        studentId: student.id,
      };
    }

    // Jumble / shuffle questions
    const pool = this.state.questions.filter((q) => q.exam_id === exam.id);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const questionIds = shuffled.map((q) => q.id);

    // Create new submission
    const now = new Date();
    const expiresAt = new Date(now.getTime() + exam.duration_minutes * 60 * 1000);

    const newSub: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      exam_id: exam.id,
      student_id: student.id,
      status: 'in_progress',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      submitted_at: null,
      tab_switch_count: 0,
      question_ids: questionIds,
      created_at: now.toISOString(),
    };

    this.state.submissions.push(newSub);
    this.writeState();

    return {
      alreadySubmitted: false,
      isResuming: false,
      submissionId: newSub.id,
      examId: exam.id,
      studentId: student.id,
    };
  }

  public getExamSession(submissionId: string) {
    const submission = this.state.submissions.find((s) => s.id === submissionId);
    if (!submission) throw new Error('Submission session not found.');

    const student = this.state.students.find((st) => st.id === submission.student_id);
    const exam = this.state.exams.find((e) => e.id === submission.exam_id);

    // Retrieve questions according to student's jumbled question_ids
    let questions: Question[] = [];
    if (submission.question_ids && submission.question_ids.length > 0) {
      questions = submission.question_ids
        .map((qId, idx) => {
          const q = this.state.questions.find((item) => item.id === qId);
          if (!q) return null;
          return {
            ...q,
            question_order: idx + 1,
          };
        })
        .filter((q): q is Question => q !== null);
    } else {
      questions = this.state.questions
        .filter((q) => q.exam_id === submission.exam_id)
        .map((q, idx) => ({ ...q, question_order: idx + 1 }));
    }

    const answersList = this.state.answers.filter((a) => a.submission_id === submissionId);
    const savedAnswers: Record<string, string> = {};
    answersList.forEach((a) => {
      savedAnswers[a.question_id] = a.answer_text;
    });

    const nowMs = Date.now();
    const expiresAtMs = new Date(submission.expires_at).getTime();
    let remainingSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
    const GRACE_PERIOD_MS = 30 * 1000;

    let currentStatus = submission.status;
    if (currentStatus === 'in_progress' && nowMs > expiresAtMs + GRACE_PERIOD_MS) {
      currentStatus = 'auto_submitted_time';
      submission.status = currentStatus;
      submission.submitted_at = new Date().toISOString();
      remainingSeconds = 0;
      this.writeState();
    }

    return {
      submission: { ...submission, status: currentStatus },
      student,
      exam,
      questions,
      savedAnswers,
      serverRemainingSeconds: remainingSeconds,
      tabSwitchCount: submission.tab_switch_count || 0,
      isClosed: currentStatus !== 'in_progress',
    };
  }

  public findQuestion(id: string): Question | undefined {
    return this.state.questions.find((q) => q.id === id);
  }

  public getQuestions(): Question[] {
    return this.state.questions;
  }

  public saveExamAnswer(submissionId: string, questionId: string, selectedOption: string) {
    const submission = this.state.submissions.find((s) => s.id === submissionId);
    if (!submission) throw new Error('Submission not found.');

    if (submission.status !== 'in_progress') {
      throw new Error('Test is already finalized. No further changes allowed.');
    }

    const nowMs = Date.now();
    const expiresAtMs = new Date(submission.expires_at).getTime();
    const GRACE_PERIOD_MS = 30 * 1000;

    if (nowMs > expiresAtMs + GRACE_PERIOD_MS) {
      submission.status = 'auto_submitted_time';
      submission.submitted_at = new Date().toISOString();
      this.writeState();
      throw new Error('Test time limit has expired. Submission has been closed.');
    }

    const existingAns = this.state.answers.find(
      (a) => a.submission_id === submissionId && a.question_id === questionId
    );

    if (existingAns) {
      existingAns.answer_text = selectedOption;
      existingAns.updated_at = new Date().toISOString();
    } else {
      this.state.answers.push({
        id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        submission_id: submissionId,
        question_id: questionId,
        answer_text: selectedOption,
        updated_at: new Date().toISOString(),
      });
    }

    this.writeState();

    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
    return {
      success: true,
      savedAt: new Date().toISOString(),
      remainingSeconds,
    };
  }

  public recordTabViolation(
    submissionId: string,
    eventType: 'visibility_hidden' | 'window_blur' | 'attempted_copy' | 'attempted_paste' | 'attempted_contextmenu',
    details?: string
  ) {
    const submission = this.state.submissions.find((s) => s.id === submissionId);
    if (!submission) return { error: 'Submission not found' };

    if (submission.status !== 'in_progress') {
      return { status: submission.status, tabSwitchCount: submission.tab_switch_count };
    }

    this.state.tab_events.push({
      id: `ev-${Date.now()}`,
      submission_id: submissionId,
      event_type: eventType,
      details: details || null,
      created_at: new Date().toISOString(),
    });

    const isSwitchEvent = eventType === 'visibility_hidden' || eventType === 'window_blur';
    let newCount = submission.tab_switch_count;

    if (isSwitchEvent) {
      newCount = submission.tab_switch_count + 1;
      const shouldAutoSubmit = newCount >= 3;
      const newStatus: SubmissionStatus = shouldAutoSubmit ? 'auto_submitted_tabs' : 'in_progress';

      submission.tab_switch_count = newCount;
      submission.status = newStatus;
      if (shouldAutoSubmit) {
        submission.submitted_at = new Date().toISOString();
        const subAnswers = this.state.answers.filter((a) => a.submission_id === submissionId);
        let calculatedScore = 0;
        subAnswers.forEach((a) => {
          const q = this.state.questions.find((item) => item.id === a.question_id);
          if (q && isOptionMatch(a.answer_text, q.correct_option)) {
            calculatedScore += (q.marks || 4);
          }
        });
        submission.score = calculatedScore;
      }

      this.writeState();

      return {
        tabSwitchCount: newCount,
        autoSubmitted: shouldAutoSubmit,
        status: newStatus,
      };
    }

    this.writeState();
    return {
      tabSwitchCount: newCount,
      autoSubmitted: false,
      status: submission.status,
    };
  }

  public finalizeSubmission(
    submissionId: string,
    reason: 'manual' | 'timeout' | 'tab_violations' = 'manual'
  ) {
    const submission = this.state.submissions.find((s) => s.id === submissionId);
    if (!submission) throw new Error('Submission not found.');

    const subAnswers = this.state.answers.filter((a) => a.submission_id === submissionId);
    let calculatedScore = 0;
    subAnswers.forEach((a) => {
      const q = this.state.questions.find((item) => item.id === a.question_id);
      if (q && isOptionMatch(a.answer_text, q.correct_option)) {
        calculatedScore += (q.marks || 4);
      }
    });

    if (submission.status !== 'in_progress') {
      submission.score = calculatedScore;
      this.writeState();
      return { success: true, status: submission.status, score: calculatedScore, alreadyFinalized: true };
    }

    let finalStatus: SubmissionStatus = 'submitted';
    if (reason === 'timeout') finalStatus = 'auto_submitted_time';
    if (reason === 'tab_violations') finalStatus = 'auto_submitted_tabs';

    submission.status = finalStatus;
    submission.submitted_at = new Date().toISOString();
    submission.score = calculatedScore;
    this.writeState();

    return {
      success: true,
      status: finalStatus,
      score: calculatedScore,
      alreadyFinalized: false,
    };
  }

  public getAllSubmissionsSummary(): SubmissionAdminSummary[] {
    this.state = this.readState();
    return this.state.submissions.map((sub) => {
      const student = this.state.students.find((s) => s.id === sub.student_id)!;
      const exam = this.state.exams.find((e) => e.id === sub.exam_id)!;

      const subAnswers = this.state.answers.filter((a) => a.submission_id === sub.id);
      const answeredCount = subAnswers.filter((a) => a.answer_text && a.answer_text.trim().length > 0).length;

      // Question count for this submission
      const totalQCount = sub.question_ids && sub.question_ids.length > 0 ? sub.question_ids.length : 45;

      let score = 0;
      subAnswers.forEach((a) => {
        const q = this.state.questions.find((item) => item.id === a.question_id);
        if (q && isOptionMatch(a.answer_text, q.correct_option)) {
          score += (q.marks || 4);
        }
      });

      return {
        id: sub.id,
        status: sub.status,
        started_at: sub.started_at,
        submitted_at: sub.submitted_at,
        tab_switch_count: sub.tab_switch_count || 0,
        student,
        exam,
        answered_count: answeredCount,
        total_questions: totalQCount,
        score,
        total_marks: totalQCount * 4,
      };
    });
  }

  public getSubmissionDetail(submissionId: string): SubmissionDetail {
    const submission = this.state.submissions.find((s) => s.id === submissionId);
    if (!submission) throw new Error('Submission not found.');

    const student = this.state.students.find((st) => st.id === submission.student_id)!;
    const exam = this.state.exams.find((e) => e.id === submission.exam_id)!;

    let questions: Question[] = [];
    if (submission.question_ids && submission.question_ids.length > 0) {
      questions = submission.question_ids
        .map((qId, idx) => {
          const q = this.state.questions.find((item) => item.id === qId);
          if (!q) return null;
          return { ...q, question_order: idx + 1 };
        })
        .filter((q): q is Question => q !== null);
    } else {
      questions = this.state.questions.map((q, idx) => ({ ...q, question_order: idx + 1 }));
    }

    const answersList = this.state.answers.filter((a) => a.submission_id === submissionId);
    const answersMap: Record<string, string> = {};
    let score = 0;

    answersList.forEach((a) => {
      answersMap[a.question_id] = a.answer_text;
    });

    questions.forEach((q) => {
      const selected = answersMap[q.id];
      if (isOptionMatch(selected, q.correct_option)) {
        score += (q.marks || 4);
      }
    });

    const tabEvents = this.state.tab_events.filter((t) => t.submission_id === submissionId);

    return {
      submission,
      student,
      exam,
      questions,
      answers: answersMap,
      tab_events: tabEvents,
      score,
      total_marks: questions.length * 4,
    };
  }

  public generateSubmissionsCSV(): string {
    const summaries = this.getAllSubmissionsSummary();

    const headers = [
      'Submission ID',
      'Student Name',
      'Mobile Number',
      'Email',
      'Test Title',
      'Status',
      'NEET Physics Score',
      'Total Marks (45)',
      'Started At (UTC)',
      'Submitted At (UTC)',
      'Tab Violations Logged',
      'Questions Attempted',
      ...Array.from({ length: 45 }, (_, i) => `Q${i + 1} Selected`),
    ];

    const escapeCSV = (field: any) => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = summaries.map((sub) => {
      const student = sub.student || ({} as any);
      const detail = this.getSubmissionDetail(sub.id);

      const qAnswers = detail.questions.slice(0, 45).map((q) => {
        return detail.answers[q.id] || 'Unattempted';
      });

      return [
        sub.id,
        student.name || '',
        student.phone || student.roll_number || '',
        student.email || '',
        sub.exam?.title || 'Cyclotron Physics NEET Test',
        sub.status,
        sub.score || 0,
        sub.total_marks || 45,
        sub.started_at ? new Date(sub.started_at).toISOString() : '',
        sub.submitted_at ? new Date(sub.submitted_at).toISOString() : '',
        sub.tab_switch_count || 0,
        sub.answered_count,
        ...qAnswers,
      ].map(escapeCSV).join(',');
    });

    return [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  }
}

export const mockDb = new MockDB();
