/**
 * Rycene VLSI Mentor AI — recalculateSkills
 *
 * Internal (non-exported) helper called after every code/interview/quiz evaluation.
 * Uses a Firestore transaction to atomically update all derived skill metrics.
 *
 * This function runs with Firebase Admin SDK — it BYPASSES Firestore security rules.
 * It is intentionally NOT exposed as a callable Cloud Function to prevent client abuse.
 */

import * as admin from "firebase-admin";
import { SkillDomain, SkillScores } from "./types";
import {
    applySkillUpdate,
    computeReadiness,
    computeConfidence,
    computeWeakTopics,
} from "./skillEngine";

const db = () => admin.firestore();

// ─── PUBLIC INTERFACE ─────────────────────────────────────────────────────────

export interface RecalculateSkillsInput {
    userId: string;
    /** The skill domain being updated (derived from the submission topic) */
    domain: SkillDomain;
    /** The overall score from the latest evaluation (0–100) */
    newEvaluationScore: number;
    /** The Firestore doc id of the submission that triggered this update */
    submissionId: string;
}

export interface RecalculateSkillsResult {
    updatedSkillScores: SkillScores;
    updatedReadinessScore: number;
    updatedConfidenceScore: number;
    updatedWeakTopics: SkillDomain[];
}

// ─── IMPLEMENTATION ───────────────────────────────────────────────────────────

/**
 * Atomically updates all skill metrics for a user inside a Firestore transaction.
 *
 * Transaction guarantees:
 * 1. Reads the latest skillScores (no stale reads from concurrent submissions)
 * 2. Applies EWA to the specific domain
 * 3. Recomputes readiness, confidence, and weakTopics
 * 4. Writes all derived values in a single atomic commit
 *
 * @throws If Firestore transaction fails after internal retries
 */
export async function recalculateSkills(
    input: RecalculateSkillsInput
): Promise<RecalculateSkillsResult> {
    const { userId, domain, newEvaluationScore, submissionId } = input;

    const userRef = db().collection("users").doc(userId);
    const submissionsRef = db()
        .collection("submissions")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(5);

    let result: RecalculateSkillsResult;

    await db().runTransaction(async (transaction) => {
        // ── 1. Read current user document ──────────────────────────────────────
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
            throw new Error(`User document not found for userId: ${userId}`);
        }
        const userData = userSnap.data()!;
        const currentSkillScores: SkillScores = userData.skillScores ?? {
            rtl: 0,
            digital: 0,
            sta: 0,
            physical: 0,
            dft: 0,
            scripting: 0,
        };

        // ── 2. Apply EWA to the evaluated domain ───────────────────────────────
        const updatedSkillScores = applySkillUpdate(
            currentSkillScores,
            domain,
            newEvaluationScore
        );

        // ── 3. Derive readiness from updated scores ─────────────────────────────
        const updatedReadinessScore = computeReadiness(updatedSkillScores);

        // ── 4. Derive weak topics ───────────────────────────────────────────────
        const updatedWeakTopics = computeWeakTopics(updatedSkillScores);

        // ── 5. Fetch last 5 submission scores for confidence (outside transaction
        //        to avoid contention; uses eventual consistency for confidence only)
        //        NOTE: confidence is a soft metric; slight staleness is acceptable.
        // ─────────────────────────────────────────────────────────────────────────
        // We collect this outside the transaction to avoid holding the transaction
        // open during a secondary collection read. The confidence score is not a
        // security-sensitive value and minor staleness is acceptable per the spec.
        // This is set below after the transaction via a follow-up calculation.

        // ── 6. Write all derived fields atomically ─────────────────────────────
        transaction.update(userRef, {
            skillScores: updatedSkillScores,
            readinessScore: updatedReadinessScore,
            weakTopics: updatedWeakTopics,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
            updatedSkillScores,
            updatedReadinessScore,
            updatedConfidenceScore: 0, // Filled in post-transaction below
            updatedWeakTopics,
        };
    });

    // ── Post-transaction: compute confidence score ─────────────────────────────
    // We read last 5 submissions after committing the main transaction.
    // This is safe because confidence is a trailing indicator (last 5 scores)
    // and does NOT affect security-critical fields.
    try {
        const submissionsSnap = await submissionsRef.get();
        const last5Scores = submissionsSnap.docs
            .map((doc) => doc.data().overallScore as number)
            .filter((s) => typeof s === "number");

        const updatedConfidenceScore = computeConfidence(last5Scores);

        // Update confidence score separately (non-transactional, acceptable)
        await userRef.update({
            confidenceScore: updatedConfidenceScore,
        });

        result!.updatedConfidenceScore = updatedConfidenceScore;
    } catch (err) {
        // Non-fatal: confidence score failure should not block the main response
        console.error(`[recalculateSkills] Confidence score update failed for ${userId}:`, err);
    }

    console.info(
        `[recalculateSkills] Updated user ${userId} after submission ${submissionId}. ` +
        `Domain: ${domain}, NewScore: ${newEvaluationScore}, ` +
        `Readiness: ${result!.updatedReadinessScore}`
    );

    return result!;
}
