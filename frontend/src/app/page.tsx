"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

import type { Variants } from "framer-motion";

// ─── Animation Variants ──────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, // Apple-like smooth spring easing
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function AnimatedCounter({ target, label }: { target: string, label: string }) {
  const numericTarget = parseInt(target.replace(/[^0-9]/g, ""));
  const suffix = target.replace(/[0-9]/g, "");

  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const steps = 40;
    const increment = numericTarget / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericTarget) {
        setCount(numericTarget);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [numericTarget, isInView]);

  return (
    <div ref={ref} className="group relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-amber-500/0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative">
        <div className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
          {count}{suffix}
        </div>
        <div className="text-xs font-bold text-orange-500/80 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.85]);
  const borderColor = useTransform(scrollY, [0, 50], ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]);
  const shadowOpacity = useTransform(scrollY, [0, 50], ["0px 0px 0px rgba(0,0,0,0)", "0px 8px 32px rgba(0,0,0,0.4)"]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
      <motion.nav
        style={{
          backgroundColor: useTransform(bgOpacity, v => `rgba(24, 24, 27, ${v})`),
          borderColor,
          boxShadow: shadowOpacity
        }}
        className="w-full max-w-6xl flex items-center justify-between backdrop-blur-xl border rounded-[20px] px-6 py-3.5 pointer-events-auto transition-colors duration-500"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_14px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_24px_rgba(249,115,22,0.6)] group-hover:scale-105 transition-all duration-300">
            <span className="text-sm leading-none">🧠</span>
          </div>
          <span className="text-white font-bold tracking-wide text-[15px]">Rycene AI</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-[14px] text-zinc-400 font-medium">
          {["Features", "How It Works", "Impact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="relative hover:text-white transition-colors duration-300 group py-2"
            >
              {item}
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 to-amber-400 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out rounded-full" />
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:inline-flex text-[14px] font-medium text-zinc-300 hover:text-white transition-colors duration-300 px-2 py-2">
            Log in
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="relative inline-flex items-center justify-center gap-2 text-[14px] font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(249,115,22,0.4)] hover:shadow-[0_6px_24px_rgba(249,115,22,0.6)] transition-all duration-300 overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Get Started <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </Link>
          </motion.div>
        </div>
      </motion.nav>
    </header>
  );
}

function HeroSection() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 150]);

  return (
    <section className="relative pt-44 pb-16 px-4 overflow-hidden">
      <motion.div
        style={{ y: y1 }}
        className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-8 items-start lg:pt-10"
      >
        {/* Left Text */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8 relative z-10"
        >
          <motion.div variants={fadeUp} className="relative inline-block">
            <div className="relative inline-flex overflow-hidden rounded-full p-[1px] shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-shadow duration-300">
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#f97316_0%,#000000_50%,#fbf2ed_100%)] opacity-80" />
              <span className="inline-flex h-full w-full items-center gap-2 rounded-full bg-zinc-950/90 px-4 py-1.5 text-[11px] font-black tracking-widest text-orange-400 uppercase backdrop-blur-3xl">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                AI-Powered VLSI Education
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[3.5rem] lg:text-[4.5rem] font-black text-white leading-[1.05] tracking-tight"
          >
            Master{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
                VLSI Design
              </span>
              <span className="absolute inset-x-0 bottom-2 h-3 bg-orange-500/20 blur-md -z-10" />
            </span>
            <br />With AI Intelligence
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-zinc-400 text-lg lg:text-xl leading-relaxed max-w-lg font-medium"
          >
            Rycene AI closes the gap between academic learning and semiconductor industry readiness. Access personalized mentorship, real-time code evaluation, and adaptive study plans powered by Gemini AI.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="relative inline-flex items-center justify-center gap-2 text-base font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 px-8 py-4 rounded-2xl shadow-[0_8px_32px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_48px_rgba(249,115,22,0.5)] transition-all duration-300 overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Learning Free <span className="group-hover:translate-x-1.5 transition-transform duration-300 ease-out">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-base font-bold text-zinc-300 bg-zinc-900/50 hover:bg-zinc-800 border border-white/10 hover:border-white/20 px-8 py-4 rounded-2xl transition-all duration-300 backdrop-blur-sm"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-12 pt-8 mt-4 border-t border-white/5"
          >
            <AnimatedCounter target="6+" label="VLSI Domains" />
            <AnimatedCounter target="10K+" label="Evaluations" />
            <AnimatedCounter target="24/7" label="AI Tutor" />
          </motion.div>
        </motion.div>

        {/* Right Illustration & Floating Elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="relative w-full max-w-[500px] mx-auto lg:ml-auto aspect-[4/5] mt-8 lg:mt-0"
        >
          {/* Decorative curved background lines mimicking the reference */}
          <svg className="absolute -inset-20 z-0 opacity-20 pointer-events-none" viewBox="0 0 500 500">
            <path d="M 0 500 Q 250 100 500 0" fill="transparent" stroke="#f97316" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M -100 300 Q 250 450 600 200" fill="transparent" stroke="#f97316" strokeWidth="0.5" />
          </svg>

          {/* Main Arched Image Frame */}
          <motion.div
            animate={{
              y: [-8, 8, -8],
            }}
            transition={{
              repeat: Infinity,
              duration: 7,
              ease: "easeInOut"
            }}
            className="relative w-full h-full rounded-tl-[120px] rounded-br-[120px] rounded-tr-[32px] rounded-bl-[32px] overflow-hidden border border-white/10 bg-gradient-to-br from-orange-950/40 to-black shadow-[0_32px_80px_rgba(249,115,22,0.15)] group z-10"
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-amber-500/10 to-transparent blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-700" />

            <Image
              src="/hero.png"
              alt="VLSI AI Platform Visualization"
              fill
              className="object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out opacity-90 mix-blend-screen"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 rounded-tl-[120px] rounded-br-[120px] rounded-tr-[32px] rounded-bl-[32px] ring-1 ring-inset ring-white/10 pointer-events-none" />
          </motion.div>

          {/* Floating Element 1: 3D Sparkle / Star */}
          <motion.div
            animate={{
              rotate: 360,
              y: [-5, 5, -5]
            }}
            transition={{
              rotate: { repeat: Infinity, duration: 20, ease: "linear" },
              y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
            }}
            className="absolute top-1/4 -left-8 z-20 w-16 h-16 bg-white flex items-center justify-center text-orange-500 rounded-2xl shadow-[0_8px_32px_rgba(249,115,22,0.3)] rotate-12"
            style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}
          />

          {/* Floating Element 2: Trust Badge (Bottom Right) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute -bottom-6 -right-6 z-20 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-3 pr-5 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 shadow-sm overflow-hidden relative">
                <Image src="/hero.png" alt="User" fill className="object-cover opacity-70" />
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-950 border-2 border-zinc-900 shadow-sm flex items-center justify-center relative">
                <span className="text-white text-xs font-bold">4.9</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white border-2 border-zinc-900 shadow-sm flex items-center justify-center">
                <span className="text-black text-xs font-black">★</span>
              </div>
            </div>
            <div>
              <div className="text-white text-xs font-bold leading-tight">Industry Rate</div>
              <div className="text-zinc-500 text-[10px] leading-tight mt-0.5">Top Tier</div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="relative w-full">
      {/* Trust / Logo Strip connecting Hero to Problem Section */}
      <div className="w-full bg-black py-10 border-t border-white/5 relative z-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-8">
            Preparing engineers for core VLSI domains
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 transition-all duration-500 hover:opacity-100">
            {/* Domain placeholders mimicking the reference image style without using copyrighted logos */}
            <div className="text-lg lg:text-xl font-bold tracking-tight text-zinc-300 flex items-center gap-2"><span className="text-orange-500/80">⚡</span> RTL Design</div>
            <div className="text-lg lg:text-xl font-bold tracking-tight text-zinc-300 flex items-center gap-2"><span className="text-orange-500/80">🔬</span> Verification</div>
            <div className="text-lg lg:text-xl font-bold tracking-tight text-zinc-300 flex items-center gap-2"><span className="text-orange-500/80">⚙️</span> Physical Design</div>
            <div className="text-lg lg:text-xl font-bold tracking-tight text-zinc-300 flex items-center gap-2"><span className="text-orange-500/80">🖥️</span> DFT Check</div>
          </div>
        </div>
      </div>

      {/* Dark Slanted Problem Section mimicking the reference image */}
      <div className="w-full bg-zinc-950 py-24 px-4 relative overflow-hidden border-t border-white/5">
        {/* Subtle dark gradient slant background */}
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-white/[0.02] -skew-x-[30deg] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-black to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-20">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="lg:col-span-5"
            >
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-500 mb-4">
                <span className="text-orange-500">⚡</span> The Challenge
              </div>
              <h2 className="text-4xl lg:text-5xl font-normal text-white tracking-tight leading-[1.15]">
                How the <span className="font-bold relative inline-block">Industry Readiness Gap<span className="absolute bottom-1 left-0 w-full h-2 bg-orange-500/20 -z-10 blur-sm flex"></span></span> hurts engineers
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="lg:col-span-6 lg:col-start-7 lg:mt-10"
            >
              <p className="text-zinc-400 text-lg leading-relaxed border-l-2 border-orange-500/30 pl-6">
                Engineering curricula teach pure theory. Semiconductor companies demand engineers who can write production RTL, close timing, and debug DFT issues on day one. Most graduates arrive roughly 12–18 months behind standard hiring requirements.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 relative"
          >
            {[
              { icon: "📉", title: "Skills Mismatch", desc: "University coursework covers barely 30% of what VLSI hiring managers actually test in first-round technical interviews." },
              { icon: "⏱️", title: "No Real-Time Feedback", desc: "Static textbooks and passive video lectures offer no adaptive correction loop for actual code development and synthesis." },
              { icon: "🚪", title: "High Entry Barrier", desc: "Premium mentorship and senior industry coaching costs thousands of dollars, putting it completely out of reach for most students." },
            ].map(({ icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group p-8 rounded-[1.5rem] bg-black/60 border border-white/5 hover:border-orange-500/30 transition-all duration-300 relative overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl mb-6 shadow-[0_0_15px_rgba(249,115,22,0.1)] group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300">
                    {icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2.5rem] overflow-hidden border border-orange-500/20 bg-gradient-to-br from-orange-950/60 via-zinc-950 to-zinc-900/90 p-12 lg:p-20 shadow-[0_0_80px_rgba(249,115,22,0.08)]"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">The Solution</div>
                <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
                  AI-Driven Skill Intelligence for VLSI
                </h2>
                <p className="text-zinc-300 text-lg leading-relaxed">
                  Rycene AI combines Google Gemini&apos;s advanced reasoning with a precision skill-scoring engine to deliver an adaptive learning experience. It evolves dynamically with your true competency level.
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 text-base font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 px-8 py-4 rounded-xl shadow-[0_8px_24px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_36px_rgba(249,115,22,0.5)] transition-all duration-300"
                >
                  Experience the Platform →
                </Link>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                { label: "EWA Core", sub: "Exponential Scoring Algorithm", icon: "📐" },
                { label: "Gemini AI Backbone", sub: "Flash 1.5 Reasoning Engine", icon: "🧠" },
                { label: "6 Industry Domains", sub: "RTL, STA, Physical, DFT", icon: "⚡" },
                { label: "14-Day Roadmaps", sub: "Dynamic Skill Generation", icon: "🗺️" },
              ].map(({ label, sub, icon }, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                  key={label}
                  className="p-5 rounded-2xl bg-black/50 border border-white/5 hover:border-orange-500/30 transition-colors duration-300"
                >
                  <div className="text-2xl mb-3">{icon}</div>
                  <div className="text-white font-bold text-[15px] mb-1 tracking-wide">{label}</div>
                  <div className="text-zinc-400 text-xs leading-relaxed">{sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    { icon: "🤖", title: "AI Concept Tutor", desc: "Ask any complex VLSI concept — RTL timing, DFT strategies, or syntax. Get structured, expert explanations with real code examples." },
    { icon: "⚡", title: "Code Evaluation Engine", desc: "Submit your exact Verilog code and receive instant rubric-based feedback scoring correctness, synthesis efficiency, and formatting." },
    { icon: "📡", title: "Live Skill Radar", desc: "A live multidimensional radar chart tracking your exact readiness across 6 VLSI domains, updated natively after every single interaction." },
    { icon: "📋", title: "Adaptive Study Plans", desc: "AI-generated 14-day progressive roadmaps, strictly adapted from your weakest topic profile with daily milestone tracking." },
    { icon: "🎯", title: "Interview Simulator", desc: "Practice high-pressure real-world VLSI interview questions. Get immediate confidence scoring and targeted feedback on your delivery." },
    { icon: "🔬", title: "Monaco Code Lab", desc: "Professional integrated editor for live Verilog coding with highlighting, validation, and direct evaluation submission in one place." },
  ];

  return (
    <section id="features" className="py-28 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <motion.div variants={fadeUp} className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-4">Core Platform</motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">Everything You Need to Get Hired</motion.h2>
          <motion.p variants={fadeUp} className="text-zinc-400 text-lg leading-relaxed">
            A fully integrated skill development subsystem designed exclusively for semiconductor engineering.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map(({ icon, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group relative p-8 rounded-[2rem] bg-zinc-900/30 border border-white/5 hover:bg-zinc-900/60 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[50px] translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="text-4xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 origin-left">
                  {icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{title}</h3>
                <p className="text-zinc-400 text-[15px] leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { number: "01", title: "Baseline Profiling", desc: "Create your account to establish a baseline readiness profile across standard VLSI domains." },
    { number: "02", title: "Pushed Evaluation", desc: "Submit code, interact with the tutor, and run mock interviews. Every action is silently evaluated." },
    { number: "03", title: "Real-Time Tracking", desc: "Your global readiness index and radar metrics recalculate instantly using the EWA pipeline." },
    { number: "04", title: "Targeted Roadmaps", desc: "Generate adaptive study plans heavily biased toward optimizing your specifically identified weak spots." },
  ];

  return (
    <section id="how-it-works" className="py-28 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-r from-orange-900/10 via-amber-900/10 to-orange-900/10 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <motion.div variants={fadeUp} className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-4">Methodology</motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-black text-white tracking-tight">The Learning Optimization Loop</motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8"
        >
          {steps.map(({ number, title, desc }) => (
            <motion.div
              key={number}
              variants={fadeUp}
              className="relative text-center group"
            >
              <div className="flex flex-col items-center mb-6">
                <span className="text-sm font-black text-orange-500/80 tracking-widest mb-3 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">{number}</span>
                <div className="w-0.5 h-12 bg-gradient-to-b from-orange-500/40 to-transparent group-hover:h-16 transition-all duration-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-zinc-400 text-[15px] leading-relaxed max-w-[260px] mx-auto">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ImpactSection() {
  return (
    <section id="impact" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-[3rem] overflow-hidden bg-zinc-900 text-center"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-orange-950/20 via-zinc-900 to-zinc-950 pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

          <div className="relative z-10 p-12 lg:p-24 space-y-8">
            <div className="text-[11px] font-bold text-orange-500 uppercase tracking-widest">The Outcome</div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight max-w-3xl mx-auto">
              Stop Guessing Your Readiness. Start Proving It.
            </h2>

            <div className="pt-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Link
                  href="/login"
                  className="relative inline-flex items-center justify-center gap-2 text-lg font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 px-10 py-5 rounded-2xl shadow-[0_12px_40px_rgba(249,115,22,0.4)] hover:shadow-[0_16px_50px_rgba(249,115,22,0.6)] transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Launch Platform Dashboard <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
            <span className="text-[13px]">🧠</span>
          </div>
          <div>
            <div className="text-white font-bold text-[15px] tracking-wide">Rycene AI</div>
            <div className="text-zinc-600 text-[11px] uppercase tracking-widest font-bold mt-0.5">VLSI Mentor Platform</div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-zinc-500 text-sm font-medium">
          © 2025 Rycene Platform. Engineered by <span className="text-zinc-300 font-bold">Yasmeen MS & Rachana P</span>.
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
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 selection:text-orange-100 overflow-x-hidden font-sans">
      <Navbar />

      <main className="relative z-10">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesGrid />
        <HowItWorks />
        <ImpactSection />
      </main>

      <Footer />
    </div>
  );
}
