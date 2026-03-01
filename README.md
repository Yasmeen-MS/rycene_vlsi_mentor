<div align="center">

<img src="https://raw.githubusercontent.com/Yasmeen-MS/rycene_vlsi_mentor/main/frontend/public/abstract_bg.png" alt="Rycene VLSI Banner" width="100%" style="border-radius: 12px; box-shadow: 0 0 20px rgba(99,102,241,0.5);">

# ⚡ Rycene VLSI Mentor AI ⚡
**The Futuristic, Data-Driven Semiconductor Skilling Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-V10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

*Transforming VLSI education through deterministic AI, real-time analytics, and adaptive roadmaps.*

[Explore the Platform](#) • [Watch Demo](#) • [Architecture Docs](#system-architecture)

</div>

---

## 🚀 Vision

**Rycene VLSI Mentor AI** is a production-grade, AI-powered specialized learning environment designed to accelerate the mastery of semiconductor engineering and Very-Large-Scale Integration (VLSI) design. 

Moving beyond generic chatbots, Rycene provides a **structured, highly-deterministic AI loop** that strictly enforces schema validation, tracks continuous cognitive mastery via Exponential Weighted Averages (EWA), and synthesizes dynamic, high-fidelity 14-day study plans customized to your weakest micro-domains.

---

## 🔮 Core Features

- 🧠 **Deterministic Evaluation Engine**: Upload Verilog/SystemVerilog snippets and receive strict JSON-enforced scoring across Syntax, Logic, Timing, and Best Practices.
- 🎙️ **Interactive Interview Simulator**: Generate role-specific technical questions (RTL, STA, DFT), submit answers, and receive detailed critique and real-time skill score adjustments.
- 🗺️ **Adaptive 14-Day Study Planner**: An intelligent roadmap generator that analyzes your historical sub-scores and constructs a tailored daily focus plan to optimize interview readiness.
- 💬 **Context-Aware AI Tutor**: Ask complex architecture questions and receive structured pedagogical breakdowns including Analogies, Industry Contexts, Code Examples, and Mini Quizzes.
- 📊 **Dynamic Master Dashboard**: A mesmerizing dark-glassmorphism UI featuring live Radar Charts and Exponential Skill Trendlines powered instantly by Firestore `onSnapshot`.

---

## 🏗️ System Architecture

Rycene operates on a highly secure, serverless architecture. All AI logic executes securely within Firebase Cloud Functions, completely isolating the Gemini API keys from the client while validating inputs and outputs via Zod schemas.

```mermaid
graph TD
    %% Styling
    classDef client fill:#09090b,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef auth fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef db fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef serverless fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef ai fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff;

    %% Client Layer
    subgraph Frontend [Next.js Vercel Client]
        UI[Glassmorphism UI]:::client
        State[React State & Hooks]:::client
        Editor[Monaco Code Editor]:::client
    end

    %% Auth Layer
    Auth((Firebase Auth)):::auth

    %% Database Layer
    subgraph Firestore Data Lake
        UsersDB[(Users Context)]:::db
        SubmissionsDB[(Evaluation History)]:::db
        StudyPlansDB[(Adaptive Roadmaps)]:::db
    end

    %% Serverless Execution
    subgraph Application Logic [Firebase Cloud Functions v2]
        evalFn([evaluateCode.ts]):::serverless
        tutorFn([getTutorResponse.ts]):::serverless
        interviewFn([runInterview.ts]):::serverless
        planFn([generateStudyPlan.ts]):::serverless
        engine([skillEngine.ts / EWA Math]):::serverless
    end

    %% AI Core
    Gemini{Google Gemini 2.5 Flash API}:::ai

    %% Connections
    UI -->|JWT Auth| Auth
    UI -.->|onSnapshot Realtime Sync| UsersDB
    UI -.->|onSnapshot Realtime Sync| StudyPlansDB
    
    UI -->|HTTPS Callable| evalFn
    UI -->|HTTPS Callable| tutorFn
    UI -->|HTTPS Callable| interviewFn
    UI -->|HTTPS Callable| planFn

    evalFn <-->|Validates & Parses| engine
    interviewFn <-->|Validates & Parses| engine

    evalFn -->|Strict JSON Prompt| Gemini
    tutorFn -->|Strict JSON Prompt| Gemini
    interviewFn -->|Strict JSON Prompt| Gemini
    planFn -->|Strict JSON Prompt| Gemini

    engine -->|Atomic Transaction Writes| UsersDB
    evalFn -->|Records| SubmissionsDB
    interviewFn -->|Records| SubmissionsDB
```

### 🔒 Security & Data Flow
1. **The Client (Vercel)** can *read* its own data via secure Firestore Security Rules.
2. **The Client cannot write** to secure measurement fields (like `skillScores`).
3. To update a score, the Client invokes a **Cloud Function**.
4. The Cloud Function authenticates the JWT, communicates securely with **Gemini API**.
5. The Function parses the generative JSON via **Zod**.
6. The Function initiates an **Atomic Firestore Transaction** to compute the new Exponential Weighted Average (EWA) and writes it safely to the database.
7. The Client UI updates instantly via WebSocket listeners.

---

## 🛠️ Tech Stack Deep Dive

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Next.js (App Router), Tailwind CSS | Highly optimized, server-rendered views with rapid dark-mode styling. |
| **Components** | Radix UI, Framer Motion, Recharts, Lucide | Accessible primitive components, fluid animations, and complex data visualization. |
| **Backend** | Firebase Functions (Node 18), Admin SDK | Secure edge execution, atomic database transactions, and API orchestration. |
| **Database** | Cloud Firestore | Highly-scalable NoSQL document database with real-time websocket synchronization. |
| **Intelligence** | Google Gemini 2.5 Flash | The primary reasoning engine, forced into strict JSON-mode via engineered system instructions. |
| **Validation** | Zod | End-to-end schema validation ensuring the AI outputs perfectly align with database models. |

---

## 💻 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/Yasmeen-MS/rycene_vlsi_mentor.git
cd rycene_vlsi_mentor
```

### 2. Frontend Configuration
Navigate to the frontend directory:
```bash
cd frontend
npm install
```
Create an `.env.local` file using the template:
```bash
cp .env.example .env.local
```
Fill in your Firebase credentials inside `.env.local`.

### 3. Backend (Cloud Functions) Configuration
Navigate to the functions directory:
```bash
cd ../functions
npm install
```
Establish your Gemini API key in the Firebase Cloud environment:
```bash
firebase functions:config:set gemini.api_key="your_google_ai_studio_key"
```

### 4. Run the Dev Servers
You will need two terminal windows:
**Terminal 1 (Frontend):**
```bash
cd frontend
npm run dev
```
**Terminal 2 (Firebase Local Emulator):**
*(Requires Firebase CLI properly authenticated)*
```bash
cd functions
npm run build:watch
firebase emulators:start
```

---

## ✨ Design Philosophy: Dark Glassmorphism

Rycene ditches the sterile, boring look of traditional LMS platforms. It utilizes a stunning **Abstract Dark Glassmorphism** aesthetic. 

- Deep `zinc-950` translucent panels (`backdrop-blur-2xl`)
- Subtle vivid accent borders reflecting performance states (Emerald for pass, Crimson for fail)
- Vibrant `purple/indigo/orange` radial glows injecting life into the data dashboards.
- Fully custom scrollbars and zero-flicker state transitions.

<p align="center">
  <img src="https://raw.githubusercontent.com/Yasmeen-MS/rycene_vlsi_mentor/main/frontend/public/abstract_bg.png" width="80%">
</p>

---

<div align="center">

*Engineered with precision for the next generation of Semiconductor Innovators.*

**[Yasmeen MS](https://github.com/Yasmeen-MS)** | 2026

</div>
