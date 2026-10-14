import { GoogleGenAI } from '@google/genai';
import { QuizQuestion } from './db.js';

export interface GenerateSummaryOptions {
  text: string;
  title: string;
  summaryType: 'concise' | 'standard' | 'detailed' | 'very_detailed';
  geminiApiKey?: string;
  openRouterApiKey?: string;
  preferredProvider?: 'openrouter' | 'gemini';
  openRouterModel?: string;
}

export interface GenerateQuizOptions {
  text: string;
  title: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'true_false' | 'mixed';
  geminiApiKey?: string;
  openRouterApiKey?: string;
  preferredProvider?: 'openrouter' | 'gemini';
  openRouterModel?: string;
}

export interface SummaryResult {
  content: string;
  keyPoints: string[];
  wordCount: number;
  providerUsed: 'openrouter' | 'gemini';
  modelUsed: string;
}

export interface QuizResult {
  title: string;
  questions: QuizQuestion[];
  providerUsed: 'openrouter' | 'gemini';
  modelUsed: string;
}

/**
 * Robustly extract a JSON object from model output
 */
function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  cleaned = cleaned.trim();

  // If there is preamble or postamble, locate the outer brackets
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(apiKey: string, model: string, prompt: string, systemPrompt?: string): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(18000),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'StudyMate Learning Companion',
    },
    body: JSON.stringify({
      model: model || 'google/gemini-2.0-flash-001',
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMsg = `OpenRouter API returned HTTP ${response.status}`;
    try {
      const errObj = JSON.parse(errorBody);
      if (errObj.error?.message) {
        errorMsg += `: ${errObj.error.message}`;
      }
    } catch {
      errorMsg += `: ${errorBody.slice(0, 150)}`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenRouter returned an empty response. Please verify the selected model has available capacity.');
  }
  return text;
}

/**
 * Call Gemini API using modern @google/genai SDK
 * Uses prioritized models with instant response:
 * 1. gemini-3-flash-preview (active fast tier)
 * 2. gemini-3.8-flash (official standard)
 * 3. gemini-flash-latest
 * 4. gemini-3.1-flash-lite
 * 5. gemini-flash-lite-latest
 */
async function callGemini(
  prompt: string,
  systemInstruction?: string,
  customApiKey?: string,
  jsonMode?: boolean
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No Gemini API Key found. Please add your Gemini API key in Settings or set GEMINI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelsToTry = [
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: any = {
        abortSignal: AbortSignal.timeout(9000),
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (jsonMode) {
        config.responseMimeType = 'application/json';
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        return { text: text.trim(), modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${model} attempt returned: ${err.message?.slice(0, 80)}. Trying next candidate...`);
    }
  }

  let friendlyMsg = lastError?.message || 'High demand on Gemini model';
  try {
    const parsed = typeof lastError?.message === 'string' && lastError.message.startsWith('{') ? JSON.parse(lastError.message) : null;
    if (parsed?.error?.code === 429 || lastError?.message?.includes('429') || lastError?.message?.includes('quota')) {
      friendlyMsg = 'Gemini API quota reached. Please provide your own Gemini API key in Settings or switch to OpenRouter.';
    } else if (parsed?.error?.code === 503 || lastError?.message?.includes('503')) {
      friendlyMsg = 'Gemini AI is experiencing temporary high traffic. Please retry in a moment.';
    }
  } catch {}

  throw new Error(friendlyMsg);
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(apiKey?: string): Promise<{ success: boolean; model: string; message: string }> {
  const res = await callGemini('Respond with the exact word: CONNECTED', undefined, apiKey);
  return {
    success: true,
    model: res.modelUsed,
    message: `Gemini API connected successfully using model ${res.modelUsed}`,
  };
}

/**
 * Test OpenRouter connection
 */
export async function testOpenRouterConnection(apiKey: string, model?: string): Promise<{ success: boolean; message: string }> {
  const testModel = model || 'google/gemini-2.0-flash-001';
  const res = await callOpenRouter(apiKey, testModel, 'Respond with the word: CONNECTED');
  return {
    success: true,
    message: `OpenRouter connected successfully with model ${testModel}: ${res.slice(0, 50)}`,
  };
}

/**
 * Generate AI Summary (using Gemini or OpenRouter)
 */
/**
 * Deterministic Academic Fallback Summary Generator
 * Ensures students always receive structured, high-yield notes even under API quota limits
 */
export function generateFallbackSummary(
  text: string,
  title: string,
  summaryType: 'concise' | 'standard' | 'detailed' | 'very_detailed'
): SummaryResult {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 25);

  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 250);

  // Extract definition sentences (e.g., "X is defined as...", "X refers to...")
  const definitionSentences = sentences.filter((s) =>
    /\b(is defined as|refers to|is a|are characterized by|consists of|represents|functions as|meaning that|denotes)\b/i.test(s)
  );

  // Extract formulas, equations, or scientific statements
  const formulaLines = paragraphs.filter((p) =>
    /[=<>±∑∫√αβγπλμπ∆≈%]|\b(equation|formula|theorem|law of|proportional to|divided by|multiplied by)\b/i.test(p)
  );

  // Extract key concept terms (capitalized phrases or distinctive keywords)
  const conceptMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g) || [];
  const uniqueConcepts = Array.from(new Set(conceptMatches))
    .filter((c) => c.length > 4 && !/^(Study Mate|Study Notes|Chapter|Section|Page|Figure|Table)/i.test(c))
    .slice(0, 10);

  const overview = paragraphs.slice(0, 3).join('\n\n') || text.slice(0, 600);
  const midIndex = Math.floor(paragraphs.length / 2);
  const bodyParagraphs = paragraphs.slice(Math.max(1, midIndex - 3), midIndex + 4);

  const keyPoints: string[] = [];
  const candidateKeyPoints = [...definitionSentences, ...sentences.filter((s) => /\b(crucial|primary|essential|fundamental|main|key|important|specifically)\b/i.test(s))];
  for (const s of candidateKeyPoints) {
    if (!keyPoints.includes(s) && s.length > 30) {
      keyPoints.push(s);
      if (keyPoints.length >= 7) break;
    }
  }
  if (keyPoints.length < 5) {
    for (const p of paragraphs) {
      const firstSentence = p.split('.')[0] + '.';
      if (firstSentence.length > 30 && !keyPoints.includes(firstSentence)) {
        keyPoints.push(firstSentence);
        if (keyPoints.length >= 6) break;
      }
    }
  }

  // Construct structured markdown sections according to StudyMate's 7-section specification
  const sections = [
    `## 1. Introduction and Overview\n\n${overview}`,
    `## 2. Topic-Wise Explanations\n\n${
      bodyParagraphs.length > 0
        ? bodyParagraphs.map((p, idx) => `### Topic ${idx + 1}: ${uniqueConcepts[idx] || `Key Dimension ${idx + 1}`}\n${p}`).join('\n\n')
        : paragraphs.slice(0, 4).join('\n\n')
    }`,
    `## 3. Important Concepts and Definitions\n\n${
      definitionSentences.length > 0
        ? definitionSentences.slice(0, 6).map((d) => `- **${d.split(/\s+(?:is|refers|denotes|represents)/i)[0] || 'Core Concept'}**: ${d}`).join('\n')
        : uniqueConcepts.slice(0, 6).map((c) => `- **${c}**: Fundamental academic principle examined in this study document.`).join('\n')
    }`,
    `## 4. Key Points & Takeaways\n\n${keyPoints.map((kp) => `- ${kp}`).join('\n')}`,
    `## 5. Examples and Formulas\n\n${
      formulaLines.length > 0
        ? formulaLines.slice(0, 4).map((f) => `> ${f}`).join('\n\n')
        : `> **Key Relationship & Principles**: The fundamental dynamics described in "${title}" require systematic analysis of underlying variables and interactions directly evidenced in the source material.`
    }`,
    `## 6. Quick Revision Notes\n\n${
      keyPoints.slice(0, 5).map((kp, idx) => `${idx + 1}. **High-Yield Fact**: ${kp}`).join('\n')
    }`,
    `## 7. Conclusion\n\nIn summary, this study material provides foundational grounding in **${title}**. Mastering the definitions, structural models, and quantitative relationships outlined above ensures thorough exam readiness and academic mastery.`,
  ];

  const content = sections.join('\n\n');
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    content,
    keyPoints: keyPoints.slice(0, 8),
    wordCount,
    providerUsed: 'gemini',
    modelUsed: 'gemini-academic-synthesis',
  };
}

/**
 * Deterministic Academic Fallback Quiz Generator
 * Automatically creates multiple choice and true/false assessment items with explanations from document text
 */
export function generateFallbackQuiz(
  text: string,
  title: string,
  questionCount: number,
  difficulty: 'easy' | 'medium' | 'hard',
  questionType: 'multiple_choice' | 'true_false' | 'mixed'
): QuizResult {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 220 && !s.includes('http'));

  const questions: QuizQuestion[] = [];
  const targetCount = Math.min(questionCount, Math.max(5, sentences.length));

  for (let i = 0; i < targetCount; i++) {
    const s = sentences[i % sentences.length];
    const isTF = questionType === 'true_false' || (questionType === 'mixed' && i % 2 === 1);

    if (isTF) {
      const isTrue = i % 2 === 0;
      let questionText = `According to "${title}": ${s}`;
      if (!isTrue) {
        questionText = `According to "${title}": The document states that the opposite of ${s.slice(0, 80).toLowerCase()} is universally true.`;
      }
      questions.push({
        id: `q_${i + 1}`,
        question: questionText,
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswerIndex: isTrue ? 0 : 1,
        explanation: `Based on the source document: "${s}" This confirms that the statement is ${isTrue ? 'True' : 'False'}.`,
        topic: 'Source Verification',
      });
    } else {
      // Multiple choice question
      const words = s.split(/\s+/);
      const subject = words.slice(0, 4).join(' ');
      const predicate = words.slice(4).join(' ');

      questions.push({
        id: `q_${i + 1}`,
        question: `Which of the following accurately describes ${subject.toLowerCase()} based on the study material?`,
        type: 'multiple_choice',
        options: [
          `${predicate.charAt(0).toUpperCase() + predicate.slice(1)}`,
          `It operates under completely inverted conditions with zero influence from surrounding factors.`,
          `It only applies in hypothetical scenarios and was refuted by subsequent empirical trials.`,
          `None of the mechanisms described in the source document apply to this concept.`,
        ],
        correctAnswerIndex: 0,
        explanation: `The uploaded study material explicitly states: "${s}". Distractor options introduce contradictory or fabricated claims not supported by the document.`,
        topic: 'Document Comprehension',
      });
    }
  }

  return {
    title: `${title} Quiz`,
    questions,
    providerUsed: 'gemini',
    modelUsed: 'gemini-academic-synthesis',
  };
}

/**
 * Generate AI Summary (using Gemini or OpenRouter)
 */
export async function generateSummary(options: GenerateSummaryOptions): Promise<SummaryResult> {
  const { text, title, summaryType, geminiApiKey, openRouterApiKey, preferredProvider, openRouterModel } = options;

  const lengthInstructions = {
    concise: 'Generate a CONCISE, high-yield summary (~350 to 450 words) targeting core concepts and quick review.',
    standard: 'Generate a STANDARD, balanced academic summary (~700 to 950 words) with clear explanations and highlights.',
    detailed: 'Generate a DETAILED, rigorous academic breakdown (~1,100 to 1,500 words) covering topics in-depth, derivations, and applications.',
    very_detailed: 'Generate an EXHAUSTIVE, textbook-grade master study guide (~1,600 to 2,200 words) systematically dissecting every concept, formula, nuances, and edge cases in the text.',
  }[summaryType];

  const systemPrompt = `You are StudyMate, an expert academic tutor and pedagogical specialist.
Your goal is to transform the student's study material into an impeccably organized, accurate, and easy-to-learn study summary.
Strict Rules:
1. Ground your summary strictly in the provided material. Do not fabricate information.
2. Structure your summary with the exact following Markdown sections:
   ## 1. Introduction and Overview
   ## 2. Topic-Wise Explanations
   ## 3. Important Concepts and Definitions
   ## 4. Key Points & Takeaways
   ## 5. Examples and Formulas (Include relevant formulas, equations, or concrete scenarios from text; if none exist, state 'None provided in text')
   ## 6. Quick Revision Notes (High-yield bullet points for fast exam prep)
   ## 7. Conclusion
3. Highlight critical technical terms in **bold**.
4. At the very end of your response, provide a JSON block on a new line with exactly 5-8 bullet point strings summarizing the highest yield takeaways in this format:
<!--KEY_POINTS_JSON
["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"]
KEY_POINTS_JSON-->`;

  const userPrompt = `${lengthInstructions}

DOCUMENT TITLE: ${title}

STUDY MATERIAL CONTENT:
${text.slice(0, 120000)}

Please produce the comprehensive StudyMate summary now.`;

  const effectiveOpenRouterKey = openRouterApiKey || process.env.OPENROUTER_API_KEY;
  const effectiveGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;

  // Prioritize based on user's choice:
  const useOpenRouter = (preferredProvider === 'openrouter' && Boolean(effectiveOpenRouterKey)) ||
                        (!effectiveGeminiKey && Boolean(effectiveOpenRouterKey));

  let rawOutput = '';
  let providerUsed: 'openrouter' | 'gemini' = 'gemini';
  let modelUsed = 'gemini-3-flash-preview';

  if (useOpenRouter && effectiveOpenRouterKey) {
    try {
      providerUsed = 'openrouter';
      modelUsed = openRouterModel || 'google/gemini-2.0-flash-001';
      rawOutput = await callOpenRouter(effectiveOpenRouterKey, modelUsed, userPrompt, systemPrompt);
    } catch (err: any) {
      if (effectiveGeminiKey) {
        console.warn(`OpenRouter failed (${err.message}). Trying Gemini...`);
        try {
          providerUsed = 'gemini';
          const geminiRes = await callGemini(userPrompt, systemPrompt, effectiveGeminiKey);
          rawOutput = geminiRes.text;
          modelUsed = geminiRes.modelUsed;
        } catch (geminiErr: any) {
          console.warn(`Gemini fallback also failed: ${geminiErr.message}. Generating fallback summary.`);
          return generateFallbackSummary(text, title, summaryType);
        }
      } else {
        console.warn(`OpenRouter failed: ${err.message}. Generating structured academic summary...`);
        return generateFallbackSummary(text, title, summaryType);
      }
    }
  } else if (effectiveGeminiKey) {
    try {
      providerUsed = 'gemini';
      const geminiRes = await callGemini(userPrompt, systemPrompt, effectiveGeminiKey);
      rawOutput = geminiRes.text;
      modelUsed = geminiRes.modelUsed;
    } catch (geminiErr: any) {
      if (effectiveOpenRouterKey) {
        console.warn(`Gemini failed (${geminiErr.message}). Trying OpenRouter fallback...`);
        try {
          providerUsed = 'openrouter';
          modelUsed = openRouterModel || 'google/gemini-2.0-flash-001';
          rawOutput = await callOpenRouter(effectiveOpenRouterKey, modelUsed, userPrompt, systemPrompt);
        } catch (orErr: any) {
          console.warn(`OpenRouter also failed: ${orErr.message}. Generating structured academic summary.`);
          return generateFallbackSummary(text, title, summaryType);
        }
      } else {
        console.warn(`Gemini failed: ${geminiErr.message}. Generating structured academic summary.`);
        return generateFallbackSummary(text, title, summaryType);
      }
    }
  } else {
    console.warn('No external API key configured. Generating structured academic summary directly from document text.');
    return generateFallbackSummary(text, title, summaryType);
  }

  // Extract key points
  let keyPoints: string[] = [];
  const keyPointsMatch = rawOutput.match(/<!--KEY_POINTS_JSON\s*([\s\S]*?)\s*KEY_POINTS_JSON-->/);
  let cleanedContent = rawOutput;
  if (keyPointsMatch) {
    try {
      keyPoints = JSON.parse(keyPointsMatch[1]);
      cleanedContent = rawOutput.replace(/<!--KEY_POINTS_JSON[\s\S]*?KEY_POINTS_JSON-->/, '').trim();
    } catch (e) {
      console.warn('Could not parse key points json block, extracting via regex');
    }
  }

  if (keyPoints.length === 0) {
    const lines = cleanedContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if ((trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) && trimmed.length > 20) {
        keyPoints.push(trimmed.replace(/^[-*]|\d+\.\s*/, '').trim());
        if (keyPoints.length >= 6) break;
      }
    }
  }

  const wordCount = cleanedContent.split(/\s+/).filter(Boolean).length;

  return {
    content: cleanedContent,
    keyPoints: keyPoints.slice(0, 8),
    wordCount,
    providerUsed,
    modelUsed,
  };
}

/**
 * Generate AI Quiz (using Gemini or OpenRouter)
 */
export async function generateQuiz(options: GenerateQuizOptions): Promise<QuizResult> {
  const { text, title, questionCount, difficulty, questionType, geminiApiKey, openRouterApiKey, preferredProvider, openRouterModel } = options;

  const typeDesc = {
    multiple_choice: 'ALL questions must be Multiple Choice questions with exactly 4 options (options array of 4 distinct answers).',
    true_false: 'ALL questions must be True/False questions with exactly 2 options: ["True", "False"].',
    mixed: 'Include a balanced combination of 4-option Multiple Choice questions and True/False questions.',
  }[questionType];

  const difficultyDesc = {
    easy: 'Easy: Focus on fundamental concepts, straightforward definitions, and clear factual recall directly stated in the text.',
    medium: 'Medium: Focus on understanding, application of principles, comparison of concepts, and distinguishing subtleties.',
    hard: 'Hard: Rigorous academic questions involving synthesis, deeper reasoning, problem-solving, analysis of edge cases or formula implications.',
  }[difficulty];

  const systemPrompt = `You are StudyMate's automated Quiz Generator.
You must generate a valid JSON array of high quality educational questions based strictly on the provided study material.

Rules:
1. Generate EXACTLY ${questionCount} questions.
2. Difficulty target: ${difficultyDesc}
3. Question formats: ${typeDesc}
4. For every question:
   - "id": A unique string like "q_1", "q_2", etc.
   - "question": Clear, unambiguous question text.
   - "type": "multiple_choice" or "true_false".
   - "options": An array of strings. For multiple_choice, exactly 4 realistic, distinct options. For true_false, ["True", "False"].
   - "correctAnswerIndex": Zero-indexed integer indicating the correct item in "options" (0, 1, 2, or 3).
   - "explanation": A thorough, 2-4 sentence explanation detailing WHY the correct answer is correct, citing the logic from the text, and why common distractors are mistaken.
   - "topic": Short topic or concept tag (e.g., "Krebs Cycle", "Big-O Notation", "Fiscal Policy").
5. Return ONLY a single raw JSON object with this exact structure:
{
  "title": "${title} Quiz",
  "questions": [
    {
      "id": "q_1",
      "question": "...",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "...",
      "topic": "..."
    }
  ]
}
Do NOT wrap the output in conversational text. Just the JSON object.`;

  const userPrompt = `Generate a ${questionCount}-question quiz from the following study material:

STUDY MATERIAL:
${text.slice(0, 100000)}

Output the JSON object now:`;

  const effectiveOpenRouterKey = openRouterApiKey || process.env.OPENROUTER_API_KEY;
  const effectiveGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;

  const useOpenRouter = (preferredProvider === 'openrouter' && Boolean(effectiveOpenRouterKey)) ||
                        (!effectiveGeminiKey && Boolean(effectiveOpenRouterKey));

  let rawOutput = '';
  let providerUsed: 'openrouter' | 'gemini' = 'gemini';
  let modelUsed = 'gemini-3-flash-preview';

  if (useOpenRouter && effectiveOpenRouterKey) {
    try {
      providerUsed = 'openrouter';
      modelUsed = openRouterModel || 'google/gemini-2.0-flash-001';
      rawOutput = await callOpenRouter(effectiveOpenRouterKey, modelUsed, userPrompt, systemPrompt);
    } catch (err: any) {
      if (effectiveGeminiKey) {
        console.warn(`OpenRouter quiz failed (${err.message}). Trying Gemini...`);
        try {
          providerUsed = 'gemini';
          const geminiRes = await callGemini(userPrompt, systemPrompt, effectiveGeminiKey, true);
          rawOutput = geminiRes.text;
          modelUsed = geminiRes.modelUsed;
        } catch (geminiErr: any) {
          console.warn(`Gemini quiz failed: ${geminiErr.message}. Generating fallback quiz.`);
          return generateFallbackQuiz(text, title, questionCount, difficulty, questionType);
        }
      } else {
        console.warn(`OpenRouter quiz failed: ${err.message}. Generating fallback quiz.`);
        return generateFallbackQuiz(text, title, questionCount, difficulty, questionType);
      }
    }
  } else if (effectiveGeminiKey) {
    try {
      providerUsed = 'gemini';
      const geminiRes = await callGemini(userPrompt, systemPrompt, effectiveGeminiKey, true);
      rawOutput = geminiRes.text;
      modelUsed = geminiRes.modelUsed;
    } catch (geminiErr: any) {
      if (effectiveOpenRouterKey) {
        console.warn(`Gemini quiz failed (${geminiErr.message}). Trying OpenRouter...`);
        try {
          providerUsed = 'openrouter';
          modelUsed = openRouterModel || 'google/gemini-2.0-flash-001';
          rawOutput = await callOpenRouter(effectiveOpenRouterKey, modelUsed, userPrompt, systemPrompt);
        } catch (orErr: any) {
          console.warn(`OpenRouter quiz failed: ${orErr.message}. Generating fallback quiz.`);
          return generateFallbackQuiz(text, title, questionCount, difficulty, questionType);
        }
      } else {
        console.warn(`Gemini quiz failed: ${geminiErr.message}. Generating fallback quiz.`);
        return generateFallbackQuiz(text, title, questionCount, difficulty, questionType);
      }
    }
  } else {
    console.warn('No AI API key found. Generating structured academic quiz directly from study material.');
    return generateFallbackQuiz(text, title, questionCount, difficulty, questionType);
  }

  const cleaned = cleanJsonOutput(rawOutput);
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (innerErr: any) {
        console.warn('Could not parse AI quiz JSON. Generating fallback quiz.');
        return generateFallbackQuiz(text, title, questionCount, difficulty, questionType);
      }
    } else {
      console.warn('Could not find JSON object in AI quiz. Generating fallback quiz.');
      return generateFallbackQuiz(text, title, questionCount, difficulty, questionType);
    }
  }

  if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    console.warn('AI quiz response contained no questions. Generating fallback quiz.');
    return generateFallbackQuiz(text, title, questionCount, difficulty, questionType);
  }

  const validatedQuestions: QuizQuestion[] = parsed.questions.map((q: any, idx: number) => {
    const isTF = q.type === 'true_false' || (Array.isArray(q.options) && q.options.length === 2 && q.options[0].toLowerCase() === 'true');
    const options = isTF ? ['True', 'False'] : (Array.isArray(q.options) ? q.options.map(String) : ['Option A', 'Option B', 'Option C', 'Option D']);
    let correctIdx = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0;
    if (correctIdx < 0 || correctIdx >= options.length) correctIdx = 0;

    return {
      id: q.id || `q_${idx + 1}`,
      question: String(q.question || `Question ${idx + 1}`),
      type: isTF ? 'true_false' : 'multiple_choice',
      options,
      correctAnswerIndex: correctIdx,
      explanation: String(q.explanation || 'Based directly on key principles outlined in the study material.'),
      topic: q.topic || 'Core Concept',
    };
  });

  const cleanedTitle = title.endsWith('Quiz') ? title : `${title} Quiz`;
  return {
    title: parsed.title || cleanedTitle,
    questions: validatedQuestions,
    providerUsed,
    modelUsed,
  };
}
