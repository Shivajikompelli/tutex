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
VALUES ('a0000000-0000-0000-0000-000000000001', 1, 'The combination of gates shown below yields:', 'Circuit: Inputs A and B each enter a NAND gate with the two inputs of each NAND tied together; the two inverted outputs feed a final NAND gate producing output X.', '["A) OR gate","B) NOT gate","C) XOR gate","D) NAND gate"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 2, 'For the given combination of gates, if the logic states of inputs A, B, C are: Case 1: A = B = C = 0; Case 2: A = B = 1, C = 0, then the logic states of output D are respectively:', 'Circuit: Inputs A and B feed an OR gate G1. The output of G1 and input C feed a NAND gate G2, producing final output D.', '["A) 0, 0","B) 0, 1","C) 1, 0","D) 1, 1"]'::jsonb, 'D', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 3, 'Which logic gate with inputs A and B performs the same operation as that performed by a battery circuit containing two switches A and B connected in parallel in the path to a lamp?', 'Circuit: Switches A and B are connected in parallel. If either switch is closed (ON), the lamp glows (ON).', '["A) NAND gate","B) OR gate","C) NOR gate","D) AND gate"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 4, 'The logic circuit has inputs A and B each passing through a NOT gate; the two inverted outputs feed a NOR gate producing output Y. The equivalent logic operation of this circuit is:', 'Logic Expression: Y = NOT((NOT A) OR (NOT B)) = (NOT NOT A) AND (NOT NOT B) = A AND B', '["A) OR gate","B) AND gate","C) NAND gate","D) NOR gate"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 5, 'In a cyclotron, a charged particle of mass m and charge q accelerates inside dees under a perpendicular uniform magnetic field B. The cyclotron frequency of revolution of the particle is independent of its:', 'Formula: f = (qB) / (2πm)', '["A) Magnetic flux density (B)","B) Charge of the particle (q)","C) Speed and orbital radius (v and r)","D) Mass of the particle (m)"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 6, 'The maximum kinetic energy of a charged particle accelerated in a cyclotron of radius R in a magnetic field B is proportional to:', 'Formula: K_max = (q²B²R²) / (2m)', '["A) R","B) R²","C) 1 / R","D) R³"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 7, 'A proton and an alpha particle enter a uniform perpendicular magnetic field with the same kinetic energy. The ratio of the radii of their circular paths (r_p : r_α) is:', NULL, '["A) 1 : 1","B) 1 : 2","C) 2 : 1","D) 1 : 4"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 8, 'Two point charges +q and -q are separated by a distance 2a. The electric potential at any point on the equatorial plane of the electric dipole is:', NULL, '["A) Maximum and positive","B) Zero","C) Dependent on distance from the midpoint","D) Inversely proportional to distance squared"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 9, 'A car accelerates from rest at a constant rate α for some time, after which it decelerates at a constant rate β to come to rest. If the total time elapsed is t, the maximum velocity attained by the car is:', NULL, '["A) [(α + β) / (αβ)] * t","B) [(αβ) / (α + β)] * t","C) [(α² + β²) / (αβ)] * t","D) [(αβ) / (2(α + β))] * t"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 10, 'In a photoelectric experiment, the stopping potential for incident light of frequency ν is V₀. If the frequency of incident light is doubled, the new stopping potential will be:', NULL, '["A) Equal to 2V₀","B) Less than 2V₀","C) More than 2V₀","D) Exactly V₀ / 2"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 11, 'A convex lens of refractive index 1.5 has a focal length of 20 cm in air. When completely immersed in water of refractive index 4/3, its focal length will become:', NULL, '["A) 40 cm","B) 60 cm","C) 80 cm","D) 20 cm"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 12, 'An ideal heat engine operates in a Carnot cycle between temperatures 227°C and 27°C. If the engine absorbs 600 calories of heat from the source, the heat rejected to the sink per cycle is:', NULL, '["A) 360 calories","B) 240 calories","C) 480 calories","D) 120 calories"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 13, 'A wire of resistance R is stretched uniformly such that its length increases by 10%. The percentage increase in its electrical resistance is approximately:', NULL, '["A) 10%","B) 19%","C) 21%","D) 25%"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 14, 'The de Broglie wavelength of an electron accelerated from rest through a potential difference of V volts is approximately given by:', NULL, '["A) λ = 12.27 / √V Å","B) λ = 1.227 / √V Å","C) λ = 122.7 / √V Å","D) λ = 0.1227 / √V Å"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 15, 'A magnetic dipole of magnetic moment M is placed in a uniform magnetic field B. The work done in rotating the dipole from stable equilibrium (θ = 0°) to unstable equilibrium (θ = 180°) is:', NULL, '["A) Zero","B) MB","C) 2 MB","D) -MB"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 16, 'To convert a moving coil galvanometer into a voltmeter of desired range, one must connect:', NULL, '["A) A low resistance in parallel with the coil","B) A high resistance in series with the coil","C) A low resistance in series with the coil","D) A high resistance in parallel with the coil"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 17, 'A body of mass 2 kg moving with velocity 3 m/s collides head-on with a body of mass 1 kg moving with velocity 4 m/s in the opposite direction. If the collision is perfectly inelastic, the common velocity after collision is:', NULL, '["A) 2/3 m/s in original direction of 2 kg mass","B) 1/3 m/s in original direction of 1 kg mass","C) 1 m/s in original direction of 2 kg mass","D) Zero"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 18, 'The ratio of the speed of an electron in the first Bohr orbit of hydrogen atom to the speed of light in vacuum is approximately equal to:', NULL, '["A) 1 / 137","B) 1 / 237","C) 1 / 37","D) 1 / 13.7"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 19, 'In Young''s double slit experiment, if the separation between the slits is halved and the distance between the slits and the screen is doubled, the fringe width will:', NULL, '["A) Remain unchanged","B) Become two times","C) Become four times","D) Become one-fourth"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 20, 'A parallel plate capacitor with air between the plates has capacitance C. If a dielectric slab of dielectric constant K = 5 is inserted filling the entire space between the plates, the new capacitance is:', NULL, '["A) C / 5","B) 5C","C) 25C","D) C + 5"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 21, 'A stone is dropped from a height h. It hits the ground with a certain momentum p. If the same stone is dropped from a height 100% more than the previous height, the momentum when it hits the ground will change by:', NULL, '["A) 100%","B) 41%","C) 50%","D) 200%"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 22, 'The dimensions of magnetic permeability (μ₀) in terms of M, L, T, A are:', NULL, '["A) [M L T⁻² A⁻²]","B) [M L T⁻¹ A⁻²]","C) [M L² T⁻² A⁻¹]","D) [M L T⁻² A⁻¹]"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 23, 'In an alternating current circuit containing an inductor of inductance L and a capacitor of capacitance C in series, the resonant angular frequency ω₀ is given by:', NULL, '["A) ω₀ = √(LC)","B) ω₀ = 1 / √(LC)","C) ω₀ = 1 / (LC)","D) ω₀ = L / C"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 24, 'A particle executes simple harmonic motion with an amplitude of 4 cm. At what displacement from the mean position are its kinetic energy and potential energy equal?', NULL, '["A) 2 cm","B) 2√2 cm","C) √2 cm","D) 1 cm"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 25, 'The escape velocity from the surface of the Earth is v_e. If a planet has twice the radius and eight times the mass of the Earth, the escape velocity from that planet will be:', NULL, '["A) 2 v_e","B) 4 v_e","C) v_e","D) 8 v_e"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 26, 'An organ pipe closed at one end of length L has its fundamental frequency f. If it is opened at both ends, its fundamental frequency becomes:', NULL, '["A) f / 2","B) 2f","C) 4f","D) f"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 27, 'According to Lenz''s law, the polarity of induced electromotive force (EMF) is such that it opposes the change in magnetic flux that produces it. This law is a direct consequence of the law of conservation of:', NULL, '["A) Electric charge","B) Momentum","C) Energy","D) Mass"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 28, 'In a forward-biased p-n junction diode, the width of the depletion layer:', NULL, '["A) Increases","B) Decreases","C) Remains constant","D) First increases then decreases"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 29, 'A Zener diode is primarily designed to operate in:', NULL, '["A) Forward bias as an amplifier","B) Reverse breakdown region as a voltage regulator","C) Forward bias as an oscillator","D) Zero bias as a switch"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 30, 'A circular coil of radius 10 cm and 100 turns carries a current of 3.2 A. The magnetic field at the centre of the coil is (given μ₀ = 4π × 10⁻⁷ T·m/A):', NULL, '["A) 2.01 × 10⁻³ T","B) 4.02 × 10⁻⁴ T","C) 2.01 × 10⁻⁴ T","D) 6.28 × 10⁻³ T"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 31, 'A projectile is thrown with an initial velocity u at an angle θ with the horizontal. The angle between the velocity vector and the acceleration vector at the highest point of its trajectory is:', NULL, '["A) 0°","B) 45°","C) 90°","D) 180°"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 32, 'A spherical droplet of water of radius 1 mm is split into 10⁶ identical tiny droplets. If T is the surface tension of water, the work done in this process is:', NULL, '["A) 4πR²T (100 - 1)","B) 4πR²T (10 - 1)","C) 4πR²T (1000 - 1)","D) Zero"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 33, 'Two moles of an ideal monoatomic gas (C_v = 3R/2) are heated from 300 K to 400 K at constant volume. The change in internal energy (ΔU) of the gas is:', NULL, '["A) 150 R","B) 300 R","C) 600 R","D) 450 R"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 34, 'The critical angle for total internal reflection of light from a denser medium to air is 45°. The velocity of light in the denser medium is:', NULL, '["A) 1.5 × 10⁸ m/s","B) 2.12 × 10⁸ m/s","C) 3.0 × 10⁸ m/s","D) 0.75 × 10⁸ m/s"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 35, 'In a series LCR circuit, R = 10 Ω, X_L = 20 Ω, and X_C = 20 Ω. The impedance of the circuit and the power factor are respectively:', NULL, '["A) 10 Ω, 1","B) 20 Ω, 0","C) 30 Ω, 0.5","D) 10 Ω, 0"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 36, 'A radioactive sample has a half-life of 20 minutes. The fraction of the original activity remaining after 80 minutes is:', NULL, '["A) 1 / 4","B) 1 / 8","C) 1 / 16","D) 1 / 32"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 37, 'A mass m attached to a spring of spring constant k oscillates with frequency f₁. If the mass is replaced by 4m, the new frequency of oscillation f₂ will be:', NULL, '["A) 2 f₁","B) f₁ / 2","C) 4 f₁","D) f₁ / 4"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 38, 'A telescope of objective focal length 100 cm and eyepiece focal length 5 cm is focused for normal adjustment. The magnifying power and tube length of the telescope are:', NULL, '["A) 20, 105 cm","B) 500, 95 cm","C) 20, 95 cm","D) 5, 105 cm"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 39, 'The work function of Caesium is 2.14 eV. The threshold frequency for photoelectric emission in Caesium is (take h = 6.63 × 10⁻³⁴ J·s):', NULL, '["A) 5.16 × 10¹⁴ Hz","B) 3.20 × 10¹⁴ Hz","C) 6.50 × 10¹⁴ Hz","D) 2.14 × 10¹⁴ Hz"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 40, 'An electric dipole of dipole moment p is placed in an electric field E. The torque acting on the dipole is given by the vector product:', NULL, '["A) τ = p · E","B) τ = p × E","C) τ = E × p","D) τ = (p · E) / 2"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 41, 'A copper wire and a silicon bar are both warmed from room temperature 300 K to 350 K. The electrical resistance of:', NULL, '["A) Both increases","B) Both decreases","C) Copper increases while silicon decreases","D) Copper decreases while silicon increases"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 42, 'The displacement of a particle executing simple harmonic motion is given by y = 5 sin(100t + π/3) cm. The maximum velocity of the particle is:', NULL, '["A) 500 cm/s","B) 50 cm/s","C) 100 cm/s","D) 20 cm/s"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 43, 'If two coherent light waves of intensities I and 4I interfere, the ratio of maximum to minimum intensity in the resulting interference pattern is:', NULL, '["A) 5 : 3","B) 9 : 1","C) 25 : 9","D) 4 : 1"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 44, 'An electromagnetic wave propagating along the +x axis has an electric field vector along the +y axis. The magnetic field vector B must point along:', NULL, '["A) +z axis","B) -z axis","C) +x axis","D) -y axis"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 45, 'According to the de Broglie hypothesis, the wavelength λ of a particle of mass m moving with velocity v is:', NULL, '["A) λ = h / (mv)","B) λ = (mv) / h","C) λ = h / √(2m)","D) λ = (h · v) / m"]'::jsonb, 'A', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 46, 'A body cools from 80°C to 60°C in 5 minutes in a surrounding at 20°C. Using Newton''s law of cooling, the time taken to cool from 60°C to 40°C in the same surrounding will be:', NULL, '["A) 5 minutes","B) 7.5 minutes","C) 9.1 minutes","D) 10 minutes"]'::jsonb, 'C', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 47, 'The magnetic susceptibility of a paramagnetic substance at temperature T is proportional to (Curie''s Law):', NULL, '["A) T","B) 1 / T","C) T²","D) 1 / T²"]'::jsonb, 'B', 1);
INSERT INTO questions (exam_id, question_order, text, visual_content, options, correct_option, marks)
VALUES ('a0000000-0000-0000-0000-000000000001', 48, 'In a nuclear reactor, heavy water (D₂O) or graphite is primarily used as a:', NULL, '["A) Coolant to absorb heat","B) Moderator to slow down fast neutrons","C) Control rod to absorb neutrons","D) Nuclear fuel"]'::jsonb, 'B', 1);
