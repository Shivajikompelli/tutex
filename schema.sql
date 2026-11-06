-- ==============================================================================
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

INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 1, 'A steel ball of mass m is moving with a kinetic energy K. The de-Broglie wavelength associated with the ball is', NULL, '["A) h/2mK","B) √(h/2mK)","C) h/√(2mK)","D) None of these"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 2, 'If a photon and an electron have same de-Broglie wavelength, then', NULL, '["A) both have same kinetic energy","B) photon has more K.E. than electron","C) electron has more K.E. than photon","D) both have same velocity"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 3, 'For an electron accelerated from rest through a potential V, the de Broglie wavelength associated will be', NULL, '["A) 1.772/√V nm","B) 1.227/√V μm","C) 1.227/√V nm","D) 1.772/√V μm"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 4, 'If E1, E2, E3 are the respective kinetic energies of an electron, an alpha-particle and a proton, each having the same de-Broglie wavelength, then', NULL, '["A) E1 > E3 > E2","B) E2 > E3 > E1","C) E1 > E2 > E3","D) E1 = E2 = E3"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 5, 'If the momentum of electron is changed by P, then the de Broglie wavelength associated with it changes by 0.5%. The initial momentum of electron will be', NULL, '["A) 200P","B) 400P","C) P/200","D) 100P"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 6, 'If the kinetic energy of a free electron doubles, its de-Broglie wavelength changes by the factor', NULL, '["A) 2","B) 1/2","C) √2","D) 1/√2"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 7, 'If the kinetic energy of the particle is increased to 16 times its previous value, the percentage change in the de-Broglie wavelength of the particle is', NULL, '["A) 25","B) 75","C) 60","D) 50"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 8, 'The magnitude of the de-Broglie wavelength (λ) of electron (e), proton (p), neutron (n) and α-particle (α) all having the same energy of 1 MeV, in the increasing order will follow the sequence', NULL, '["A) λe, λp, λn, λα","B) λe, λn, λp, λα","C) λα, λn, λp, λe","D) λp, λe, λα, λn"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 9, 'Which of the following when falls on a metal will emit photoelectrons?', NULL, '["A) UV radiations","B) Infrared radiation","C) Radio waves","D) Microwaves"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 10, 'Sodium and copper have work functions 2.3 eV and 4.5 eV respectively. Then the ratio of the wavelengths is nearest to', NULL, '["A) 1 : 2","B) 4 : 1","C) 2 : 1","D) 1 : 4"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 11, '4 eV is the energy of incident photon and the work function is 2 eV. The stopping potential will be', NULL, '["A) 2 V","B) 4 V","C) 6 V","D) 2√2 V"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 12, 'The photoelectric work function for a metal surface is 4.125 eV. The cut-off wavelength for this surface is', NULL, '["A) 4125 Å","B) 3000 Å","C) 6000 Å","D) 2062 Å"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 13, 'For intensity I of a light of wavelength 5000 Å the photoelectron saturation current is 0.40 μA and stopping potential is 1.36 V. The work function of the metal is', NULL, '["A) 2.47 eV","B) 1.36 eV","C) 1.10 eV","D) 0.43 eV"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 14, 'Two radiations of photon energies 1 eV and 2.5 eV successively illuminate a photosensitive metallic surface of work function 0.5 eV. The ratio of the maximum speeds of the emitted electrons is', NULL, '["A) 1 : 4","B) 1 : 2","C) 1 : 1","D) 1 : 5"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 15, 'In photoelectric emission process from a metal of work function 1.8 eV, the kinetic energy of most energetic electrons is 0.5 eV. The corresponding stopping potential is', NULL, '["A) 1.8 V","B) 1.2 V","C) 0.5 V","D) 2.3 V"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 16, 'The threshold frequency for a photosensitive metal is 3.3 × 10¹⁴ Hz. If light of frequency 8.2 × 10¹⁴ Hz is incident on this metal, the cut-off voltage for the photoelectric emission is nearly', NULL, '["A) 2 V","B) 3 V","C) 5 V","D) 1 V"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 17, 'Light of wavelength 3500 Å is incident on two metals A and B whose work functions are 3.2 eV and 1.9 eV respectively. Which metal will emit photoelectrons?', NULL, '["A) A","B) B","C) Both A and B","D) Neither A nor B"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 18, 'Light of wavelength λA and λB falls on two identical metal plates A and B respectively. The maximum kinetic energy of photoelectrons is KA and KB respectively. Which one of the following relations is true? (λA = 2λB)', NULL, '["A) KA < KB/2","B) 2KA = KB","C) KA = 2KB","D) KA > 2KB"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 19, 'In photoelectric effect, stopping potential for a light of frequency n1 is V1. If light is replaced by another having a frequency n2, then its stopping potential will be', NULL, '["A) V1 − (h/e)(n2 − n1)","B) V1 + (h/e)(n2 + n1)","C) V1 + (h/e)(n2 − 2n1)","D) V1 + (h/e)(n2 − n1)"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 20, 'In a photoelectric effect measurement, the stopping potential for a given metal is found to be V0 volt when radiation of wavelength λ0 is used. If radiation of wavelength 2λ0 is used with the same metal, then the stopping potential (in volt) will be', NULL, '["A) V0/2","B) 2V0","C) V0 + hc/2eλ0","D) V0 − hc/2eλ0"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 21, 'The short wavelength limit of continuous X-radiation emitted by an X-ray tube operating at 30 kV is 0.414 Å. Calculate Planck''s constant.', NULL, '["A) 6.22 × 10⁻³⁴ erg-sec","B) 6.624 × 10⁻²⁴ erg-sec","C) 6.624 × 10⁻²⁷ J-sec","D) 6.624 × 10⁻³⁴ J-sec"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 22, 'A radioactive element forms its own isotope after 3 consecutive disintegrations. The particles emitted are', NULL, '["A) 3 β-particles","B) 2 β-particles and 1 α-particle","C) 3 β-particles and 1 α-particle","D) 2 α-particles and 1 β-particle"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 23, 'An element A decays into an element C by a two-step process: A → B + ₂He⁴ and B → C + 2 ₋₁e⁰. Then', NULL, '["A) A and C are isotopes","B) A and C are isobars","C) B and C are isotopes","D) A and B are isobars"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 24, 'When ₃Li⁷ nuclei are bombarded by protons, and the resultant nuclei are ₄Be⁸, the emitted particles will be', NULL, '["A) alpha particles","B) beta particles","C) gamma photons","D) neutrons"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 25, 'If N0 is the original mass of the substance of half-life period t1/2 = 5 years, then the amount of substance left after 15 years is', NULL, '["A) N0/8","B) N0/16","C) N0/2","D) N0/4"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 26, 'If T is the half life of a radioactive material, then the fraction that would remain after a time T/2 is', NULL, '["A) 1/2","B) 3/4","C) 1/√2","D) (√2 − 1)/√2"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 27, 'Starting with a sample of pure ⁶⁶Cu, 7/8 of it decays into Zn in 15 minutes. The corresponding half life is', NULL, '["A) 15 minutes","B) 10 minutes","C) 7½ minutes","D) 5 minutes"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 28, 'A radioactive element forms its own isotope after three consecutive disintegrations. The particles emitted are', NULL, '["A) 3 β-particles","B) 2 β-particles and 1 α-particle","C) 3 β-particles and 1 α-particle","D) 2 α-particles and 1 β-particle"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 29, 'The ratio of half-life times of two elements A and B is TA/TB. The ratio of respective decay constants λA/λB is', NULL, '["A) TB/TA","B) TA/TB","C) (TA + TB)/TA","D) (TA − TB)/TA"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 30, 'The half life of the radioactive substance is 40 days. The substance will disintegrate completely in', NULL, '["A) 40 days","B) 400 days","C) 4000 days","D) infinite time"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 31, 'A radioactive substance contains 10000 nuclei and its half-life period is 20 days. The number of nuclei present at the end of 10 days is', NULL, '["A) 7070","B) 9000","C) 8000","D) 7500"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 32, 'An archaeologist analyses the wood in a prehistoric structure and finds that the ratio of C14 (half life = 5700 years) to C12 is only one-fourth of that found in the cells of buried plants. The age of the wood is about', NULL, '["A) 5700 years","B) 2850 years","C) 11,400 years","D) 22,800 years"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 33, 'A radioactive element X converts into another stable element Y. Half life of X is 2 hrs. Initially only X is present. After time t, the ratio of atoms of X and Y is found to be 1 : 4, then t in hours is', NULL, '["A) 2","B) 4","C) between 4 and 6","D) 6"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 34, 'After 150 days, the activity of a radioactive sample is 5000 dps. The activity becomes 2500 dps after another 75 days. The initial activity of the sample is', NULL, '["A) 20000 dps","B) 40000 dps","C) 7500 dps","D) 10000 dps"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 35, 'A nucleus with Z = 92 emits the following in a sequence: α, β⁻, β⁻, α, α, α, α, β⁻, β⁻, α, β⁺, β⁺, α. Then Z of the resulting nucleus is', NULL, '["A) 76","B) 78","C) 82","D) 74"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 36, 'A radioactive nucleus undergoes a series of decay according to the scheme A —α→ A1 —β→ A2 —α→ A3 —γ→ A4. If the mass number and atomic number of ''A'' are 180 and 72 respectively, then what are these numbers for A4?', NULL, '["A) 172 and 69","B) 174 and 70","C) 176 and 69","D) 176 and 70"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 37, 'Identify the logic gate whose truth table is given:

| A | B | C |
|---|---|---|
| 0 | 0 | 1 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |', 'Truth table shows: C = 1 for inputs (0,0), (0,1), (1,0) and C = 0 for (1,1).', '["A) XOR","B) OR","C) AND","D) NAND"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 38, 'The figure shows a logic circuit with two inputs A and B and output C. The voltage waveforms across A, B and C are given. The logic gate circuit is:

• Before t1: A=0, B=0 → C=0
• t1 to t4: A=1 or B=1 → C=1
• t4 to t5: A=0, B=0 → C=0
• t5 to t6: A=1, B=0 → C=1', 'Waveform analysis: Output C is HIGH whenever either input A or B is HIGH. Output C is LOW only when both A and B are LOW.', '["A) OR gate","B) NOR gate","C) AND gate","D) NAND gate"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 39, 'Which of the following gates will have an output of 1?

(A) NAND gate with inputs 1, 1
(B) NOR gate with inputs 0, 1
(C) NAND gate with inputs 0, 1
(D) XOR gate with inputs 0, 0', 'Gate (C) has inputs 0 and 1 into a NAND gate: Output = NOT(0 AND 1) = NOT(0) = 1.', '["A) D","B) A","C) B","D) C"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 40, 'The following circuit represents:

Circuit: Inputs A and B.
Top branch: NOT(A) and B enter an AND gate → (NOT A)·B
Bottom branch: A and NOT(B) enter an AND gate → A·(NOT B)
Both branches enter an OR gate producing output Y.', 'Logic expression: Y = (NOT A · B) + (A · NOT B) = A XOR B.', '["A) OR gate","B) XOR gate","C) AND gate","D) NAND gate"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 41, 'The following configuration of gates is equivalent to:

Circuit: Inputs A and B feed an OR gate. Inputs A and B also feed a NAND gate. The outputs of the OR gate and NAND gate feed an AND gate producing output Y.', 'Logic expression: Y = (A OR B) AND (NOT(A AND B)) = (A + B) · (A'' + B'') = A·B'' + A''·B = A XOR B.', '["A) NAND gate","B) XOR gate","C) OR gate","D) NOR gate"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 42, 'In the following circuit, the output Y for all possible inputs A and B is expressed by the truth table:

Circuit: Inputs A and B enter a NOR gate G1. The output of G1 is tied to both inputs of a second NOR gate G2 producing Y.', 'Logic expression: G1 = NOT(A OR B). G2 inverts G1: Y = NOT(NOT(A OR B)) = A OR B.
Truth table for OR: (0,0)→0; (0,1)→1; (1,0)→1; (1,1)→1.', '["A) Truth table: (0,0)→1, (0,1)→1, (1,0)→1, (1,1)→0","B) Truth table: (0,0)→1, (0,1)→0, (1,0)→0, (1,1)→0","C) Truth table: (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→1","D) Truth table: (0,0)→0, (0,1)→0, (1,0)→0, (1,1)→1"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 43, 'The combination of gates shown below yields:

Circuit: Input A enters a NAND gate with tied inputs (NOT A). Input B enters a NAND gate with tied inputs (NOT B). The two inverted outputs feed a final NAND gate producing output X.', 'Logic expression: X = NOT((NOT A) AND (NOT B)) = NOT(NOT(A OR B)) = A OR B.', '["A) OR gate","B) NOT gate","C) XOR gate","D) NAND gate"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 44, 'For the given combination of gates, if the logic states of inputs A, B, C are:
Case 1: A = B = C = 0
Case 2: A = B = 1, C = 0
then the logic states of output D are respectively:

Circuit: Inputs A and B enter an OR gate G1. Output of G1 and input C enter a NAND gate G2 producing D.', 'Logic expression: D = NOT(G1 AND C) = NOT((A OR B) AND C).
Case 1: C=0 → D = NOT(0) = 1.
Case 2: C=0 → D = NOT(0) = 1.', '["A) 0, 0","B) 0, 1","C) 1, 0","D) 1, 1"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 45, 'Which logic gate with inputs A and B performs the same operation as that performed by the following circuit?

Circuit: A battery circuit contains two switches A and B connected in parallel in the path to a lamp.', 'Electrical logic: If either switch A is closed OR switch B is closed, the circuit is completed and current illuminates the lamp.', '["A) NAND gate","B) OR gate","C) NOR gate","D) AND gate"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 46, 'The logic circuit shown below has the input waveforms ''A'' and ''B'' as shown. Pick out the correct output waveform:

Circuit: A enters a NOT gate; B enters a NOT gate. Both inverted outputs enter a NOR gate producing output Y.', 'Logic expression: Y = NOT((NOT A) OR (NOT B)) = A AND B.
Output Y is HIGH (1) only when BOTH A and B are HIGH (in interval t3-t4 and interval t5-t6).', '["A) Output waveform (a)","B) Output waveform (b)","C) Output waveform (c)","D) Output waveform (d)"]'::jsonb, 'C', 1);
