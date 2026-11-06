const fs = require('fs');
const path = require('path');

const questions = [
  // Section A: Dual Nature of Radiation and Matter (Pages 374–379)
  {
    order: 1,
    text: "A steel ball of mass m is moving with a kinetic energy K. The de-Broglie wavelength associated with the ball is",
    visual_content: null,
    options: [
      "A) h/2mK",
      "B) √(h/2mK)",
      "C) h/√(2mK)",
      "D) None of these"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 2,
    text: "If a photon and an electron have same de-Broglie wavelength, then",
    visual_content: null,
    options: [
      "A) both have same kinetic energy",
      "B) photon has more K.E. than electron",
      "C) electron has more K.E. than photon",
      "D) both have same velocity"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 3,
    text: "For an electron accelerated from rest through a potential V, the de Broglie wavelength associated will be",
    visual_content: null,
    options: [
      "A) 1.772/√V nm",
      "B) 1.227/√V μm",
      "C) 1.227/√V nm",
      "D) 1.772/√V μm"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 4,
    text: "If E1, E2, E3 are the respective kinetic energies of an electron, an alpha-particle and a proton, each having the same de-Broglie wavelength, then",
    visual_content: null,
    options: [
      "A) E1 > E3 > E2",
      "B) E2 > E3 > E1",
      "C) E1 > E2 > E3",
      "D) E1 = E2 = E3"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 5,
    text: "If the momentum of electron is changed by P, then the de Broglie wavelength associated with it changes by 0.5%. The initial momentum of electron will be",
    visual_content: null,
    options: [
      "A) 200P",
      "B) 400P",
      "C) P/200",
      "D) 100P"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 6,
    text: "If the kinetic energy of a free electron doubles, its de-Broglie wavelength changes by the factor",
    visual_content: null,
    options: [
      "A) 2",
      "B) 1/2",
      "C) √2",
      "D) 1/√2"
    ],
    correct_option: "D",
    marks: 1
  },
  {
    order: 7,
    text: "If the kinetic energy of the particle is increased to 16 times its previous value, the percentage change in the de-Broglie wavelength of the particle is",
    visual_content: null,
    options: [
      "A) 25",
      "B) 75",
      "C) 60",
      "D) 50"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 8,
    text: "The magnitude of the de-Broglie wavelength (λ) of electron (e), proton (p), neutron (n) and α-particle (α) all having the same energy of 1 MeV, in the increasing order will follow the sequence",
    visual_content: null,
    options: [
      "A) λe, λp, λn, λα",
      "B) λe, λn, λp, λα",
      "C) λα, λn, λp, λe",
      "D) λp, λe, λα, λn"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 9,
    text: "Which of the following when falls on a metal will emit photoelectrons?",
    visual_content: null,
    options: [
      "A) UV radiations",
      "B) Infrared radiation",
      "C) Radio waves",
      "D) Microwaves"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 10,
    text: "Sodium and copper have work functions 2.3 eV and 4.5 eV respectively. Then the ratio of the wavelengths is nearest to",
    visual_content: null,
    options: [
      "A) 1 : 2",
      "B) 4 : 1",
      "C) 2 : 1",
      "D) 1 : 4"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 11,
    text: "4 eV is the energy of incident photon and the work function is 2 eV. The stopping potential will be",
    visual_content: null,
    options: [
      "A) 2 V",
      "B) 4 V",
      "C) 6 V",
      "D) 2√2 V"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 12,
    text: "The photoelectric work function for a metal surface is 4.125 eV. The cut-off wavelength for this surface is",
    visual_content: null,
    options: [
      "A) 4125 Å",
      "B) 3000 Å",
      "C) 6000 Å",
      "D) 2062 Å"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 13,
    text: "For intensity I of a light of wavelength 5000 Å the photoelectron saturation current is 0.40 μA and stopping potential is 1.36 V. The work function of the metal is",
    visual_content: null,
    options: [
      "A) 2.47 eV",
      "B) 1.36 eV",
      "C) 1.10 eV",
      "D) 0.43 eV"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 14,
    text: "Two radiations of photon energies 1 eV and 2.5 eV successively illuminate a photosensitive metallic surface of work function 0.5 eV. The ratio of the maximum speeds of the emitted electrons is",
    visual_content: null,
    options: [
      "A) 1 : 4",
      "B) 1 : 2",
      "C) 1 : 1",
      "D) 1 : 5"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 15,
    text: "In photoelectric emission process from a metal of work function 1.8 eV, the kinetic energy of most energetic electrons is 0.5 eV. The corresponding stopping potential is",
    visual_content: null,
    options: [
      "A) 1.8 V",
      "B) 1.2 V",
      "C) 0.5 V",
      "D) 2.3 V"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 16,
    text: "The threshold frequency for a photosensitive metal is 3.3 × 10¹⁴ Hz. If light of frequency 8.2 × 10¹⁴ Hz is incident on this metal, the cut-off voltage for the photoelectric emission is nearly",
    visual_content: null,
    options: [
      "A) 2 V",
      "B) 3 V",
      "C) 5 V",
      "D) 1 V"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 17,
    text: "Light of wavelength 3500 Å is incident on two metals A and B whose work functions are 3.2 eV and 1.9 eV respectively. Which metal will emit photoelectrons?",
    visual_content: null,
    options: [
      "A) A",
      "B) B",
      "C) Both A and B",
      "D) Neither A nor B"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 18,
    text: "Light of wavelength λA and λB falls on two identical metal plates A and B respectively. The maximum kinetic energy of photoelectrons is KA and KB respectively. Which one of the following relations is true? (λA = 2λB)",
    visual_content: null,
    options: [
      "A) KA < KB/2",
      "B) 2KA = KB",
      "C) KA = 2KB",
      "D) KA > 2KB"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 19,
    text: "In photoelectric effect, stopping potential for a light of frequency n1 is V1. If light is replaced by another having a frequency n2, then its stopping potential will be",
    visual_content: null,
    options: [
      "A) V1 − (h/e)(n2 − n1)",
      "B) V1 + (h/e)(n2 + n1)",
      "C) V1 + (h/e)(n2 − 2n1)",
      "D) V1 + (h/e)(n2 − n1)"
    ],
    correct_option: "D",
    marks: 1
  },
  {
    order: 20,
    text: "In a photoelectric effect measurement, the stopping potential for a given metal is found to be V0 volt when radiation of wavelength λ0 is used. If radiation of wavelength 2λ0 is used with the same metal, then the stopping potential (in volt) will be",
    visual_content: null,
    options: [
      "A) V0/2",
      "B) 2V0",
      "C) V0 + hc/2eλ0",
      "D) V0 − hc/2eλ0"
    ],
    correct_option: "D",
    marks: 1
  },
  {
    order: 21,
    text: "The short wavelength limit of continuous X-radiation emitted by an X-ray tube operating at 30 kV is 0.414 Å. Calculate Planck's constant.",
    visual_content: null,
    options: [
      "A) 6.22 × 10⁻³⁴ erg-sec",
      "B) 6.624 × 10⁻²⁴ erg-sec",
      "C) 6.624 × 10⁻²⁷ J-sec",
      "D) 6.624 × 10⁻³⁴ J-sec"
    ],
    correct_option: "D",
    marks: 1
  },

  // Section B: Nuclei (Pages 404–408)
  {
    order: 22,
    text: "A radioactive element forms its own isotope after 3 consecutive disintegrations. The particles emitted are",
    visual_content: null,
    options: [
      "A) 3 β-particles",
      "B) 2 β-particles and 1 α-particle",
      "C) 3 β-particles and 1 α-particle",
      "D) 2 α-particles and 1 β-particle"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 23,
    text: "An element A decays into an element C by a two-step process: A → B + ₂He⁴ and B → C + 2 ₋₁e⁰. Then",
    visual_content: null,
    options: [
      "A) A and C are isotopes",
      "B) A and C are isobars",
      "C) B and C are isotopes",
      "D) A and B are isobars"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 24,
    text: "When ₃Li⁷ nuclei are bombarded by protons, and the resultant nuclei are ₄Be⁸, the emitted particles will be",
    visual_content: null,
    options: [
      "A) alpha particles",
      "B) beta particles",
      "C) gamma photons",
      "D) neutrons"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 25,
    text: "If N0 is the original mass of the substance of half-life period t1/2 = 5 years, then the amount of substance left after 15 years is",
    visual_content: null,
    options: [
      "A) N0/8",
      "B) N0/16",
      "C) N0/2",
      "D) N0/4"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 26,
    text: "If T is the half life of a radioactive material, then the fraction that would remain after a time T/2 is",
    visual_content: null,
    options: [
      "A) 1/2",
      "B) 3/4",
      "C) 1/√2",
      "D) (√2 − 1)/√2"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 27,
    text: "Starting with a sample of pure ⁶⁶Cu, 7/8 of it decays into Zn in 15 minutes. The corresponding half life is",
    visual_content: null,
    options: [
      "A) 15 minutes",
      "B) 10 minutes",
      "C) 7½ minutes",
      "D) 5 minutes"
    ],
    correct_option: "D",
    marks: 1
  },
  {
    order: 28,
    text: "A radioactive element forms its own isotope after three consecutive disintegrations. The particles emitted are",
    visual_content: null,
    options: [
      "A) 3 β-particles",
      "B) 2 β-particles and 1 α-particle",
      "C) 3 β-particles and 1 α-particle",
      "D) 2 α-particles and 1 β-particle"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 29,
    text: "The ratio of half-life times of two elements A and B is TA/TB. The ratio of respective decay constants λA/λB is",
    visual_content: null,
    options: [
      "A) TB/TA",
      "B) TA/TB",
      "C) (TA + TB)/TA",
      "D) (TA − TB)/TA"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 30,
    text: "The half life of the radioactive substance is 40 days. The substance will disintegrate completely in",
    visual_content: null,
    options: [
      "A) 40 days",
      "B) 400 days",
      "C) 4000 days",
      "D) infinite time"
    ],
    correct_option: "D",
    marks: 1
  },
  {
    order: 31,
    text: "A radioactive substance contains 10000 nuclei and its half-life period is 20 days. The number of nuclei present at the end of 10 days is",
    visual_content: null,
    options: [
      "A) 7070",
      "B) 9000",
      "C) 8000",
      "D) 7500"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 32,
    text: "An archaeologist analyses the wood in a prehistoric structure and finds that the ratio of C14 (half life = 5700 years) to C12 is only one-fourth of that found in the cells of buried plants. The age of the wood is about",
    visual_content: null,
    options: [
      "A) 5700 years",
      "B) 2850 years",
      "C) 11,400 years",
      "D) 22,800 years"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 33,
    text: "A radioactive element X converts into another stable element Y. Half life of X is 2 hrs. Initially only X is present. After time t, the ratio of atoms of X and Y is found to be 1 : 4, then t in hours is",
    visual_content: null,
    options: [
      "A) 2",
      "B) 4",
      "C) between 4 and 6",
      "D) 6"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 34,
    text: "After 150 days, the activity of a radioactive sample is 5000 dps. The activity becomes 2500 dps after another 75 days. The initial activity of the sample is",
    visual_content: null,
    options: [
      "A) 20000 dps",
      "B) 40000 dps",
      "C) 7500 dps",
      "D) 10000 dps"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 35,
    text: "A nucleus with Z = 92 emits the following in a sequence: α, β⁻, β⁻, α, α, α, α, β⁻, β⁻, α, β⁺, β⁺, α. Then Z of the resulting nucleus is",
    visual_content: null,
    options: [
      "A) 76",
      "B) 78",
      "C) 82",
      "D) 74"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 36,
    text: "A radioactive nucleus undergoes a series of decay according to the scheme A —α→ A1 —β→ A2 —α→ A3 —γ→ A4. If the mass number and atomic number of 'A' are 180 and 72 respectively, then what are these numbers for A4?",
    visual_content: null,
    options: [
      "A) 172 and 69",
      "B) 174 and 70",
      "C) 176 and 69",
      "D) 176 and 70"
    ],
    correct_option: "A",
    marks: 1
  },

  // Section C: Semiconductor Electronics – Logic Gates (Pages 421–422)
  {
    order: 37,
    text: "Identify the logic gate whose truth table is given:\n\n| A | B | C |\n|---|---|---|\n| 0 | 0 | 1 |\n| 0 | 1 | 1 |\n| 1 | 0 | 1 |\n| 1 | 1 | 0 |",
    visual_content: "Truth table shows: C = 1 for inputs (0,0), (0,1), (1,0) and C = 0 for (1,1).",
    options: [
      "A) XOR",
      "B) OR",
      "C) AND",
      "D) NAND"
    ],
    correct_option: "D",
    marks: 1
  },
  {
    order: 38,
    text: "The figure shows a logic circuit with two inputs A and B and output C. The voltage waveforms across A, B and C are given. The logic gate circuit is:\n\n• Before t1: A=0, B=0 → C=0\n• t1 to t4: A=1 or B=1 → C=1\n• t4 to t5: A=0, B=0 → C=0\n• t5 to t6: A=1, B=0 → C=1",
    visual_content: "Waveform analysis: Output C is HIGH whenever either input A or B is HIGH. Output C is LOW only when both A and B are LOW.",
    options: [
      "A) OR gate",
      "B) NOR gate",
      "C) AND gate",
      "D) NAND gate"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 39,
    text: "Which of the following gates will have an output of 1?\n\n(A) NAND gate with inputs 1, 1\n(B) NOR gate with inputs 0, 1\n(C) NAND gate with inputs 0, 1\n(D) XOR gate with inputs 0, 0",
    visual_content: "Gate (C) has inputs 0 and 1 into a NAND gate: Output = NOT(0 AND 1) = NOT(0) = 1.",
    options: [
      "A) D",
      "B) A",
      "C) B",
      "D) C"
    ],
    correct_option: "D",
    marks: 1
  },
  {
    order: 40,
    text: "The following circuit represents:\n\nCircuit: Inputs A and B.\nTop branch: NOT(A) and B enter an AND gate → (NOT A)·B\nBottom branch: A and NOT(B) enter an AND gate → A·(NOT B)\nBoth branches enter an OR gate producing output Y.",
    visual_content: "Logic expression: Y = (NOT A · B) + (A · NOT B) = A XOR B.",
    options: [
      "A) OR gate",
      "B) XOR gate",
      "C) AND gate",
      "D) NAND gate"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 41,
    text: "The following configuration of gates is equivalent to:\n\nCircuit: Inputs A and B feed an OR gate. Inputs A and B also feed a NAND gate. The outputs of the OR gate and NAND gate feed an AND gate producing output Y.",
    visual_content: "Logic expression: Y = (A OR B) AND (NOT(A AND B)) = (A + B) · (A' + B') = A·B' + A'·B = A XOR B.",
    options: [
      "A) NAND gate",
      "B) XOR gate",
      "C) OR gate",
      "D) NOR gate"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 42,
    text: "In the following circuit, the output Y for all possible inputs A and B is expressed by the truth table:\n\nCircuit: Inputs A and B enter a NOR gate G1. The output of G1 is tied to both inputs of a second NOR gate G2 producing Y.",
    visual_content: "Logic expression: G1 = NOT(A OR B). G2 inverts G1: Y = NOT(NOT(A OR B)) = A OR B.\nTruth table for OR: (0,0)→0; (0,1)→1; (1,0)→1; (1,1)→1.",
    options: [
      "A) Truth table: (0,0)→1, (0,1)→1, (1,0)→1, (1,1)→0",
      "B) Truth table: (0,0)→1, (0,1)→0, (1,0)→0, (1,1)→0",
      "C) Truth table: (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→1",
      "D) Truth table: (0,0)→0, (0,1)→0, (1,0)→0, (1,1)→1"
    ],
    correct_option: "C",
    marks: 1
  },
  {
    order: 43,
    text: "The combination of gates shown below yields:\n\nCircuit: Input A enters a NAND gate with tied inputs (NOT A). Input B enters a NAND gate with tied inputs (NOT B). The two inverted outputs feed a final NAND gate producing output X.",
    visual_content: "Logic expression: X = NOT((NOT A) AND (NOT B)) = NOT(NOT(A OR B)) = A OR B.",
    options: [
      "A) OR gate",
      "B) NOT gate",
      "C) XOR gate",
      "D) NAND gate"
    ],
    correct_option: "A",
    marks: 1
  },
  {
    order: 44,
    text: "For the given combination of gates, if the logic states of inputs A, B, C are:\nCase 1: A = B = C = 0\nCase 2: A = B = 1, C = 0\nthen the logic states of output D are respectively:\n\nCircuit: Inputs A and B enter an OR gate G1. Output of G1 and input C enter a NAND gate G2 producing D.",
    visual_content: "Logic expression: D = NOT(G1 AND C) = NOT((A OR B) AND C).\nCase 1: C=0 → D = NOT(0) = 1.\nCase 2: C=0 → D = NOT(0) = 1.",
    options: [
      "A) 0, 0",
      "B) 0, 1",
      "C) 1, 0",
      "D) 1, 1"
    ],
    correct_option: "D",
    marks: 1
  },
  {
    order: 45,
    text: "Which logic gate with inputs A and B performs the same operation as that performed by the following circuit?\n\nCircuit: A battery circuit contains two switches A and B connected in parallel in the path to a lamp.",
    visual_content: "Electrical logic: If either switch A is closed OR switch B is closed, the circuit is completed and current illuminates the lamp.",
    options: [
      "A) NAND gate",
      "B) OR gate",
      "C) NOR gate",
      "D) AND gate"
    ],
    correct_option: "B",
    marks: 1
  },
  {
    order: 46,
    text: "The logic circuit shown below has the input waveforms 'A' and 'B' as shown. Pick out the correct output waveform:\n\nCircuit: A enters a NOT gate; B enters a NOT gate. Both inverted outputs enter a NOR gate producing output Y.",
    visual_content: "Logic expression: Y = NOT((NOT A) OR (NOT B)) = A AND B.\nOutput Y is HIGH (1) only when BOTH A and B are HIGH (in interval t3-t4 and interval t5-t6).",
    options: [
      "A) Output waveform (a)",
      "B) Output waveform (b)",
      "C) Output waveform (c)",
      "D) Output waveform (d)"
    ],
    correct_option: "C",
    marks: 1
  }
];

fs.writeFileSync(path.resolve(__dirname, '../questions.json'), JSON.stringify(questions, null, 2), 'utf8');
console.log('Successfully wrote', questions.length, 'questions to questions.json');
