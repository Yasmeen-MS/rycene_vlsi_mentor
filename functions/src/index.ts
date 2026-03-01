/**
 * Rycene VLSI Mentor AI — Cloud Functions Entry Point
 *
 * All exported functions are registered here.
 * Firebase Admin SDK is initialized once at module load time (singleton).
 *
 * Function inventory:
 *  - evaluateCode      : Rubric-based Verilog code evaluation via Gemini
 *  - initUserDocument  : Firestore trigger — initializes user doc on sign-up
 *
 * Future functions (NOT yet implemented — stubbed for reference):
 *  - runInterview
 *  - getTutorResponse
 *  - generateStudyPlan
 */

import * as admin from "firebase-admin";

// ─── Firebase Admin SDK — singleton init ─────────────────────────────────────
// Must be called before any other firebase-admin usage.
// Automatically picks up service account credentials in the Cloud Function runtime.
admin.initializeApp();

// ─── Function Exports ─────────────────────────────────────────────────────────

export { evaluateCode } from "./evaluateCode";
export { getTutorResponse } from "./getTutorResponse";
export { runInterview } from "./runInterview";
export { generateStudyPlan } from "./generateStudyPlan";
export { initUserDocument } from "./initUserDocument";
