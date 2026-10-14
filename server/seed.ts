import { db } from './db.js';
import { hashPassword } from './auth.js';

export function seedDemoDataIfEmpty() {
  const existingUsers = db.getUserByEmail('alex@studymate.edu');
  if (existingUsers) {
    return; // Already seeded
  }

  const demoUser = db.createUser({
    email: 'alex@studymate.edu',
    passwordHash: hashPassword('password123'),
    fullName: 'Alex Morgan',
    educationLevel: 'Undergraduate Computer Science & Pre-Med',
    preferredProvider: 'gemini',
    openRouterModel: 'google/gemini-2.0-flash-001',
  });

  // Seed Doc 1: Cellular Respiration
  const bioText = `Cellular Respiration and ATP Synthesis: Comprehensive Biological Mechanisms

1. Overview of Cellular Respiration
Cellular respiration is the catabolic biochemical pathway by which aerobic organisms extract chemical energy from nutrient molecules (primarily glucose, C6H12O6) and store it in high-energy bonds of adenosine triphosphate (ATP). The overall chemical equation is:
C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30 to 32 ATP + heat.

2. Glycolysis (Cytoplasm)
Glycolysis is an anaerobic process taking place in the cytosol. One six-carbon glucose molecule is cleaved into two three-carbon pyruvate molecules.
- Energy Investment Phase: Two ATP molecules are hydrolyzed to phosphorylate glucose into fructose-1,6-bisphosphate.
- Cleavage and Energy Payoff Phase: Fructose-1,6-bisphosphate is cleaved into G3P and DHAP. Subsequent enzymatic conversions produce 4 ATP through substrate-level phosphorylation and 2 NADH.
- Net Yield per glucose: 2 Pyruvate, 2 Net ATP, 2 NADH.
- Key Regulatory Enzyme: Phosphofructokinase-1 (PFK-1), allosterically inhibited by high ATP and citrate, and stimulated by AMP and ADP.

3. The Link Reaction (Pyruvate Decarboxylation)
Pyruvate enters the mitochondrial matrix via active transport (mitochondrial pyruvate carrier). The multienzyme Pyruvate Dehydrogenase Complex (PDC) catalyzes:
Pyruvate + NAD+ + Coenzyme A -> Acetyl-CoA + CO2 + NADH.
Because one glucose yields two pyruvates, this step yields 2 Acetyl-CoA, 2 CO2, and 2 NADH.

4. The Citric Acid Cycle (Krebs Cycle)
Occurring within the mitochondrial matrix, Acetyl-CoA (2C) condenses with Oxaloacetate (4C) to form Citrate (6C), catalyzed by citrate synthase.
Through a cycle of eight enzymatic steps:
- 2 CO2 are released per Acetyl-CoA (4 CO2 per glucose).
- 3 NADH and 1 FADH2 are produced per turn (6 NADH and 2 FADH2 per glucose).
- 1 GTP (or ATP) is synthesized per turn via substrate-level phosphorylation (succinyl-CoA synthetase).
- Oxaloacetate is regenerated to restart the cycle.

5. Oxidative Phosphorylation and Electron Transport Chain (ETC)
Located in the inner mitochondrial membrane (cristae), the ETC consists of four protein complexes (I, II, III, IV) and ATP synthase (Complex V).
- Complex I (NADH dehydrogenase): Receives electrons from NADH, pumps 4 H+ into the intermembrane space.
- Complex II (Succinate dehydrogenase): Receives electrons from FADH2 without pumping protons.
- Ubiquinone (CoQ) & Cytochrome c: Mobile carriers transferring electrons down an electronegativity gradient.
- Complex III (Cytochrome bc1): Pumps 4 H+.
- Complex IV (Cytochrome c oxidase): Transfers electrons to the terminal electron acceptor, molecular oxygen (O2), reducing it to water (H2O), while pumping 2 H+.
- Chemiosmosis: The proton motive force (electrochemical gradient across the inner membrane) drives H+ through the catalytic FoF1 ATP Synthase, producing ~2.5 ATP per NADH and ~1.5 ATP per FADH2.

6. Anaerobic Fermentation
In the absence of oxygen, cells undergo lactic acid fermentation (e.g., human skeletal muscle) or ethanol fermentation (e.g., yeast) to re-oxidize NADH back into NAD+, sustaining glycolysis for emergency ATP generation.`;

  const doc1 = db.createDocument({
    userId: demoUser.id,
    title: 'Cellular Respiration & ATP Synthesis',
    originalFilename: 'cellular_respiration_notes.txt',
    mimetype: 'text/plain',
    fileSize: 4210,
    wordCount: 512,
    characterCount: 3105,
    extractedText: bioText,
    snippet: 'Cellular respiration is the catabolic biochemical pathway by which aerobic organisms extract chemical energy from nutrient molecules...',
  });

  // Seed Summary for Doc 1
  const summary1 = db.createSummary({
    userId: demoUser.id,
    documentId: doc1.id,
    title: 'Cellular Respiration & ATP Synthesis - Study Guide',
    summaryType: 'standard',
    content: `## 1. Introduction and Overview
Cellular respiration is the foundational metabolic engine of aerobic life, transforming biochemical energy stored in hexose sugars into usable cellular currency (**ATP**). The net balanced equation is:
**C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + ~30-32 ATP**

## 2. Topic-Wise Explanations
- **Glycolysis (Cytosol)**: Anaerobic breakdown of glucose into 2 pyruvates. Consumes 2 ATP in the investment stage and synthesizes 4 ATP, netting 2 ATP and 2 NADH. Controlled centrally by **PFK-1**.
- **Pyruvate Decarboxylation (Mitochondrial Matrix)**: Pyruvate is enzymatically converted into Acetyl-CoA by the **Pyruvate Dehydrogenase Complex**, generating 1 CO2 and 1 NADH per pyruvate.
- **Citric Acid (Krebs) Cycle (Matrix)**: Acetyl-CoA joins oxaloacetate to generate citrate. Two complete turns per glucose yield 6 NADH, 2 FADH2, 2 GTP/ATP, and 4 CO2.
- **Oxidative Phosphorylation & ETC (Inner Mitochondrial Membrane)**: Electron flow through Complexes I-IV drives proton pumping across the cristae, generating a proton gradient that powers **FoF1 ATP Synthase** (chemiosmosis).

## 3. Important Concepts and Definitions
- **Substrate-Level Phosphorylation**: Direct synthesis of ATP from ADP by transferring a phosphate group from a phosphorylated metabolic intermediate.
- **Proton Motive Force (PMF)**: The combined chemical and electrical potential gradient across the inner mitochondrial membrane driving ATP synthesis.
- **Phosphofructokinase-1 (PFK-1)**: The primary rate-limiting enzyme of glycolysis, sensitive to the ATP/AMP cellular ratio.
- **Chemiosmosis**: Coupling of the electrochemical proton gradient to ATP generation via ATP synthase.

## 4. Key Points & Takeaways
- Glycolysis is anaerobic and takes place in the cytosol; all subsequent stages take place inside the mitochondria.
- Molecular oxygen (O2) functions as the terminal electron acceptor, forming water.
- Yield per glucose: ~2.5 ATP per NADH and ~1.5 ATP per FADH2.
- Fermentation regenerates NAD+ so glycolysis can continue when oxygen is depleted.

## 5. Examples and Formulas
- Overall Reaction: \`C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + 30-32 ATP\`
- Glycolysis Net Yield: \`1 Glucose -> 2 Pyruvate + 2 ATP (net) + 2 NADH\`
- Krebs Cycle Turn: \`1 Acetyl-CoA -> 2 CO2 + 3 NADH + 1 FADH2 + 1 GTP\`

## 6. Quick Revision Notes
- Where does Glycolysis occur? -> Cytosol (cytoplasm)
- Terminal electron acceptor in ETC? -> Oxygen (O2)
- Enzyme inhibited by high ATP in glycolysis? -> PFK-1
- Total net ATP per aerobic glucose molecule? -> 30 to 32 ATP

## 7. Conclusion
Aerobic respiration maximizes energy extraction through tightly coordinated compartmentalized stages. Understanding the redox cofactors (NADH and FADH2) and mitochondrial proton gradients is central to mastering cellular energetics.`,
    keyPoints: [
      'Glycolysis occurs in the cytosol without requiring oxygen, yielding 2 net ATP and 2 NADH.',
      'Pyruvate dehydrogenase complex converts pyruvate into Acetyl-CoA in the mitochondrial matrix.',
      'The Citric Acid Cycle produces 6 NADH, 2 FADH2, and 2 GTP/ATP per glucose molecule.',
      'Oxygen acts as the terminal electron acceptor at Complex IV of the electron transport chain.',
      'Chemiosmosis uses the proton motive force through ATP synthase to produce approximately 30-32 ATP.',
    ],
    wordCount: 468,
  });

  // Seed Quiz for Doc 1
  const quiz1 = db.createQuiz({
    userId: demoUser.id,
    documentId: doc1.id,
    summaryId: summary1.id,
    title: 'Cellular Respiration Mastery Quiz',
    difficulty: 'medium',
    questionCount: 5,
    questionType: 'multiple_choice',
    questions: [
      {
        id: 'q_1',
        question: 'Where within a eukaryotic cell does glycolysis take place?',
        type: 'multiple_choice',
        options: ['Cytosol (Cytoplasm)', 'Mitochondrial Matrix', 'Inner Mitochondrial Membrane', 'Intermembrane Space'],
        correctAnswerIndex: 0,
        explanation: 'Glycolysis is an anaerobic metabolic pathway that occurs entirely in the cytosol of eukaryotic and prokaryotic cells.',
        topic: 'Glycolysis',
      },
      {
        id: 'q_2',
        question: 'What is the net ATP yield generated strictly from glycolysis per single molecule of glucose?',
        type: 'multiple_choice',
        options: ['4 ATP', '2 ATP', '30 ATP', '1 ATP'],
        correctAnswerIndex: 1,
        explanation: 'Glycolysis consumes 2 ATP in the investment phase and produces 4 ATP in the payoff phase, resulting in a net yield of 2 ATP.',
        topic: 'Glycolysis',
      },
      {
        id: 'q_3',
        question: 'Which molecule serves as the terminal electron acceptor in aerobic respiration at Complex IV?',
        type: 'multiple_choice',
        options: ['Carbon dioxide (CO2)', 'Molecular oxygen (O2)', 'NAD+', 'Water (H2O)'],
        correctAnswerIndex: 1,
        explanation: 'Molecular oxygen (O2) acts as the final electron acceptor in the electron transport chain, binding protons to form water.',
        topic: 'Electron Transport Chain',
      },
      {
        id: 'q_4',
        question: 'Which key enzyme serves as the primary regulatory checkpoint in glycolysis and is inhibited by high ATP levels?',
        type: 'multiple_choice',
        options: ['Hexokinase', 'Pyruvate kinase', 'Phosphofructokinase-1 (PFK-1)', 'Citrate synthase'],
        correctAnswerIndex: 2,
        explanation: 'Phosphofructokinase-1 (PFK-1) catalyzes the committed step of glycolysis and is allosterically inhibited by ATP and citrate.',
        topic: 'Enzyme Regulation',
      },
      {
        id: 'q_5',
        question: 'During oxidative phosphorylation, where do protons accumulate to create the electrochemical proton gradient?',
        type: 'multiple_choice',
        options: ['Mitochondrial intermembrane space', 'Mitochondrial matrix', 'Outer cytoplasm', 'Endoplasmic reticulum lumen'],
        correctAnswerIndex: 0,
        explanation: 'Complexes I, III, and IV pump protons from the matrix into the intermembrane space, creating the proton motive force.',
        topic: 'Chemiosmosis',
      },
    ],
  });

  // Seed Quiz Attempt
  db.createQuizAttempt({
    userId: demoUser.id,
    quizId: quiz1.id,
    quizTitle: quiz1.title,
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    userAnswers: {
      q_1: 0,
      q_2: 1,
      q_3: 1,
      q_4: 2,
      q_5: 1, // missed (chose matrix instead of intermembrane)
    },
    timeSpentSeconds: 145,
  });

  console.log('Demo user and sample data successfully seeded.');
}
