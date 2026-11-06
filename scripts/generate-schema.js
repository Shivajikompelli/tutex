const fs = require('fs');
const path = require('path');

const questionsPath = path.resolve(__dirname, '../questions.json');
const outputPath = path.resolve(__dirname, '../schema.sql');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

let sql = `-- ==============================================================================
-- Cyclotron Physics NEET Examination Database Schema for Supabase
-- Run this entire script in Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  text TEXT NOT NULL,
  visual_content TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option TEXT NOT NULL DEFAULT 'A',
  marks INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college TEXT NOT NULL DEFAULT 'Intermediate',
  branch TEXT NOT NULL DEFAULT 'NEET Preparation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  tab_switch_count INTEGER NOT NULL DEFAULT 0,
  score INTEGER DEFAULT 0,
  question_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_sub_question UNIQUE (submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS tab_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_answers_sub_id ON answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_tab_events_sub_id ON tab_events(submission_id);

-- 3. Disable RLS and Grant Permissions (Enables Anon / Publishable API Key full access)
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tab_events DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Seed the Active Exam
INSERT INTO exams (id, title, description, duration_minutes, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Cyclotron Physics — NEET Physics Mock Test Series',
  'Official NEET Physics Practice Paper with logic gates, circuits, and kinematics.',
  45,
  true
)
ON CONFLICT (id) DO UPDATE
SET is_active = true, title = EXCLUDED.title;

-- 5. Clean and Seed Questions
DELETE FROM questions WHERE exam_id = 'a0000000-0000-0000-0000-000000000001';

`;

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  const order = q.order || (i + 1);
  const text = escapeSql(q.text);
  const visual = escapeSql(q.visual_content || null);
  const optionsJson = escapeSql(JSON.stringify(q.options || []));
  const correctOption = escapeSql(q.correct_option || 'A');
  const marks = q.marks || 1;

  sql += `INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', ${order}, ${text}, ${visual}, ${optionsJson}::jsonb, ${correctOption}, ${marks});
`;
}

fs.writeFileSync(outputPath, sql, 'utf8');
console.log('Successfully generated schema.sql with', questions.length, 'questions.');

