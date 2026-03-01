/**
 * Rycene VLSI Mentor AI — User Document Initialization Trigger
 *
 * Fires automatically when a new user signs up via Firebase Auth.
 * Creates the users/{userId} document in Firestore with zeroed skill scores.
 *
 * This ensures:
 * 1. The user document always exists before any Cloud Function reads it.
 * 2. Skill scores start at 0 (not undefined), preventing null-guards throughout.
 * 3. The Dashboard can render immediately with zero-state data.
 */

import { auth } from "firebase-functions/v1";
import * as admin from "firebase-admin";

const db = () => admin.firestore();

// ─── TRIGGER: New Firebase Auth User Created ──────────────────────────────────

export const initUserDocument = auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;

    const initialUserDoc = {
        name: displayName ?? email?.split("@")[0] ?? "VLSI Learner",
        email: email ?? "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        skillScores: {
            rtl: 0,
            digital: 0,
            sta: 0,
            physical: 0,
            dft: 0,
            scripting: 0,
        },
        confidenceScore: 0,
        readinessScore: 0,
        weakTopics: [] as string[],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
        await db().collection("users").doc(uid).set(initialUserDoc);
        console.info(`[initUserDocument] Created user document for uid: ${uid}, email: ${email}`);
    } catch (err) {
        console.error(`[initUserDocument] Failed to create user document for uid: ${uid}`, err);
        // Not re-throwing — Auth creation should still succeed even if Firestore write fails.
        // The evaluateCode function handles the case where the user doc doesn't exist.
    }
});
