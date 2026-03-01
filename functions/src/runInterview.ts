/**
 * Rycene VLSI Mentor AI — runInterview Cloud Function
 *
 * Callable HTTPS Cloud Function (2nd Gen). Dual-mode operation:
 *
 * Mode "generate":
 *   - Generates one VLSI interview question for the given topic.
 *   - Does NOT write to Firestore (read-only operation).
 *   - Returns: { question, topic }
 *
 * Mode "evaluate":
 *   - Evaluates the candidate's answer using a 3-dimension rubric.
 *   - Validates Gemini response with Zod before any Firestore write.
 *   - Stores submission in Firestore submissions collection.
 *   - Triggers recalculateSkills to update skill scores.
 *   - Returns: { submissionId, rubric, overallScore, updatedSkillScores, ... }
 *
 * Security: Requires authenticated Firebase user. userId always from JWT.
 * Metadata tags: every evaluation is stamped with evaluationVersion + model.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
    callGeminiForInterviewQuestion,
    callGeminiForInterviewEval,
    INTERVIEW_MODEL,
    INTERVIEW_EVAL_VERSION,
} from "./geminiClient";
import {
    RunInterviewRequestSchema,
    InterviewRubricSchema,
} from "./validators";
import { recalculateSkills } from "./recalculateSkills";
import {
    SkillDomain,
    GenerateQuestionResult,
    EvaluateAnswerResult,
    EvaluationMeta,
} from "./types";

const db = () => admin.firestore();

// ─── SCORE WEIGHTS ────────────────────────────────────────────────────────────

/**
 * Deterministic weighted average for interview overall score.
 * Correctness is weighted highest — a technically wrong answer should not
 * be rescued by being clearly communicated.
 */
const INTERVIEW_WEIGHTS = {
    technicalDepth: 0.35,
    clarity: 0.25,
    correctness: 0.40,
} as const;

function computeInterviewOverallScore(
    technicalDepth: number,
    clarity: number,
    correctness: number
): number {
    const raw =
        technicalDepth * INTERVIEW_WEIGHTS.technicalDepth +
        clarity * INTERVIEW_WEIGHTS.clarity +
        correctness * INTERVIEW_WEIGHTS.correctness;
    return Math.round(raw * 100) / 100;
}

// ─── CLOUD FUNCTION DEFINITION ────────────────────────────────────────────────

export const runInterview = onCall(
    {
        region: "us-central1",
        timeoutSeconds: 60,
        memory: "256MiB",
        minInstances: 1,
        enforceAppCheck: false,
    },
    async (request): Promise<GenerateQuestionResult | EvaluateAnswerResult> => {

        // ── 1. Authentication guard ───────────────────────────────────────────
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to use Interview Simulation."
            );
        }

        // userId always from verified JWT — never from request body
        const userId = request.auth.uid;

        // ── 2. Validate request with discriminated union schema ───────────────
        const parseResult = RunInterviewRequestSchema.safeParse(request.data);
        if (!parseResult.success) {
            const issues = parseResult.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ");
            throw new HttpsError("invalid-argument", `Invalid request: ${issues}`);
        }

        const validated = parseResult.data;
        const { mode, topic } = validated;

        // ── 3. Route to generate or evaluate ─────────────────────────────────
        if (mode === "generate") {
            return handleGenerate(userId, topic);
        } else {
            // TypeScript knows mode === "evaluate" here, so question + answer exist
            return handleEvaluate(userId, topic, validated.question, validated.answer);
        }
    }
);

// ─── MODE A: GENERATE QUESTION ────────────────────────────────────────────────

async function handleGenerate(
    userId: string,
    topic: SkillDomain
): Promise<GenerateQuestionResult> {
    console.info(`[runInterview:generate] User ${userId} requesting question for topic: ${topic}`);

    let question: string;
    try {
        question = await callGeminiForInterviewQuestion(topic);
    } catch (err) {
        console.error(`[runInterview:generate] Gemini question generation failed:`, err);
        throw new HttpsError(
            "internal",
            "Question generation is temporarily unavailable. Please try again."
        );
    }

    console.info(`[runInterview:generate] Generated question for ${userId} (${topic})`);

    // Mode "generate" → NO Firestore write. Question is stateless until submitted.
    return { question, topic };
}

// ─── MODE B: EVALUATE ANSWER ──────────────────────────────────────────────────

async function handleEvaluate(
    userId: string,
    topic: SkillDomain,
    question: string,
    answer: string
): Promise<EvaluateAnswerResult> {
    console.info(
        `[runInterview:evaluate] User ${userId}, topic: ${topic}, ` +
        `question length: ${question.length}, answer length: ${answer.length}`
    );

    // ── Step 1: Call Gemini for rubric evaluation ─────────────────────────────
    let rawGeminiResponse: unknown;
    try {
        rawGeminiResponse = await callGeminiForInterviewEval(topic, question, answer);
    } catch (err) {
        console.error(`[runInterview:evaluate] Gemini evaluation call failed:`, err);
        throw new HttpsError(
            "internal",
            "Answer evaluation is temporarily unavailable. Please try again."
        );
    }

    // ── Step 2: Validate with Zod — reject before any Firestore write ─────────
    const validationResult = InterviewRubricSchema.safeParse(rawGeminiResponse);
    if (!validationResult.success) {
        const issues = validationResult.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ");
        console.error(
            `[runInterview:evaluate] Gemini rubric failed Zod validation: ${issues}`,
            rawGeminiResponse
        );
        throw new HttpsError(
            "internal",
            "AI evaluation returned an unexpected format. Please retry."
        );
    }

    const rubric = validationResult.data;

    // ── Step 3: Compute overall score deterministically ───────────────────────
    const overallScore = computeInterviewOverallScore(
        rubric.technicalDepth,
        rubric.clarity,
        rubric.correctness
    );

    // ── Step 4: Build evaluation metadata tags ────────────────────────────────
    const meta: EvaluationMeta = {
        evaluationVersion: INTERVIEW_EVAL_VERSION,
        model: INTERVIEW_MODEL,
    };

    // ── Step 5: Store submission in Firestore ─────────────────────────────────
    let submissionId: string;
    try {
        const submissionRef = await db().collection("submissions").add({
            userId,
            type: "interview",
            topic,
            question,
            answer,
            rubric,
            overallScore,
            meta,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        submissionId = submissionRef.id;
    } catch (err) {
        console.error(`[runInterview:evaluate] Firestore submission write failed:`, err);
        throw new HttpsError(
            "internal",
            "Failed to store evaluation results. Please try again."
        );
    }

    // ── Step 6: Recalculate skill scores (Firestore transaction) ─────────────
    let skillUpdateResult;
    try {
        skillUpdateResult = await recalculateSkills({
            userId,
            domain: topic,
            newEvaluationScore: overallScore,
            submissionId,
        });
    } catch (err) {
        // Non-fatal: submission is already stored. Log loudly, return degraded response.
        console.error(
            `[runInterview:evaluate] Skill recalculation failed for ${userId}:`,
            err
        );
        return {
            submissionId,
            rubric,
            overallScore,
            updatedSkillScores: {
                rtl: 0, digital: 0, sta: 0,
                physical: 0, dft: 0, scripting: 0,
            },
            updatedReadinessScore: 0,
            updatedConfidenceScore: 0,
            meta,
        };
    }

    console.info(
        `[runInterview:evaluate] Completed. User: ${userId}, ` +
        `Topic: ${topic}, OverallScore: ${overallScore}, ` +
        `Readiness: ${skillUpdateResult.updatedReadinessScore}, ` +
        `Version: ${meta.evaluationVersion}, Model: ${meta.model}`
    );

    // ── Step 7: Return structured result ──────────────────────────────────────
    return {
        submissionId,
        rubric,
        overallScore,
        updatedSkillScores: skillUpdateResult.updatedSkillScores,
        updatedReadinessScore: skillUpdateResult.updatedReadinessScore,
        updatedConfidenceScore: skillUpdateResult.updatedConfidenceScore,
        meta,
    };
}
