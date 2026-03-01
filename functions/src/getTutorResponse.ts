/**
 * Rycene VLSI Mentor AI — getTutorResponse Cloud Function
 *
 * Callable HTTPS Cloud Function (2nd Gen).
 * Accepts a VLSI concept question, calls Gemini in structured JSON mode,
 * validates the 6-field response, and persists the exchange to a
 * Firestore chatSessions document.
 *
 * Does NOT update skill scores — the tutor is a learning aid, not an evaluator.
 *
 * Security: Requires authenticated Firebase user (JWT verified by callable SDK).
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { callGeminiForTutor } from "./geminiClient";
import { TutorResponseSchema, GetTutorRequestSchema } from "./validators";
import { GetTutorResponseResult } from "./types";

const db = () => admin.firestore();

// ─── CLOUD FUNCTION DEFINITION ────────────────────────────────────────────────

export const getTutorResponse = onCall(
    {
        region: "us-central1",
        timeoutSeconds: 60,       // Generous CF timeout to allow 2 Gemini attempts
        memory: "256MiB",
        minInstances: 1,          // Keep warm — tutoring is latency-sensitive
        enforceAppCheck: false,
    },
    async (request): Promise<GetTutorResponseResult> => {

        // ── 1. Authentication guard ───────────────────────────────────────────
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to use the AI Tutor."
            );
        }

        // userId is ALWAYS from verified JWT — never from request body
        const userId = request.auth.uid;

        // ── 2. Validate request payload ──────────────────────────────────────
        const parseResult = GetTutorRequestSchema.safeParse(request.data);
        if (!parseResult.success) {
            const issues = parseResult.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ");
            throw new HttpsError("invalid-argument", `Invalid request: ${issues}`);
        }

        const { question, sessionId: incomingSessionId, history } = parseResult.data;

        console.info(
            `[getTutorResponse] User ${userId} asked: "${question.substring(0, 80)}..."`
        );

        // ── 3. Call Gemini (JSON mode, 8s timeout, 1 retry) ─────────────────
        let rawGeminiResponse: unknown;
        try {
            rawGeminiResponse = await callGeminiForTutor(question, history);
        } catch (err) {
            console.error(`[getTutorResponse] Gemini call failed for user ${userId}:`, err);
            throw new HttpsError(
                "internal",
                "AI tutor is temporarily unavailable. Please try again."
            );
        }

        // ── 4. Validate Gemini response with Zod ─────────────────────────────
        // If validation fails, we throw a controlled error WITHOUT writing to Firestore.
        // Malformed data never reaches the database.
        const validationResult = TutorResponseSchema.safeParse(rawGeminiResponse);
        if (!validationResult.success) {
            const issues = validationResult.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ");
            console.error(
                `[getTutorResponse] Gemini response failed schema validation: ${issues}`,
                rawGeminiResponse
            );
            throw new HttpsError(
                "internal",
                "AI returned an unexpected format. Please retry your question."
            );
        }

        const tutorResponse = validationResult.data;

        // ── 5. Persist to Firestore chatSessions ─────────────────────────────
        // Strategy:
        //   - If a sessionId is provided (client resuming), append to that session.
        //   - If not, check for the user's most recent session (within 24 hours).
        //   - Otherwise, create a fresh session.
        // This prevents thousands of orphaned one-message sessions.

        const now = admin.firestore.Timestamp.now();

        const userMessage = {
            role: "user" as const,
            content: question,
            timestamp: now,
        };

        const assistantMessage = {
            role: "assistant" as const,
            content: tutorResponse,
            timestamp: now,
        };

        let resolvedSessionId: string;

        try {
            if (incomingSessionId) {
                // ── Resume existing session ───────────────────────────────────
                const sessionRef = db()
                    .collection("chatSessions")
                    .doc(incomingSessionId);

                const sessionSnap = await sessionRef.get();
                if (!sessionSnap.exists || sessionSnap.data()?.userId !== userId) {
                    // Session doesn't exist or belongs to another user → start fresh
                    resolvedSessionId = await createNewSession(
                        userId,
                        userMessage,
                        assistantMessage,
                        now
                    );
                } else {
                    // Append both messages using arrayUnion
                    await sessionRef.update({
                        messages: admin.firestore.FieldValue.arrayUnion(
                            userMessage,
                            assistantMessage
                        ),
                        lastMessageAt: now,
                    });
                    resolvedSessionId = incomingSessionId;
                }
            } else {
                // ── Look for an active session from the last 24 hours ─────────
                const oneDayAgo = admin.firestore.Timestamp.fromMillis(
                    Date.now() - 24 * 60 * 60 * 1000
                );

                const recentSessionSnap = await db()
                    .collection("chatSessions")
                    .where("userId", "==", userId)
                    .where("lastMessageAt", ">=", oneDayAgo)
                    .orderBy("lastMessageAt", "desc")
                    .limit(1)
                    .get();

                if (!recentSessionSnap.empty) {
                    // Append to the most recent active session
                    const existingDoc = recentSessionSnap.docs[0];
                    await existingDoc.ref.update({
                        messages: admin.firestore.FieldValue.arrayUnion(
                            userMessage,
                            assistantMessage
                        ),
                        lastMessageAt: now,
                    });
                    resolvedSessionId = existingDoc.id;
                } else {
                    // Create a brand-new session
                    resolvedSessionId = await createNewSession(
                        userId,
                        userMessage,
                        assistantMessage,
                        now
                    );
                }
            }
        } catch (err) {
            // Log Firestore failure but still return the AI response to the user.
            // Persistence failure is non-fatal — the tutor answer is valuable even if
            // the session document wasn't saved.
            console.error(
                `[getTutorResponse] Firestore session write failed for user ${userId}:`,
                err
            );
            // Use a synthetic session ID to signal the client that persistence failed
            resolvedSessionId = `ephemeral_${Date.now()}`;
        }

        console.info(
            `[getTutorResponse] Completed for user ${userId}, session: ${resolvedSessionId}`
        );

        // ── 6. Return structured result ───────────────────────────────────────
        return {
            sessionId: resolvedSessionId,
            response: tutorResponse,
        };
    }
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Creates a brand-new chatSession document with the first exchange pre-populated.
 * Returns the Firestore-generated document ID.
 */
async function createNewSession(
    userId: string,
    userMessage: object,
    assistantMessage: object,
    now: admin.firestore.Timestamp
): Promise<string> {
    const newSessionRef = await db().collection("chatSessions").add({
        userId,
        messages: [userMessage, assistantMessage],
        createdAt: now,
        lastMessageAt: now,
    });
    return newSessionRef.id;
}
