/**
 * Rycene VLSI Mentor AI — Shared TypeScript Types
 * Single source of truth for all data shapes across Cloud Functions.
 */

// ─── SKILL DOMAINS ────────────────────────────────────────────────────────────

export type SkillDomain =
    | "rtl"
    | "digital"
    | "sta"
    | "physical"
    | "dft"
    | "scripting";

export const ALL_SKILL_DOMAINS: SkillDomain[] = [
    "rtl",
    "digital",
    "sta",
    "physical",
    "dft",
    "scripting",
];

// ─── FIRESTORE DOCUMENT SHAPES ────────────────────────────────────────────────

export interface SkillScores {
    rtl: number;
    digital: number;
    sta: number;
    physical: number;
    dft: number;
    scripting: number;
}

export interface UserDocument {
    name: string;
    email: string;
    createdAt: FirebaseFirestore.Timestamp;
    skillScores: SkillScores;
    confidenceScore: number;
    readinessScore: number;
    weakTopics: SkillDomain[];
    lastUpdated: FirebaseFirestore.Timestamp;
}

export interface RubricScore {
    syntax: number;       // 0–100
    logic: number;        // 0–100
    timing: number;       // 0–100
    bestPractices: number; // 0–100
    readability: number;  // 0–100
}

export interface SubmissionDocument {
    userId: string;
    type: "code" | "interview" | "quiz";
    topic: SkillDomain;
    rubricScore: RubricScore;
    overallScore: number;
    feedback: string;
    detectedWeakTopics: SkillDomain[];
    createdAt: FirebaseFirestore.Timestamp;
}

// ─── CLOUD FUNCTION PAYLOADS ──────────────────────────────────────────────────

export interface EvaluateCodeRequest {
    userId: string;
    code: string;
    topic: SkillDomain;
}

export interface EvaluateCodeResponse {
    submissionId: string;
    rubricScore: RubricScore;
    overallScore: number;
    feedback: string;
    detectedWeakTopics: SkillDomain[];
    updatedSkillScores: SkillScores;
    updatedReadinessScore: number;
    updatedConfidenceScore: number;
}

// ─── GEMINI RAW RESPONSE ──────────────────────────────────────────────────────

export interface GeminiRubricResponse {
    syntax: number;
    logic: number;
    timing: number;
    bestPractices: number;
    readability: number;
    feedback: string;
    detectedWeakTopics: string[];
}

// ─── TUTOR / CHAT SESSION TYPES ───────────────────────────────────────────────

/** Structured concept response returned by the AI Concept Tutor */
export interface TutorResponse {
    concept: string;          // Core explanation of the VLSI concept
    analogy: string;          // Real-world analogy to aid understanding
    industryContext: string;  // How this concept is used in industry workflows
    example: string;          // Concrete Verilog/SystemVerilog example or scenario
    miniQuiz: string;         // A single quiz question to test understanding
    hint: string;             // Hint for the mini quiz
}

/** A single message stored inside a chat session */
export interface ChatMessage {
    role: "user" | "assistant";
    content: string | TutorResponse;  // user sends string; assistant sends structured JSON
    timestamp: FirebaseFirestore.Timestamp;
}

/** Firestore chatSessions/{sessionId} document */
export interface ChatSessionDocument {
    userId: string;
    messages: ChatMessage[];
    createdAt: FirebaseFirestore.Timestamp;
    lastMessageAt: FirebaseFirestore.Timestamp;
}

/** Payload returned to the client by getTutorResponse */
export interface GetTutorResponseResult {
    sessionId: string;
    response: TutorResponse;
}

// ─── INTERVIEW TYPES ──────────────────────────────────────────────────────────

/**
 * Rubric returned by Gemini when evaluating an interview answer.
 * Three numeric dimensions (each 0–100) plus qualitative fields.
 */
export interface InterviewRubric {
    technicalDepth: number;      // 0–100: depth and accuracy of technical content
    clarity: number;             // 0–100: how clearly the answer is communicated
    correctness: number;         // 0–100: factual/conceptual correctness
    improvementAreas: string[];  // Specific areas the learner should improve
    feedback: string;            // Holistic actionable feedback
}

/** Metadata tags stamped on every interview evaluation */
export interface EvaluationMeta {
    evaluationVersion: string;   // e.g. "1.0.0"
    model: string;               // e.g. "gemini-1.5-flash-latest"
}

/** Firestore submissions/{id} shape for an interview submission */
export interface InterviewSubmissionDocument {
    userId: string;
    type: "interview";
    topic: SkillDomain;
    question: string;
    answer: string;
    rubric: InterviewRubric;
    overallScore: number;
    meta: EvaluationMeta;
    createdAt: FirebaseFirestore.Timestamp;
}

/** Returned by runInterview when mode = "generate" */
export interface GenerateQuestionResult {
    question: string;
    topic: SkillDomain;
}

/** Returned by runInterview when mode = "evaluate" */
export interface EvaluateAnswerResult {
    submissionId: string;
    rubric: InterviewRubric;
    overallScore: number;
    updatedSkillScores: SkillScores;
    updatedReadinessScore: number;
    updatedConfidenceScore: number;
    meta: EvaluationMeta;
}

// ─── STUDY PLAN TYPES ───────────────────────────────────────────────────────────────

/**
 * A single day entry in the 14-day study roadmap generated by Gemini.
 * Exactly matches the JSON schema demanded from Gemini.
 */
export interface RoadmapDay {
    day: number;       // 1–14
    focus: string;     // Primary topic/concept for this day
    tasks: string[];   // 2–4 specific learning tasks
    revision: boolean; // true = revision day, false = new material day
}

/** Firestore studyPlans/{userId} document */
export interface StudyPlanDocument {
    userId: string;
    targetRole: string;
    interviewDate: string;   // ISO 8601 string stored for readability
    interviewDateTs: FirebaseFirestore.Timestamp;
    hoursPerDay: number;
    daysRemaining: number;   // computed at generation time
    weakTopicsAtGeneration: SkillDomain[];  // snapshot of weakTopics used
    readinessAtGeneration: number;          // snapshot of readinessScore used
    roadmap: RoadmapDay[];
    generatedAt: FirebaseFirestore.Timestamp;
}

/** Callable request payload for generateStudyPlan */
export interface GenerateStudyPlanRequest {
    targetRole: string;
    interviewDate: string;  // ISO 8601 date string from frontend date picker
    hoursPerDay: number;
}

/** Cloud Function return type */
export interface GenerateStudyPlanResult {
    roadmap: RoadmapDay[];
    daysRemaining: number;
    weakTopicsUsed: SkillDomain[];
    readinessScore: number;
}
