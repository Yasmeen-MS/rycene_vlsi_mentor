/**
 * functions.ts — Typed callable wrappers for all 4 Cloud Functions.
 *
 * Every wrapper returns { data, error } — callers never need to try/catch.
 * Errors are normalised to plain strings, never raw Firebase error objects.
 */

import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions } from "@/lib/firebase";

// ─── Shared helper ────────────────────────────────────────────────────────────

async function callFn<TReq, TRes>(
    name: string,
    payload: TReq,
): Promise<{ data: TRes | null; error: string | null }> {
    try {
        const fn = httpsCallable<TReq, TRes>(functions, name);
        const result: HttpsCallableResult<TRes> = await fn(payload);
        return { data: result.data, error: null };
    } catch (err: unknown) {
        const msg =
            err instanceof Error
                ? err.message.replace("FirebaseError: ", "")
                : "Unexpected error calling Cloud Function.";
        return { data: null, error: msg };
    }
}

// ─── evaluateCode ─────────────────────────────────────────────────────────────

export interface EvaluateCodeRequest {
    code: string;
    topic: string;
}
export interface RubricScore {
    syntax: number;
    logic: number;
    timing: number;
    bestPractices: number;
    readability: number;
}
export interface EvaluateCodeResult {
    submissionId: string;
    rubricScore: RubricScore;
    overallScore: number;
    feedback: string;
    detectedWeakTopics: string[];
    updatedSkillScores: Record<string, number>;
    updatedReadinessScore: number;
    updatedConfidenceScore: number;
}

export const callEvaluateCode = (p: EvaluateCodeRequest) =>
    callFn<EvaluateCodeRequest, EvaluateCodeResult>("evaluateCode", p);

// ─── getTutorResponse ─────────────────────────────────────────────────────────

export interface GetTutorRequest {
    question: string;
    sessionId?: string;
    history?: { role: "user" | "assistant", content: any }[];
}
export interface TutorResponse {
    concept: string;
    analogy: string;
    industryContext: string;
    example: string;
    miniQuiz: string;
    hint: string;
}
export interface GetTutorResult {
    sessionId: string;
    response: TutorResponse;
}

export const callGetTutorResponse = (p: GetTutorRequest) =>
    callFn<GetTutorRequest, GetTutorResult>("getTutorResponse", p);

// ─── runInterview ─────────────────────────────────────────────────────────────

export interface RunInterviewGenerateRequest {
    mode: "generate";
    topic: string;
}
export interface RunInterviewEvaluateRequest {
    mode: "evaluate";
    topic: string;
    question: string;
    answer: string;
}
export type RunInterviewRequest =
    | RunInterviewGenerateRequest
    | RunInterviewEvaluateRequest;

export interface GenerateQuestionResult {
    question: string;
    topic: string;
}
export interface EvaluateAnswerResult {
    submissionId: string;
    rubric: Record<string, unknown>;
    overallScore: number;
    updatedSkillScores: Record<string, number>;
    updatedReadinessScore: number;
    updatedConfidenceScore: number;
    meta: { evaluationVersion: string; model: string };
}

export const callRunInterview = (p: RunInterviewRequest) =>
    callFn<RunInterviewRequest, GenerateQuestionResult | EvaluateAnswerResult>(
        "runInterview",
        p,
    );

// ─── generateStudyPlan ────────────────────────────────────────────────────────

export interface GenerateStudyPlanRequest {
    targetRole: string;
    interviewDate: string;
    hoursPerDay: number;
}
export interface RoadmapDay {
    day: number;
    focus: string;
    tasks: string[];
    revision: boolean;
}
export interface GenerateStudyPlanResult {
    roadmap: RoadmapDay[];
    daysRemaining: number;
    weakTopicsUsed: string[];
    readinessScore: number;
}

export const callGenerateStudyPlan = (p: GenerateStudyPlanRequest) =>
    callFn<GenerateStudyPlanRequest, GenerateStudyPlanResult>(
        "generateStudyPlan",
        p,
    );
