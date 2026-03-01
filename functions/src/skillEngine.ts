/**
 * Rycene VLSI Mentor AI — Deterministic Skill Calculation Engine
 *
 * All functions in this module are pure and have zero side effects.
 * They have NO dependency on Gemini, Firestore, or any external service.
 * Fully deterministic and unit-testable.
 */

import { RubricScore, SkillScores, SkillDomain, ALL_SKILL_DOMAINS } from "./types";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/** EWA decay weight on historical score */
const HISTORY_WEIGHT = 0.7;
/** EWA weight on new evaluation score */
const NEW_SCORE_WEIGHT = 0.3;

/** Rubric field weights for overall score computation */
const RUBRIC_WEIGHTS: Record<keyof RubricScore, number> = {
    syntax: 0.25,
    logic: 0.30,
    timing: 0.20,
    bestPractices: 0.15,
    readability: 0.10,
};

/** Skill score threshold below which a topic is classified as "weak" */
const WEAK_TOPIC_THRESHOLD = 60;

// ─── PURE UTILITY FUNCTIONS ───────────────────────────────────────────────────

/**
 * Compute a single weighted overall score from the five rubric dimensions.
 * Result is rounded to two decimal places.
 *
 * @param rubric - Individual dimension scores (each 0–100)
 * @returns Weighted average overall score (0–100)
 */
export function computeOverallScore(rubric: RubricScore): number {
    const raw =
        rubric.syntax * RUBRIC_WEIGHTS.syntax +
        rubric.logic * RUBRIC_WEIGHTS.logic +
        rubric.timing * RUBRIC_WEIGHTS.timing +
        rubric.bestPractices * RUBRIC_WEIGHTS.bestPractices +
        rubric.readability * RUBRIC_WEIGHTS.readability;

    return Math.round(raw * 100) / 100;
}

/**
 * Apply Exponential Weighted Average (EWA) to update a skill score.
 * Historical performance is preserved at 70%; new score contributes 30%.
 * Result is clamped to [0, 100] and rounded to two decimal places.
 *
 * @param oldScore - Previous skill score (0–100)
 * @param newEvaluationScore - Score from the latest evaluation (0–100)
 * @returns Updated skill score (0–100)
 */
export function computeNewSkill(oldScore: number, newEvaluationScore: number): number {
    const raw = (oldScore * HISTORY_WEIGHT) + (newEvaluationScore * NEW_SCORE_WEIGHT);
    const clamped = Math.max(0, Math.min(100, raw));
    return Math.round(clamped * 100) / 100;
}

/**
 * Compute the Industry Readiness Score as the arithmetic mean of all six
 * skill domain scores. Result is rounded to two decimal places.
 *
 * @param skillScores - All six skill domain scores
 * @returns Readiness score (0–100)
 */
export function computeReadiness(skillScores: SkillScores): number {
    const values = ALL_SKILL_DOMAINS.map((d) => skillScores[d]);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / ALL_SKILL_DOMAINS.length;
    return Math.round(avg * 100) / 100;
}

/**
 * Compute the Confidence Score as the arithmetic mean of the last N
 * submission overall scores. If fewer than N submissions exist, uses all.
 *
 * @param last5Submissions - Array of overall scores from recent submissions (0–100 each)
 * @returns Confidence score (0–100), or 0 if no submissions
 */
export function computeConfidence(last5Submissions: number[]): number {
    if (last5Submissions.length === 0) return 0;
    const sum = last5Submissions.reduce((acc, s) => acc + s, 0);
    const avg = sum / last5Submissions.length;
    return Math.round(avg * 100) / 100;
}

/**
 * Derive the list of weak topic domains (score < threshold).
 * Returns a sorted, deduplicated array of weak domain names.
 *
 * @param skillScores - All six skill domain scores
 * @returns Array of SkillDomain strings scoring below WEAK_TOPIC_THRESHOLD
 */
export function computeWeakTopics(skillScores: SkillScores): SkillDomain[] {
    return ALL_SKILL_DOMAINS.filter(
        (domain) => skillScores[domain] < WEAK_TOPIC_THRESHOLD
    );
}

/**
 * Apply a new evaluation score to a specific skill domain and return
 * a fully updated SkillScores map. Other domains are unchanged.
 *
 * @param current - Existing skill scores
 * @param domain  - The domain being evaluated
 * @param newEval - New evaluation score for that domain
 * @returns New SkillScores map with the specified domain updated
 */
export function applySkillUpdate(
    current: SkillScores,
    domain: SkillDomain,
    newEval: number
): SkillScores {
    return {
        ...current,
        [domain]: computeNewSkill(current[domain], newEval),
    };
}
