import { z } from "zod";
import { ALL_SKILL_DOMAINS } from "./types";

/**
 * Zod schema for the Gemini rubric JSON response.
 * All numeric fields are clamped to [0, 100].
 * detectedWeakTopics is coerced to only valid skill domain strings.
 */

const clampedScore = z
    .number()
    .min(0, "Score must be ≥ 0")
    .max(100, "Score must be ≤ 100");

export const RubricResponseSchema = z.object({
    syntax: clampedScore,
    logic: clampedScore,
    timing: clampedScore,
    bestPractices: clampedScore,
    readability: clampedScore,
    feedback: z.string().min(10, "Feedback must be at least 10 characters"),
    detectedWeakTopics: z
        .array(z.string())
        .transform((topics) =>
            topics.filter((t): t is typeof ALL_SKILL_DOMAINS[number] =>
                (ALL_SKILL_DOMAINS as string[]).includes(t)
            )
        ),
});

export type ValidatedRubricResponse = z.infer<typeof RubricResponseSchema>;

/**
 * Schema for the evaluateCode callable request payload.
 */
export const EvaluateCodeRequestSchema = z.object({
    code: z
        .string()
        .min(10, "Code must be at least 10 characters")
        .max(20000, "Code too large (max 20 000 characters)"),
    topic: z.enum([
        "rtl",
        "digital",
        "sta",
        "physical",
        "dft",
        "scripting",
    ] as const),
});

// ─── TUTOR SCHEMAS ────────────────────────────────────────────────────────────

/** Minimum string length for each tutor response field (prevents empty AI answers) */
const tutorStr = (field: string) =>
    z.string().min(5, `${field} must be at least 5 characters`);

/**
 * Zod schema for the 6-field structured Gemini concept tutor response.
 * Rejects any response where a field is missing or suspiciously short.
 */
export const TutorResponseSchema = z.object({
    concept: tutorStr("concept"),
    analogy: tutorStr("analogy"),
    industryContext: tutorStr("industryContext"),
    example: tutorStr("example"),
    miniQuiz: tutorStr("miniQuiz"),
    hint: tutorStr("hint"),
});

export type ValidatedTutorResponse = z.infer<typeof TutorResponseSchema>;

/**
 * Schema for the getTutorResponse callable request payload.
 */
export const GetTutorRequestSchema = z.object({
    question: z
        .string()
        .min(5, "Question must be at least 5 characters")
        .max(2000, "Question too long (max 2 000 characters)"),
    /** Optional: resume an existing chat session */
    sessionId: z.string().optional(),
    /** Optional: conversation memory passed from the frontend to keep Gemini contextual */
    history: z.array(
        z.object({
            role: z.enum(["user", "assistant"]),
            content: z.any()
        })
    ).optional(),
});

// ─── INTERVIEW SCHEMAS ──────────────────────────────────────────────────────

/**
 * Zod schema for the Gemini interview answer evaluation rubric.
 * Three numeric fields (clamped 0–100), an improvementAreas array, and feedback.
 */
export const InterviewRubricSchema = z.object({
    technicalDepth: clampedScore,
    clarity: clampedScore,
    correctness: clampedScore,
    improvementAreas: z
        .array(z.string().min(3, "Each improvement area must be descriptive"))
        .min(1, "At least one improvement area is required"),
    feedback: z
        .string()
        .min(20, "Interview feedback must be at least 20 characters"),
});

export type ValidatedInterviewRubric = z.infer<typeof InterviewRubricSchema>;

/** Valid topic slugs for interview questions */
const topicEnum = z.enum([
    "rtl",
    "digital",
    "sta",
    "physical",
    "dft",
    "scripting",
] as const);

/**
 * Discriminated-union schema for the runInterview callable request.
 *
 * Mode "generate": requires only `topic`.
 * Mode "evaluate": requires `topic`, `question` (the generated question
 *                  that was shown to the user), and `answer`.
 *
 * TypeScript will narrow the type on mode so the Cloud Function never
 * needs to unsafe-cast or add runtime null checks.
 */
export const RunInterviewRequestSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("generate"),
        topic: topicEnum,
    }),
    z.object({
        mode: z.literal("evaluate"),
        topic: topicEnum,
        question: z.string().min(10, "Question must be at least 10 characters"),
        answer: z
            .string()
            .min(5, "Answer must be at least 5 characters")
            .max(5000, "Answer too long (max 5 000 characters)"),
    }),
]);

export type ValidatedRunInterviewRequest = z.infer<typeof RunInterviewRequestSchema>;

// ─── STUDY PLAN SCHEMAS ─────────────────────────────────────────────────────────

/**
 * Schema for a single roadmap day entry.
 * day is constrained to 1–14; tasks must have at least 1 item.
 */
export const RoadmapDaySchema = z.object({
    day: z
        .number()
        .int("Day must be an integer")
        .min(1, "Day must be ≥ 1")
        .max(14, "Day must be ≤ 14"),
    focus: z.string().min(3, "Focus description must be at least 3 characters"),
    tasks: z
        .array(z.string().min(5, "Each task must be at least 5 characters"))
        .min(1, "Each day must have at least 1 task")
        .max(6, "Each day should not exceed 6 tasks"),
    revision: z.boolean(),
});

/**
 * Schema for the full Gemini study plan response.
 * Strictly requires EXACTLY 14 day entries with sequential day numbers.
 */
export const StudyPlanResponseSchema = z
    .object({
        roadmap: z
            .array(RoadmapDaySchema)
            .length(14, "Roadmap must contain exactly 14 days"),
    })
    .superRefine((data, ctx) => {
        // Enforce that day numbers are sequential 1–14 (Gemini sometimes reorders)
        const days = data.roadmap.map((d) => d.day).sort((a, b) => a - b);
        for (let i = 0; i < 14; i++) {
            if (days[i] !== i + 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Roadmap days must be sequential 1–14. Found day ${days[i]} at position ${i + 1}.`,
                    path: ["roadmap", i, "day"],
                });
            }
        }
    });

export type ValidatedStudyPlan = z.infer<typeof StudyPlanResponseSchema>;

/**
 * Schema for the incoming generateStudyPlan callable request payload.
 * interviewDate must be a future ISO date string.
 * hoursPerDay is clamped to sane values [1, 16].
 */
export const GenerateStudyPlanRequestSchema = z.object({
    targetRole: z
        .string()
        .min(3, "Target role must be at least 3 characters")
        .max(100, "Target role too long"),
    interviewDate: z
        .string()
        .refine(
            (d) => !isNaN(Date.parse(d)),
            "interviewDate must be a valid ISO 8601 date string"
        )
        .refine(
            (d) => new Date(d) > new Date(),
            "interviewDate must be in the future"
        ),
    hoursPerDay: z
        .number()
        .min(1, "hoursPerDay must be at least 1")
        .max(16, "hoursPerDay cannot exceed 16"),
});
