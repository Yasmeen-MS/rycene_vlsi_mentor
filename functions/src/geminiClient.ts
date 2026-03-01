/**
 * Rycene VLSI Mentor AI — Gemini API Client
 *
 * Provides a hardened, singleton Gemini client with:
 * - JSON-only response enforcement
 * - Configurable timeout
 * - Single retry on transient failure
 * - Input/output type safety
 */

import {
    GoogleGenerativeAI,
    GenerativeModel,
    GenerationConfig,
} from "@google/generative-ai";

// ─── CLIENT INITIALIZATION ────────────────────────────────────────────────────

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
    if (_client) return _client;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY is not set in Cloud Function environment. " +
            "Set via: firebase functions:config:set gemini.api_key=YOUR_KEY"
        );
    }
    _client = new GoogleGenerativeAI(apiKey);
    return _client;
}

// ─── DEFAULT GENERATION CONFIG ────────────────────────────────────────────────

const EVAL_GENERATION_CONFIG: GenerationConfig = {
    temperature: 0.2,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,     // increased — prevents truncated JSON mid-output
    responseMimeType: "application/json",
};

const SYSTEM_INSTRUCTION_EVAL = `You are a strict VLSI code evaluation engine.
You MUST respond ONLY with a valid JSON object — no markdown fences, no explanatory text, no prefix, no suffix.
The JSON object must have EXACTLY these fields:
{
  "syntax": <number 0-100>,
  "logic": <number 0-100>,
  "timing": <number 0-100>,
  "bestPractices": <number 0-100>,
  "readability": <number 0-100>,
  "feedback": "<string, at least 50 characters>",
  "detectedWeakTopics": ["<one of: rtl, digital, sta, physical, dft, scripting>"]
}
Any deviation from this schema is a critical error.`;

// ─── TIMEOUT WRAPPER ──────────────────────────────────────────────────────────

/**
 * Wraps a promise with a timeout. Rejects if the promise does not resolve
 * within the given number of milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        promise
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

// ─── RETRY WRAPPER ────────────────────────────────────────────────────────────

/**
 * Executes an async function with a single retry on failure.
 * Waits 1 second between first attempt and retry.
 * Only retries on transient errors (not validation errors).
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 2,
    delayMs = 1000
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxAttempts) {
                console.warn(`[Gemini] Attempt ${attempt} failed. Retrying in ${delayMs}ms...`, err);
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
    throw lastError;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Send a Verilog code snippet to Gemini for rubric evaluation.
 * Enforces JSON-only mode, 8-second timeout, and one retry on failure.
 *
 * @param code  - Verilog source code string
 * @param topic - Skill domain (e.g. "rtl", "sta")
 * @returns Raw parsed JSON object from Gemini (must be validated by caller)
 */
export async function callGeminiForEvaluation(
    code: string,
    topic: string
): Promise<unknown> {
    const client = getClient();

    const model: GenerativeModel = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION_EVAL,
        generationConfig: EVAL_GENERATION_CONFIG,
    });

    const prompt = buildEvaluationPrompt(code, topic);

    const invoke = () =>
        withTimeout(
            model.generateContent(prompt).then((result) => {
                let text = result.response.text().trim();
                // Strip markdown fences if present (safety net)
                text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
                try {
                    return JSON.parse(text) as unknown;
                } catch {
                    throw new Error(
                        `Gemini returned non-JSON content. Raw output: ${text.substring(0, 300)}`
                    );
                }
            }),
            25000  // 25-second timeout — gemini-2.5-flash (thinking) takes 10-20s
        );

    return withRetry(invoke, 2, 1000);
}

// ─── TUTOR: GENERATION CONFIG + SYSTEM INSTRUCTION ────────────────────────────

const TUTOR_GENERATION_CONFIG: GenerationConfig = {
    temperature: 0.2,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
};

const SYSTEM_INSTRUCTION_TUTOR = `You are an expert VLSI and semiconductor engineering tutor.
You MUST respond ONLY with a valid JSON object — no markdown fences, no explanatory text, no prefix, no suffix.
The JSON object must have EXACTLY these six fields:
{
  "concept": "<clear, precise explanation of the VLSI concept, minimum 50 characters>",
  "analogy": "<a real-world analogy that makes the concept intuitive, minimum 30 characters>",
  "industryContext": "<how this concept is applied in real semiconductor design workflows, minimum 50 characters>",
  "example": "<a concrete Verilog/SystemVerilog snippet or specific scenario, minimum 30 characters>",
  "miniQuiz": "<a single focused quiz question to test understanding, minimum 20 characters>",
  "hint": "<a helpful hint for solving the mini quiz, minimum 15 characters>"
}
Any deviation from this schema — extra fields, missing fields, null values, empty strings — is a critical error.
Do NOT include markdown code fences inside any field value.`;

/**
 * Send a VLSI concept question to Gemini for structured tutor response.
 * Returns the 6-field concept explanation object.
 * Enforces JSON-only mode, 8-second timeout, and one retry on failure.
 *
 * @param question - The learner's VLSI concept question
 * @returns Raw parsed JSON object from Gemini (must be validated by caller)
 */
export async function callGeminiForTutor(
    question: string,
    history?: { role: "user" | "assistant"; content?: any }[]
): Promise<unknown> {
    const client = getClient();

    const model: GenerativeModel = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION_TUTOR,
        generationConfig: TUTOR_GENERATION_CONFIG,
    });

    const prompt = buildTutorPrompt(question, history);

    const invoke = () =>
        withTimeout(
            model.generateContent(prompt).then((result) => {
                const text = result.response.text().trim();
                try {
                    return JSON.parse(text) as unknown;
                } catch {
                    throw new Error(
                        `Gemini tutor returned non-JSON content. Raw output: ${text.substring(0, 300)}`
                    );
                }
            }),
            8000
        );

    return withRetry(invoke, 2, 1000);
}

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildEvaluationPrompt(code: string, topic: string): string {
    return `Evaluate the following Verilog/SystemVerilog code for the topic: "${topic}".

Analyze based on these rubric criteria:
- syntax (0-100): Correct Verilog/SystemVerilog syntax, proper module declaration, signal declarations
- logic (0-100): Correct behavioral and structural logic, proper state machines if applicable
- timing (0-100): Proper use of clocking, non-blocking assignments, setup/hold awareness
- bestPractices (0-100): Reset styles, naming conventions, modularity, avoiding latches
- readability (0-100): Comments, meaningful names, code organization

In "feedback", provide specific, actionable improvement suggestions (minimum 50 characters).
In "detectedWeakTopics", list ONLY the relevant domain slugs from [rtl, digital, sta, physical, dft, scripting] where weaknesses were found.

CODE TO EVALUATE:
\`\`\`verilog
${code}
\`\`\`

Respond with ONLY the JSON object. No text before or after.`;
}

function buildTutorPrompt(question: string, history?: { role: "user" | "assistant"; content?: any }[]): string {
    let context = "";
    if (history && history.length > 0) {
        context = "Previous Conversation Context:\n" + history.map(h =>
            `${h.role === 'user' ? 'Student' : 'Tutor'}: ${typeof h.content === 'string' ? h.content : JSON.stringify(h.content)}`
        ).join("\n\n") + "\n\n";
    }

    return `${context}A VLSI engineering student asks:
"${question}"

Provide a comprehensive, structured explanation in the required JSON format.
For the "example" field, include actual Verilog/SystemVerilog syntax or a specific named industry tool/flow where relevant.
For the "miniQuiz" field, write a single, directly answerable question related to the concept above.
Respond with ONLY the JSON object. No text before or after.`;
}

// ─── INTERVIEW: CONFIGS + SYSTEM INSTRUCTIONS ───────────────────────────────────

/** Model name stamped on every interview evaluation for traceability */
export const INTERVIEW_MODEL = "gemini-2.5-flash";
/** Evaluation schema version — bump when rubric fields change */
export const INTERVIEW_EVAL_VERSION = "1.0.0";

// Question generation: plain text, low temperature for focused output
const INTERVIEW_QUESTION_CONFIG: GenerationConfig = {
    temperature: 0.3,     // slightly higher than eval — variety in questions
    topP: 0.85,
    topK: 40,
    maxOutputTokens: 256, // one focused question only
};

const SYSTEM_INSTRUCTION_INTERVIEW_GENERATE = `You are a senior VLSI design interviewer at a leading semiconductor company.
Generate EXACTLY ONE concise, technical interview question for the given VLSI domain.
The question must:
- Be answerable in 3–5 sentences by a mid-level engineer
- Be specific (not generic like "Explain RTL")
- Start directly with the question, no preamble
- End with a question mark
- Contain NO markdown, NO numbering, NO prefix text`;

// Answer evaluation: strict JSON rubric mode
const INTERVIEW_EVAL_CONFIG: GenerationConfig = {
    temperature: 0.2,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
    responseMimeType: "application/json",
};

const SYSTEM_INSTRUCTION_INTERVIEW_EVAL = `You are a strict VLSI interview evaluation engine.
You MUST respond ONLY with a valid JSON object — no markdown, no preamble, no suffix.
The JSON object must have EXACTLY these fields:
{
  "technicalDepth": <number 0-100>,
  "clarity": <number 0-100>,
  "correctness": <number 0-100>,
  "improvementAreas": ["<specific improvement point>",...],
  "feedback": "<actionable holistic feedback, minimum 30 characters>"
}
Rules:
- technicalDepth: score how deep and rigorous the technical content is
- clarity: score how clearly and concisely the answer is communicated
- correctness: score factual and conceptual accuracy against VLSI standards
- improvementAreas: list 2–4 specific areas the candidate should study or improve
- feedback: provide direct, constructive coaching feedback
Any missing field, null value, or extra field is a critical error.`;

// ─── PUBLIC INTERVIEW API ─────────────────────────────────────────────────────

/**
 * Generate one VLSI interview question for the given domain topic.
 * Returns a plain text string (not JSON — no schema overhead needed for a single question).
 * 8-second timeout, 1 retry.
 *
 * @param topic - Skill domain slug (e.g. "rtl", "sta")
 * @returns Interview question as a plain string
 */
export async function callGeminiForInterviewQuestion(topic: string): Promise<string> {
    const client = getClient();

    const model: GenerativeModel = client.getGenerativeModel({
        model: INTERVIEW_MODEL,
        systemInstruction: SYSTEM_INSTRUCTION_INTERVIEW_GENERATE,
        generationConfig: INTERVIEW_QUESTION_CONFIG,
    });

    const prompt = `Generate one technical interview question for the VLSI domain: "${topic}".
The question must be specific to ${topic} concepts and relevant to real chip design workflows.`;

    const invoke = () =>
        withTimeout(
            model.generateContent(prompt).then((result) => {
                const text = result.response.text().trim();
                if (!text || text.length < 10) {
                    throw new Error(`Gemini returned an empty/too-short question for topic: ${topic}`);
                }
                return text;
            }),
            8000
        );

    return withRetry(invoke, 2, 1000);
}

/**
 * Evaluate a candidate's interview answer against a rubric using Gemini.
 * Enforces JSON-only mode, 8-second timeout, and one retry.
 *
 * @param topic    - Skill domain slug
 * @param question - The interview question that was asked
 * @param answer   - The candidate's answer
 * @returns Raw parsed JSON object (must be validated by caller with Zod)
 */
export async function callGeminiForInterviewEval(
    topic: string,
    question: string,
    answer: string
): Promise<unknown> {
    const client = getClient();

    const model: GenerativeModel = client.getGenerativeModel({
        model: INTERVIEW_MODEL,
        systemInstruction: SYSTEM_INSTRUCTION_INTERVIEW_EVAL,
        generationConfig: INTERVIEW_EVAL_CONFIG,
    });

    const prompt = `Evaluate the following VLSI interview answer.

Topic / Domain: ${topic}
Question asked: ${question}
Candidate's answer: ${answer}

Score the answer strictly using the rubric. Be specific in improvementAreas.
Respond with ONLY the JSON object. No text before or after.`;

    const invoke = () =>
        withTimeout(
            model.generateContent(prompt).then((result) => {
                const text = result.response.text().trim();
                try {
                    return JSON.parse(text) as unknown;
                } catch {
                    throw new Error(
                        `Gemini interview eval returned non-JSON. Raw: ${text.substring(0, 300)}`
                    );
                }
            }),
            8000
        );

    return withRetry(invoke, 2, 1000);
}

// ─── STUDY PLAN: CONFIG + SYSTEM INSTRUCTION ────────────────────────────────────────────

const STUDY_PLAN_CONFIG: GenerationConfig = {
    temperature: 0.4,          // Slightly higher: allow variety in plan structure
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 8192,     // 14 days of structured content — generous token budget
    responseMimeType: "application/json",
};

const SYSTEM_INSTRUCTION_STUDY_PLAN = `You are a VLSI engineering curriculum designer.
You MUST respond ONLY with a valid JSON object — no markdown fences, no explanatory text, no prefix.
The JSON object must have EXACTLY this structure:
{
  "roadmap": [
    {
      "day": <integer 1-14>,
      "focus": "<specific VLSI topic or concept for this day, min 5 characters>",
      "tasks": ["<task 1>", "<task 2>", ...],
      "revision": <true | false>
    },
    ... (exactly 14 entries, day 1 through day 14 in order)
  ]
}
Rules:
- roadmap array must have EXACTLY 14 objects, days numbered 1–14 in order
- Each day must have 2–4 tasks (specific, actionable learning activities)
- revision = true means the day focuses on reviewing previously covered material
- Tasks must be concrete (e.g. "Study setup/hold violations using STA reports" not "Learn STA")
- Distribute weak topics proportionally based on their weakness severity
- Reserve day 13 and day 14 for full-domain revision and mock interview practice
- Do NOT repeat the same task verbatim across multiple days
- Any deviation in schema, day count, or field types is a critical error`;

// Parameter object for study plan generation
export interface StudyPlanParams {
    weakTopics: string[];      // Domain slugs to focus on
    readinessScore: number;    // Current readiness (0–100)
    targetRole: string;        // e.g. "RTL Design Engineer"
    interviewDate: string;     // ISO date string
    hoursPerDay: number;       // Available study hours
    daysRemaining: number;     // Computed by the Cloud Function
}

/**
 * Call Gemini to generate a personalized 14-day VLSI study roadmap.
 * Enforces JSON-only mode, 8-second timeout per attempt, and one retry.
 *
 * @param params - User context: weakTopics, readiness, role, interview date, etc.
 * @returns Raw parsed JSON object (must be validated by caller with Zod)
 */
export async function callGeminiForStudyPlan(
    params: StudyPlanParams
): Promise<unknown> {
    const client = getClient();

    const model: GenerativeModel = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION_STUDY_PLAN,
        generationConfig: STUDY_PLAN_CONFIG,
    });

    const prompt = buildStudyPlanPrompt(params);

    const invoke = () =>
        withTimeout(
            model.generateContent(prompt).then((result) => {
                const text = result.response.text().trim();
                try {
                    return JSON.parse(text) as unknown;
                } catch {
                    throw new Error(
                        `Gemini study plan returned non-JSON. Raw: ${text.substring(0, 300)}`
                    );
                }
            }),
            55000  // 55-second timeout — 14-day JSON needs much more generation time
        );

    // Single attempt only — retrying a timed-out large generation wastes the 90s CF budget
    return withRetry(invoke, 1, 0);
}

function buildStudyPlanPrompt(params: StudyPlanParams): string {
    const {
        weakTopics,
        readinessScore,
        targetRole,
        interviewDate,
        hoursPerDay,
        daysRemaining,
    } = params;

    const topicsList =
        weakTopics.length > 0
            ? weakTopics.join(", ")
            : "rtl, digital, sta, physical, dft, scripting (all domains — no prior evaluations yet)";

    return `Generate a personalized 14-day VLSI study roadmap.

Learner Profile:
- Target role: ${targetRole}
- Interview date: ${interviewDate}
- Days remaining until interview: ${daysRemaining}
- Available study hours per day: ${hoursPerDay} hours
- Current industry readiness score: ${readinessScore.toFixed(1)} / 100
- Weak VLSI domains that need focus: ${topicsList}

Roadmap Requirements:
- Generate EXACTLY 14 days, numbered 1 through 14, in order
- Prioritize the weak domains listed above with deeper coverage
- Progress from foundational concepts to advanced application
- Allocate roughly ${hoursPerDay} hours of learning tasks per day
- Day 13: comprehensive revision of all covered topics
- Day 14: mock interview practice (RTL coding, STA analysis, DFT questions)
- Interleave revision days (revision = true) approximately every 3–4 new-material days

Respond with ONLY the JSON object. No text before or after.`;
}
