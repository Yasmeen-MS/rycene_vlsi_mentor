# RYCENE VLSI MENTOR AI
## Final Production-Ready Architecture Document
## Hackathon Submission Version (Deployable on Vercel)

---

# 1. PRODUCT OBJECTIVE

Rycene VLSI Mentor AI is a production-grade AI-powered semiconductor skilling platform built to personalize VLSI education using structured evaluation, mastery tracking, adaptive planning, and industry readiness analytics.

This system is designed to feel like a real SaaS learning platform — not a demo chatbot.

The platform must:
- Be fully functional
- Persist user data
- Update skill metrics in real time
- Provide structured AI outputs
- Avoid disconnected dummy features
- Be deployable on Vercel

---

# 2. NON-NEGOTIABLE ENGINEERING PRINCIPLES

1. Every feature must update Firestore.
2. No hardcoded fake scores.
3. All AI responses must be structured JSON.
4. Dashboard values must derive from stored database values.
5. All calculations must be deterministic and reproducible.
6. No placeholder logic in MVP core features.
7. UI must reflect actual backend state.

---

# 3. TECH STACK (FINAL LOCKED)

Frontend:
- React (Vite)
- TailwindCSS
- Framer Motion
- Recharts
- Firebase Web SDK

Backend:
- Firebase Authentication
- Firestore Database
- Firebase Cloud Functions (Node 18)

AI Engine:
- Google Gemini API (via secure Cloud Function)

Deployment:
- Frontend → Vercel
- Firebase → Production project

---

# 4. PRODUCTION SYSTEM ARCHITECTURE

Client (React App on Vercel)
    ↓
Firebase Auth (JWT)
    ↓
Firestore (User + Skill + Submission Data)
    ↓
Cloud Functions (Secure AI Calls)
    ↓
Gemini API
    ↓
Structured JSON Response
    ↓
Firestore Update
    ↓
Realtime UI Update

No direct Gemini calls from frontend.
All AI calls must pass through Cloud Functions.

---

# 5. FIRESTORE SCHEMA (STRICTLY DEFINED)

users/{userId}
{
  name: string,
  email: string,
  createdAt: timestamp,
  skillScores: {
    rtl: number,
    digital: number,
    sta: number,
    physical: number,
    dft: number,
    scripting: number
  },
  confidenceScore: number,
  readinessScore: number,
  weakTopics: string[],
  lastUpdated: timestamp
}

submissions/{submissionId}
{
  userId: string,
  type: "code" | "interview" | "quiz",
  topic: string,
  rubricScore: {
    syntax: number,
    logic: number,
    timing: number,
    bestPractices: number,
    readability: number
  },
  overallScore: number,
  feedback: string,
  createdAt: timestamp
}

studyPlans/{userId}
{
  targetRole: string,
  interviewDate: timestamp,
  hoursPerDay: number,
  roadmap: array,
  createdAt: timestamp
}

chatSessions/{sessionId}
{
  userId: string,
  messages: array,
  createdAt: timestamp
}

---

# 6. CORE ENGINES (FULLY CONNECTED)

## 6.1 Skill Score Engine

Skill scores update only via:
- Code evaluation
- Interview simulation
- Quiz responses

Algorithm:

NewSkillScore = (OldScore * 0.7) + (NewEvaluationScore * 0.3)

Readiness Score = Average of all skillScores

Confidence Score = Based on last 5 submission averages

Weak Topics = Any topic with average < 60

All computed inside Cloud Function to prevent manipulation.

---

## 6.2 AI Concept Tutor (Structured Mode Only)

Gemini must return:

{
  concept: string,
  analogy: string,
  industryContext: string,
  example: string,
  miniQuiz: string,
  hint: string
}

Frontend renders structured blocks.
No freeform uncontrolled chat rendering.

---

## 6.3 Rubric-Based Verilog Evaluation (Strict JSON)

Cloud Function prompt enforces JSON-only output.

Required Output:

{
  syntax: number,
  logic: number,
  timing: number,
  bestPractices: number,
  readability: number,
  feedback: string,
  detectedWeakTopics: string[]
}

Overall Score = Weighted average.

All scores stored in Firestore.
Dashboard updates in real time.

---

## 6.4 Interview Simulation Engine

Flow:
1. Cloud Function generates one question.
2. User submits answer.
3. Gemini evaluates with rubric.
4. Skill scores updated.
5. Confidence recalculated.

Must store each interview attempt.

---

## 6.5 Study Planner Engine

Planner must:
- Use real weakTopics
- Use real readinessScore
- Calculate daysRemaining
- Generate realistic 14-day structured roadmap

No static templates.
Must regenerate if weakTopics change.

---

# 7. DASHBOARD (DATA-DRIVEN ONLY)

Widgets:

1. Skill Radar (Recharts, real Firestore values)
2. Industry Readiness % (computed)
3. Confidence Score
4. Weak Topics Panel
5. Recent Feedback Panel
6. Next Recommended Action

No widget should show placeholder data.

---

# 8. UI DESIGN SYSTEM

Theme:
Dark gradient base
Purple → Indigo → Cyan glow
Glassmorphism cards
Subtle animated gradients
Framer Motion transitions

Must feel SaaS-level polished.

---

# 9. EXCLUDED FROM MVP (STRICT)

Not included in submission build:
- Audio Overview Engine
- Dual AI Podcast Mode
- Speech-to-Text
- Coqui TTS
- Mediapipe Logic Game

These will appear only as roadmap features.

---

# 10. DEPLOYMENT FLOW

1. Firebase production project created
2. Environment variables stored securely
3. Cloud Functions deployed
4. Frontend deployed to Vercel
5. Test full authentication + AI flow
6. Verify Firestore updates live
7. Test on incognito browser

---

# 11. JUDGE EXPERIENCE FLOW

1. Sign up
2. Ask VLSI concept question
3. Submit Verilog code
4. See structured rubric feedback
5. Watch skill radar update
6. Generate study plan
7. Attempt interview simulation
8. See readiness improvement

This must work end-to-end without failure.

---

# 12. POSITIONING STATEMENT

Rycene VLSI Mentor AI is a production-grade semiconductor skilling platform that transforms live course learners into industry-ready engineers through explainable AI tutoring, structured technical evaluation, and measurable mastery analytics.

It is not a chatbot. It is a full-stack AI learning intelligence system.

---

END OF FINAL ARCHITECTURE DOCUMENT
