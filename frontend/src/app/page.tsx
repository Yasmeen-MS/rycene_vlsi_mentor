"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

import type { Variants } from "framer-motion";

// ─── Animation Variants ──────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center pt-5 px-4">
      <nav className="w-full max-w-6xl flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_14px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] transition-all duration-300">
            <span className="text-sm leading-none">🧠</span>
          </div>
          <span className="text-white font-bold tracking-wide text-sm">Rycene AI</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-7 text-sm text-zinc-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How It Works</a>
          <a href="#impact" className="hover:text-white transition-colors duration-200">Impact</a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 px-3 py-1.5">
            Log in
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 px-5 py-2 rounded-xl shadow-[0_0_18px_rgba(249,115,22,0.3)] hover:shadow-[0_0_28px_rgba(249,115,22,0.5)] transition-all duration-300"
          >
            Get Started →
          </Link>
        </div>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-40 pb-24 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Text */}
        <div className="space-y-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <span className="inline-flex items-center gap-1.5 border border-zinc-700 text-zinc-400 text-xs font-medium px-3 py-1 rounded-md tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              AI-Powered VLSI Education Platform
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeUp}
            className="text-5xl lg:text-6xl font-black text-white leading-[1.07] tracking-tight"
          >
            Master{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-orange-300">
              VLSI Design
            </span>{" "}
            With AI Intelligence
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeUp}
            className="text-zinc-400 text-lg leading-relaxed max-w-lg"
          >
            Rycene AI closes the gap between academic learning and semiconductor industry readiness. Get personalized mentorship, real-time code evaluation, and adaptive study plans powered by Gemini AI.
          </motion.p>

          {/* Stats Row */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.3}
            variants={fadeUp}
            className="flex flex-wrap gap-8 pt-2 pb-2 border-t border-b border-white/8"
          >
            {[
              { stat: "6+", label: "VLSI Domains" },
              { stat: "10K+", label: "AI Evaluations" },
              { stat: "24/7", label: "AI Tutor" },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="text-2xl font-black text-white">{stat}</div>
                <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.4}
            variants={fadeUp}
            className="flex flex-wrap gap-3 pt-1"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 px-7 py-3.5 rounded-xl shadow-[0_0_24px_rgba(249,115,22,0.4)] hover:shadow-[0_0_36px_rgba(249,115,22,0.6)] transition-all duration-300"
            >
              Get Started Free →
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-300 border border-white/15 hover:border-white/30 hover:text-white hover:bg-white/5 px-7 py-3.5 rounded-xl transition-all duration-300"
            >
              Sign In
            </Link>
          </motion.div>
        </div>

        {/* Right Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative w-full aspect-square max-w-lg mx-auto"
        >
          {/* Glow ring behind image */}
          <div className="absolute inset-6 bg-gradient-to-br from-orange-500/25 via-amber-500/15 to-transparent rounded-full blur-3xl" />
          <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/60 backdrop-blur-sm shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
            <Image
              src="/hero.png"
              alt="VLSI AI Platform Visualization"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Overlay gradient to blend into bg */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">The Problem</div>
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-5">
            The Industry Readiness Gap Is Real
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            Engineering curricula teach theory. Semiconductor companies need engineers who can write production-grade RTL, pass timing closures, and debug DFT-compliant designs — on day one. Most graduates are 12–18 months behind.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: "📉",
              title: "Skills Mismatch",
              desc: "University coursework covers 30% of what VLSI hiring managers test in first-round interviews.",
            },
            {
              icon: "⏱️",
              title: "No Real-Time Feedback",
              desc: "Static textbooks and passive lectures offer no adaptive correction loop for skill development.",
            },
            {
              icon: "🚪",
              title: "High Entry Barrier",
              desc: "Premium mentorship and industry coaching costs thousands, out of reach for most students.",
            },
          ].map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i * 0.12}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-zinc-900/60 border border-white/8 hover:border-orange-500/30 transition-all duration-300"
            >
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-orange-500/20 bg-gradient-to-br from-orange-950/40 via-zinc-900/80 to-zinc-950/80 p-10 lg:p-16">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">The Solution</div>
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-6 leading-tight">
                AI-Driven Skill Intelligence for VLSI Engineers
              </h2>
              <p className="text-zinc-300 text-base leading-relaxed mb-6">
                Rycene AI combines Google Gemini&apos;s reasoning with a precision skill-scoring engine to deliver an adaptive learning experience that evolves with your competency level — closing the gap between where you are and where industry demands you to be.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_30px_rgba(249,115,22,0.55)] transition-all duration-300"
              >
                Start Learning Free →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "EWA Skill Scoring", sub: "Exponential Weighted Average" },
                { label: "Gemini AI Backbone", sub: "Flash 1.5 Reasoning Engine" },
                { label: "6 VLSI Domains", sub: "RTL, STA, Physical, DFT…" },
                { label: "14-Day Roadmaps", sub: "Personalized to Weak Areas" },
              ].map(({ label, sub }) => (
                <div key={label} className="p-4 rounded-xl bg-black/40 border border-white/8">
                  <div className="text-white font-bold text-sm mb-1">{label}</div>
                  <div className="text-zinc-500 text-xs">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    {
      icon: "🤖",
      gradient: "from-orange-500/15 to-amber-500/5",
      border: "border-orange-500/20",
      title: "AI Tutor",
      desc: "Ask any VLSI concept — RTL timing, DFT strategies, SystemVerilog syntax. Get structured, expert-level explanations with real code examples, powered by Gemini AI.",
    },
    {
      icon: "⚡",
      gradient: "from-amber-500/15 to-orange-500/5",
      border: "border-amber-500/20",
      title: "Code Evaluation Engine",
      desc: "Submit your Verilog / SystemVerilog code and receive rubric-based feedback with scores on correctness, synthesis efficiency, and coding standards.",
    },
    {
      icon: "📡",
      gradient: "from-orange-600/15 to-red-500/5",
      border: "border-orange-600/20",
      title: "Skill Readiness Dashboard",
      desc: "Live radar chart and KPI cards showing your strengths across 6 VLSI domains. Readiness score updates after every evaluation using the EWA algorithm.",
    },
    {
      icon: "📋",
      gradient: "from-amber-400/15 to-yellow-500/5",
      border: "border-amber-400/20",
      title: "Personalized Study Plans",
      desc: "AI-generated 14-day roadmaps, dynamically adapted from your weak topic profile. Each plan includes focused exercises and milestone tracking.",
    },
    {
      icon: "🎯",
      gradient: "from-orange-500/15 to-amber-400/5",
      border: "border-orange-500/20",
      title: "Interview Simulator",
      desc: "Practice real-world VLSI interview questions with AI-graded answers. Get confidence scores and targeted preparation feedback for each session.",
    },
    {
      icon: "🔬",
      gradient: "from-amber-500/10 to-orange-600/5",
      border: "border-amber-500/20",
      title: "Code Lab",
      desc: "Integrated Monaco editor for live Verilog coding with syntax highlighting, evaluation submission, and structured result display — all in one place.",
    },
  ];

  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">Features</div>
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Everything You Need to Get Hired</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            A complete skill development system built for semiconductor engineers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, gradient, border, title, desc }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i * 0.08}
              variants={fadeUp}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${gradient} border ${border} hover:scale-[1.02] transition-transform duration-300 cursor-default group overflow-hidden`}
            >
              <div className="absolute inset-0 bg-zinc-900/50 rounded-2xl" />
              <div className="relative z-10">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { number: "01", title: "Sign Up & Profile", desc: "Create your account. System initializes your baseline skill profile across all 6 VLSI domains." },
    { number: "02", title: "Evaluate & Practice", desc: "Submit code, ask your AI tutor questions, and run mock interviews. Every answer feeds your skill profile." },
    { number: "03", title: "Track Your Skills", desc: "Your readiness score, radar chart, and domain scores update using our EWA algorithm in real time." },
    { number: "04", title: "Follow the Roadmap", desc: "Receive an adaptive 14-day study plan targeting your weakest domains. Stay on schedule with milestones." },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
          className="text-center max-w-xl mx-auto mb-16"
        >
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">How It Works</div>
          <h2 className="text-3xl lg:text-4xl font-black text-white">The Learning Optimization Loop</h2>
        </motion.div>

        <div className="relative">

          <div className="grid lg:grid-cols-4 gap-6">
            {steps.map(({ number, title, desc }, i) => (
              <motion.div
                key={number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.12}
                variants={fadeUp}
                className="relative text-center"
              >
                <div className="flex flex-col items-center mb-4">
                  <span className="text-xs font-bold text-orange-500/70 tracking-widest mb-1">{number}</span>
                  <div className="w-8 h-px bg-orange-500/40" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ImpactSection() {
  return (
    <section id="impact" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-zinc-900/60 p-10 lg:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-black/0 to-amber-950/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="text-xs font-bold text-orange-500 uppercase tracking-widest">Impact</div>
            <h2 className="text-3xl lg:text-4xl font-black text-white">
              Outcome-Driven Education Transformation
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Rycene AI transforms passive learners into industry-ready VLSI engineers. By closing the gap between theoretical knowledge and practical skills, students walk into interviews confident, equipped, and evaluated by the same rubrics hiring managers use.
            </p>

            <div className="grid md:grid-cols-3 gap-5 pt-4">
              {[
                { stat: "3×", label: "Faster skill growth vs traditional studying" },
                { stat: "87%", label: "Of learners improve readiness in 14 days" },
                { stat: "6", label: "Core VLSI domains covered end-to-end" },
              ].map(({ stat, label }) => (
                <div key={stat} className="p-5 rounded-xl bg-black/40 border border-white/8">
                  <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300 mb-1">{stat}</div>
                  <div className="text-zinc-400 text-xs leading-relaxed">{label}</div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 px-8 py-4 rounded-xl shadow-[0_0_24px_rgba(249,115,22,0.4)] hover:shadow-[0_0_36px_rgba(249,115,22,0.6)] transition-all duration-300"
              >
                Join Rycene AI Today →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/8 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-xs">🧠</span>
          </div>
          <span className="text-white font-bold text-sm">Rycene AI</span>
          <span className="text-zinc-600 text-xs ml-2">VLSI Mentor Platform</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs text-zinc-500 font-medium">
          <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-zinc-300 transition-colors">How It Works</a>
          <Link href="/login" className="hover:text-zinc-300 transition-colors">Login</Link>
        </div>

        {/* Copyright */}
        <div className="text-zinc-600 text-xs">
          © 2025 Rycene. Built by{" "}
          <span className="text-zinc-400 font-medium">Yasmeen MS & Rachana P</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();

  // Auth redirect guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 selection:text-orange-100 overflow-x-hidden">
      {/* Ambient glows */}
      <div className="fixed pointer-events-none inset-0 z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-orange-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-amber-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesGrid />
        <HowItWorks />
        <ImpactSection />
        <Footer />
      </div>
    </div>
  );
}
