<div align="center">

# 🧠 Rycene AI
### *AI-Powered Skill Intelligence for VLSI Engineers*

[![Next.js](https://img.shields.io/badge/Built_with-Next.js-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Powered_by-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/AI_Engine-Gemini_1.5_Flash-1E88E5?logo=google-bard)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/Type-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)

**[🚀 Live Platform](https://rycene-vlsi-mentor.vercel.app/)** | **[📖 Documentation](#)** 

<br/>

<img src="./frontend/public/dashboard.png" alt="Rycene Dashboard" width="850" style="border-radius: 12px; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">

<br/>

*From Learning Content to Measurable Competency. Rycene AI closes the gap between academic learning and semiconductor industry readiness through real-time code evaluation and AI mentorship.*

</div>

---

## 🌌 The Future of Education is Intelligence

The semiconductor industry moves at lightspeed, but traditional education pipelines struggle to keep pace. Finding exceptional VLSI talent is harder than ever, and students are often left guessing what exact skills top-tier companies actually demand.

**Rycene AI is the bridge.** 

We aren't just an educational tool; we are a **Skill Intelligence Platform.** By harnessing the incredible reasoning capabilities of **Google's Gemini 1.5 AI**, Rycene provides real-time, personalized, and mathematically precise feedback to aspiring hardware engineers. 

We transform passive learning into active, measurable competency.

---

## 🔥 Features That Mesmerize

### 1. ⚡ Real-time Verilog Code Evaluation
Stop waiting hours for a teaching assistant. Rycene's AI core analyzes your RTL submissions instantly. It doesn't just check for syntax—it evaluates **Logic Correctness, Synthesis Readiness, and Code Quality**, returning a structured JSON rubric that updates your skill profile immediately.

### 2. 🧠 Adaptive AI Mentorship (The Quick Tutor)
Stuck on metastability? Confused by finite state machines? The **Quick Tutor** breaks down complex logic design concepts using analogies, detailed hardware examples, and mini-quizzes to ensure maximum retention.

<div align="center">
<img src="./frontend/public/tutor.png" alt="Rycene Quick Tutor" width="850" style="border-radius: 12px; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
</div>

### 3. 🎯 Dynamic Skill Radar & Dashboard
Your growth isn't a feeling; it's data. Our mesmerizing, dark-mode glassmorphism dashboard features a live **Skill Radar** tracking six distinct VLSI domains (RTL, Digital, STA, Physical, DFT, Scripting). The platform utilizes Exponential Moving Averages (EWA) to score your readiness exactly how an employer would.

### 4. 📅 Generative Study Planning
Tell us your target role and your interview timeline. Rycene analyzes your weak domains from past evaluations and instantly hallucinates a tailored, day-by-day survival guide and study roadmap designed to make you hire-ready.

---

## 🛠️ System Architecture

Rycene operates on a highly secure, serverless architecture. All AI logic executes securely within Firebase Cloud Functions, completely isolating the Gemini API keys from the client while validating inputs and outputs via Zod schemas.

```mermaid
graph TD
    %% Styling
    classDef client fill:#09090b,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef auth fill:#f97316,stroke:#c2410c,stroke-width:2px,color:#fff;
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
    Gemini{Google Gemini 1.5 Flash API}:::ai

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

> *For a deep dive into how our Cloud Functions and Exponential Moving Average algorithms work, see the internal Architecture Documentation.*

---

## 💻 Tech Stack Deep Dive

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Next.js (App Router), Tailwind CSS | Highly optimized, server-rendered views with rapid dark-mode styling. |
| **Components** | Radix UI, Framer Motion, Recharts, Lucide | Accessible primitive components, fluid animations, and complex data visualization. |
| **Backend** | Firebase Functions (Node 18), Admin SDK | Secure edge execution, atomic database transactions, and API orchestration. |
| **Database** | Cloud Firestore | Highly-scalable NoSQL document database with real-time websocket synchronization. |
| **Intelligence** | Google Gemini 1.5 Flash | The primary reasoning engine, forced into strict JSON-mode via engineered system instructions. |
| **Validation** | Zod | End-to-end schema validation ensuring the AI outputs perfectly align with database models. |

---

## 👥 Meet the Team

Rycene AI was built by a passionate team of developers and VLSI enthusiasts dedicated to democratizing specialized education:

* **[Team Lead / Architect Name]** — System Architecture & Concept
* **[Frontend Engineer Name]** — UI/UX & Next.js Implementation
* **[Backend Engineer Name]** — Firebase & AI Integration
* **[VLSI Subject Matter Expert]** — Rubric Design & Prompt Engineering

*(Add your team's specific GitHub/LinkedIn links here to showcase your hard work!)*

---

## 🚀 Getting Started

If you want to spin up Rycene locally:

### Prerequisites
- Node.js (v18+)
- Firebase CLI installed globally
- A Google Gemini API Key

### Installation

1. **Clone the repo**
```bash
git clone https://github.com/Yasmeen-MS/rycene_vlsi_mentor.git
cd rycene_vlsi_mentor
```

2. **Frontend Setup**
```bash
cd frontend
npm install
# Create a .env.local file with your Firebase config
npm run dev
```

3. **Backend Setup (Functions)**
```bash
cd ../functions
npm install
firebase use --add
# Set your Gemini API key in Firebase Secret Manager
npm run build
firebase deploy --only functions
```

---

<div align="center">
<p className="text-sm font-medium">Built with 🧡 for the next generation of hardware engineers.</p>
</div>
