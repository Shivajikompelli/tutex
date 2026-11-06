import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and Key are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runSeed() {
  console.log('--- Starting Cyclotron Physics NEET Seed Script ---');

  const questionsFilePath = path.resolve(process.cwd(), 'questions.json');
  if (!fs.existsSync(questionsFilePath)) {
    console.error('questions.json not found at:', questionsFilePath);
    process.exit(1);
  }

  const rawQuestions = JSON.parse(fs.readFileSync(questionsFilePath, 'utf-8'));
  console.log(`Loaded ${rawQuestions.length} NEET Physics MCQs from questions.json.`);

  const examTitle = process.env.EXAM_TITLE || 'Cyclotron Physics — NEET Physics Mock Test Series';
  const examDuration = parseInt(process.env.EXAM_DURATION_MINUTES || '45', 10);

  let { data: existingExam, error: examFetchError } = await supabase
    .from('exams')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (examFetchError) {
    console.error('Error fetching exam:', examFetchError.message);
    process.exit(1);
  }

  let examId;
  if (existingExam) {
    console.log(`Updating existing active exam: "${existingExam.title}" (ID: ${existingExam.id})`);
    examId = existingExam.id;
    await supabase.from('exams').update({
      title: examTitle,
      description: 'Cyclotron Physics NEET-UG Preparatory Mock Test for Intermediate Students.',
      duration_minutes: examDuration,
    }).eq('id', examId);
  } else {
    console.log(`Creating new exam: "${examTitle}" (${examDuration} minutes)...`);
    const { data: newExam, error: createError } = await supabase
      .from('exams')
      .insert({
        title: examTitle,
        description: 'Cyclotron Physics NEET-UG Preparatory Mock Test for Intermediate Students.',
        duration_minutes: examDuration,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating exam:', createError.message);
      process.exit(1);
    }
    examId = newExam.id;
  }

  // Clear existing questions for clean seed
  await supabase.from('questions').delete().eq('exam_id', examId);

  // Insert MCQs
  const questionsToInsert = rawQuestions.map((q) => ({
    exam_id: examId,
    question_order: q.order,
    text: q.text,
    options: q.options || [],
    correct_option: q.correct_option || 'A',
    marks: q.marks || 1,
  }));

  const { data: insertedQuestions, error: insertError } = await supabase
    .from('questions')
    .insert(questionsToInsert)
    .select();

  if (insertError) {
    console.error('Error inserting questions:', insertError.message);
    process.exit(1);
  }

  console.log(`Successfully seeded ${insertedQuestions.length} MCQs for "${examTitle}"!`);
  console.log('--- Seed Completed Successfully ---');
}

runSeed().catch((err) => {
  console.error('Unhandled error in seed:', err);
  process.exit(1);
});
