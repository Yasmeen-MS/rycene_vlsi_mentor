/**
 * Rycene VLSI Mentor AI — generateStudyPlan Cloud Function
 *
 * Callable HTTPS Cloud Function (2nd Gen).
 *
 * Flow:
 *  1. Auth guard — userId from JWT
 *  2. Validate input (targetRole, interviewDate, hoursPerDay) with Zod
 *  3. Read user document from Firestore to get:
 *       - weakTopics (if empty → treat all 6 domains as weak)
 *       - readinessScore
 *       - skillScores
 *  4. Compute daysRemaining from interviewDate
 *  5. Call Gemini for a personalized 14-day roadmap (JSON mode)
 *  6. Validate response with Zod (exact 14 days, sequential)
 *  7. Persist to studyPlans/{userId} in Firestore (overwrites previous plan)
 *  8. Return roadmap + contextual metadata
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { callGeminiForStudyPlan } from "./geminiClient";
import {
    GenerateStudyPlanRequestSchema,
    StudyPlanResponseSchema,
} from "./validators";
import {
    SkillDomain,
    ALL_SKILL_DOMAINS,
    GenerateStudyPlanResult,
} from "./types";

const db = () => admin.firestore();

// ─── CLOUD FUNCTION DEFINITION ────────────────────────────────────────────────

export const generateStudyPlan = onCall(
    {
        region: "us-central1",
        timeoutSeconds: 90,      // Extended: Gemini needs more tokens for 14-day plan
        memory: "256MiB",
        minInstances: 1,
        enforceAppCheck: false,
    },
    async (request): Promise<GenerateStudyPlanResult> => {

        // ── 1. Authentication guard ───────────────────────────────────────────
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to generate a study plan."
            );
        }

        const userId = request.auth.uid;

        // ── 2. Validate request payload ──────────────────────────────────────
        const parseResult = GenerateStudyPlanRequestSchema.safeParse(request.data);
        if (!parseResult.success) {
            const issues = parseResult.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ");
            throw new HttpsError("invalid-argument", `Invalid request: ${issues}`);
        }

        const { targetRole, interviewDate, hoursPerDay } = parseResult.data;

        // ── 3. Read user Firestore document ───────────────────────────────────
        const userRef = db().collection("users").doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            throw new HttpsError(
                "not-found",
                "User profile not found. Please complete sign-up first."
            );
        }

        const userData = userSnap.data()!;
        const storedWeakTopics: SkillDomain[] = userData.weakTopics ?? [];
        const readinessScore: number = userData.readinessScore ?? 0;

        // ── 4. Resolve effective weak topics ─────────────────────────────────
        // Architecture spec: if weakTopics is empty (no evaluations yet),
        // treat ALL 6 domains as weak so the plan covers everything.
        const effectiveWeakTopics: SkillDomain[] =
            storedWeakTopics.length > 0
                ? storedWeakTopics
                : [...ALL_SKILL_DOMAINS];

        // ── 5. Compute daysRemaining ──────────────────────────────────────────
        const interviewDateObj = new Date(interviewDate);
        const now = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysRemaining = Math.max(
            1,
            Math.ceil((interviewDateObj.getTime() - now.getTime()) / msPerDay)
        );

        console.info(
            `[generateStudyPlan] User ${userId}: role="${targetRole}", ` +
            `interviewDate=${interviewDate}, daysRemaining=${daysRemaining}, ` +
            `hoursPerDay=${hoursPerDay}, weakTopics=[${effectiveWeakTopics.join(",")}], ` +
            `readiness=${readinessScore}`
        );

        // ── 6. Call Gemini (JSON mode, 8s timeout per attempt, 1 retry) ──────
        let rawGeminiResponse: unknown;
        try {
            rawGeminiResponse = await callGeminiForStudyPlan({
                weakTopics: effectiveWeakTopics,
                readinessScore,
                targetRole,
                interviewDate,
                hoursPerDay,
                daysRemaining,
            });
        } catch (err) {
            console.error(`[generateStudyPlan] Gemini call failed:`, err);
            throw new HttpsError(
                "internal",
                "Study plan generation is temporarily unavailable. Please try again."
            );
        }

        // ── 7. Validate Gemini response with Zod ─────────────────────────────
        // superRefine inside StudyPlanResponseSchema enforces:
        //   - Exactly 14 entries
        //   - Day numbers sequential 1–14 (catches Gemini reordering)
        const validationResult = StudyPlanResponseSchema.safeParse(rawGeminiResponse);
        if (!validationResult.success) {
            const issues = validationResult.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ");
            console.error(
                `[generateStudyPlan] Gemini roadmap failed Zod validation: ${issues}`,
                rawGeminiResponse
            );
            throw new HttpsError(
                "internal",
                "AI returned an invalid study plan format. Please retry."
            );
        }

        // Sort roadmap by day ascending (defensive — Zod validates days are 1-14
        // but doesn't enforce array order, Gemini could shuffle them)
        const roadmap = validationResult.data.roadmap
            .slice()
            .sort((a, b) => a.day - b.day);

        // ── 8. Persist to Firestore studyPlans/{userId} ───────────────────────
        // Always overwrites the previous plan — one active plan per user.
        try {
            await db()
                .collection("studyPlans")
                .doc(userId)
                .set({
                    userId,
                    targetRole,
                    interviewDate,
                    interviewDateTs: admin.firestore.Timestamp.fromDate(interviewDateObj),
                    hoursPerDay,
                    daysRemaining,
                    weakTopicsAtGeneration: effectiveWeakTopics,
                    readinessAtGeneration: readinessScore,
                    roadmap,
                    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
        } catch (err) {
            // Non-fatal: log loudly but return the roadmap anyway.
            // User gets their plan; persistence failure is a background concern.
            console.error(
                `[generateStudyPlan] Firestore write failed for user ${userId}:`,
                err
            );
        }

        console.info(
            `[generateStudyPlan] Completed for user ${userId}. ` +
            `${roadmap.length} days generated, weakTopics: [${effectiveWeakTopics.join(",")}]`
        );

        // ── 9. Return structured result ───────────────────────────────────────
        return {
            roadmap,
            daysRemaining,
            weakTopicsUsed: effectiveWeakTopics,
            readinessScore,
        };
    }
);
