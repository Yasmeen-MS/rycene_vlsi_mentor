/**
 * Rycene VLSI Mentor AI — evaluateCode Cloud Function
 *
 * Callable HTTPS Cloud Function (2nd Gen).
 * Accepts Verilog code + topic, calls Gemini, validates JSON, stores
 * submission in Firestore, and triggers skill score recalculation.
 *
 * Security: Requires authenticated Firebase user (JWT verified by callable SDK).
 * The userId is extracted from auth.uid — NOT from the request body.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { callGeminiForEvaluation } from "./geminiClient";
import { RubricResponseSchema, EvaluateCodeRequestSchema } from "./validators";
import { computeOverallScore } from "./skillEngine";
import { recalculateSkills } from "./recalculateSkills";
import { EvaluateCodeResponse, SkillDomain } from "./types";

const db = () => admin.firestore();

// ─── CLOUD FUNCTION DEFINITION ────────────────────────────────────────────────

export const evaluateCode = onCall(
    {
        region: "us-central1",
        timeoutSeconds: 60,       // CF-level timeout (generous to allow 2 Gemini attempts)
        memory: "256MiB",
        minInstances: 1,          // Keep warm to avoid cold starts during demo
        enforceAppCheck: false,   // Set to true if App Check is configured
    },
    async (request): Promise<EvaluateCodeResponse> => {
        // ── 1. Authentication guard ───────────────────────────────────────────────
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to evaluate code."
            );
        }

        // userId is ALWAYS derived from the verified JWT — never from request body
        const userId = request.auth.uid;

        // ── 2. Validate request payload ──────────────────────────────────────────
        const parseResult = EvaluateCodeRequestSchema.safeParse(request.data);
        if (!parseResult.success) {
            const issues = parseResult.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ");
            throw new HttpsError("invalid-argument", `Invalid request: ${issues}`);
        }

        const { code, topic } = parseResult.data;

        console.info(
            `[evaluateCode] User ${userId} evaluating topic "${topic}" ` +
            `(code length: ${code.length} chars)`
        );

        // ── 3. Call Gemini API (with timeout + retry built into client) ───────────
        let rawGeminiResponse: unknown;
        try {
            rawGeminiResponse = await callGeminiForEvaluation(code, topic);
        } catch (err) {
            console.error(`[evaluateCode] Gemini call failed for user ${userId}:`, err);
            throw new HttpsError(
                "internal",
                "AI evaluation service is temporarily unavailable. Please try again."
            );
        }

        // ── 4. Validate and parse Gemini response with Zod ───────────────────────
        const validationResult = RubricResponseSchema.safeParse(rawGeminiResponse);
        if (!validationResult.success) {
            const issues = validationResult.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ");
            console.error(
                `[evaluateCode] Gemini response failed schema validation: ${issues}`,
                rawGeminiResponse
            );
            throw new HttpsError(
                "internal",
                "AI returned an unexpected response format. Please try again."
            );
        }

        const validated = validationResult.data;

        // ── 5. Compute overall score from rubric ─────────────────────────────────
        const rubricScore = {
            syntax: validated.syntax,
            logic: validated.logic,
            timing: validated.timing,
            bestPractices: validated.bestPractices,
            readability: validated.readability,
        };

        const overallScore = computeOverallScore(rubricScore);

        // ── 6. Store submission in Firestore ─────────────────────────────────────
        let submissionId: string;
        try {
            const submissionRef = await db().collection("submissions").add({
                userId,
                type: "code",
                topic: topic as SkillDomain,
                rubricScore,
                overallScore,
                feedback: validated.feedback,
                detectedWeakTopics: validated.detectedWeakTopics,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            submissionId = submissionRef.id;
        } catch (err) {
            console.error(`[evaluateCode] Firestore submission write failed:`, err);
            throw new HttpsError(
                "internal",
                "Failed to store evaluation results. Please try again."
            );
        }

        // ── 7. Recalculate skill scores (transactional) ───────────────────────────
        let skillUpdateResult;
        try {
            skillUpdateResult = await recalculateSkills({
                userId,
                domain: topic as SkillDomain,
                newEvaluationScore: overallScore,
                submissionId,
            });
        } catch (err) {
            // Critical: log loudly but don't crash the response — submission is already stored.
            // The client gets the evaluation result and can retry a recalculation if needed.
            console.error(
                `[evaluateCode] Skill recalculation failed for user ${userId}:`,
                err
            );
            // Return the evaluation result without updated scores (degraded response)
            return {
                submissionId,
                rubricScore,
                overallScore,
                feedback: validated.feedback,
                detectedWeakTopics: validated.detectedWeakTopics as SkillDomain[],
                updatedSkillScores: {
                    rtl: 0, digital: 0, sta: 0,
                    physical: 0, dft: 0, scripting: 0,
                },
                updatedReadinessScore: 0,
                updatedConfidenceScore: 0,
            };
        }

        // ── 8. Return structured result ───────────────────────────────────────────
        console.info(
            `[evaluateCode] Completed for user ${userId}. ` +
            `OverallScore: ${overallScore}, Readiness: ${skillUpdateResult.updatedReadinessScore}`
        );

        return {
            submissionId,
            rubricScore,
            overallScore,
            feedback: validated.feedback,
            detectedWeakTopics: validated.detectedWeakTopics as SkillDomain[],
            updatedSkillScores: skillUpdateResult.updatedSkillScores,
            updatedReadinessScore: skillUpdateResult.updatedReadinessScore,
            updatedConfidenceScore: skillUpdateResult.updatedConfidenceScore,
        };
    }
);
