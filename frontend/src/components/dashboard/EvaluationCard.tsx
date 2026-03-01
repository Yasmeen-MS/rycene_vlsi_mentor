"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import type { EvaluateCodeResult } from "@/lib/functions";

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 600): number {
    const [count, setCount] = useState(0);
    useEffect(() => {
        setCount(0);
        if (target === 0) return;
        const steps = 30;
        const increment = target / steps;
        const interval = duration / steps;
        const timer = setInterval(() => {
            setCount((prev) => {
                const next = prev + increment;
                if (next >= target) { clearInterval(timer); return target; }
                return Math.round(next);
            });
        }, interval);
        return () => clearInterval(timer);
    }, [target, duration]);
    return count;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
}

const RUBRIC_LABELS: Record<string, string> = {
    syntax: "Syntax",
    logic: "Logic",
    timing: "Timing",
    bestPractices: "Best Practices",
    readability: "Readability",
};

function RubricBar({ label, score }: { label: string; score: number }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(score), 80);
        return () => clearTimeout(t);
    }, [score]);

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400 font-medium">{label}</span>
                <span className="font-semibold" style={{ color: scoreColor(score) }}>{score}</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${width}%`, backgroundColor: scoreColor(score) }}
                />
            </div>
        </div>
    );
}

// ─── EvaluationCard ───────────────────────────────────────────────────────────

export default function EvaluationCard({ result }: { result: EvaluateCodeResult }) {
    const displayScore = useCountUp(result.overallScore ?? 0);
    const color = scoreColor(result.overallScore ?? 0);
    const isGood = (result.overallScore ?? 0) >= 70;

    // rubricScore is the flat object: { syntax, logic, timing, bestPractices, readability }
    const rubricScores = result.rubricScore
        ? Object.entries(result.rubricScore).map(([key, value]) => ({
            label: RUBRIC_LABELS[key] ?? key,
            score: typeof value === "number" ? value : 0,
        }))
        : [];

    // weak topics from the top-level array
    const weakTopics = result.detectedWeakTopics ?? [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <Card className="rounded-3xl border border-white/10 shadow-2xl bg-white/[0.02] backdrop-blur-xl">
                <CardHeader className="pb-3 pt-5 px-5">
                    <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                        {isGood
                            ? <CheckCircle size={14} className="text-green-500" />
                            : <AlertCircle size={14} className="text-amber-500" />}
                        Evaluation Result
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-5">

                    {/* Overall Score */}
                    <div className="flex flex-col items-center py-4 bg-black/30 rounded-xl">
                        <span className="text-5xl font-bold" style={{ color }}>
                            {displayScore}
                        </span>
                        <span className="text-xs text-zinc-500 mt-1">Overall Score / 100</span>
                    </div>

                    {/* Rubric bars */}
                    {rubricScores.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                                Dimension Breakdown
                            </p>
                            {rubricScores.map(({ label, score }) => (
                                <RubricBar key={label} label={label} score={score} />
                            ))}
                        </div>
                    )}

                    {/* Feedback */}
                    {result.feedback && (
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                                Feedback
                            </p>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                {result.feedback}
                            </p>
                        </div>
                    )}

                    {/* Detected weak topics */}
                    {weakTopics.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                                Areas to Improve
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {weakTopics.map((t) => (
                                    <span
                                        key={t}
                                        className="text-xs px-2 py-0.5 bg-amber-950/40 text-amber-500 rounded-lg font-medium border border-amber-900/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Updated skill scores */}
                    {result.updatedSkillScores && Object.keys(result.updatedSkillScores).length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                                Skill Update
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(result.updatedSkillScores).map(([domain, score]) => (
                                    <span
                                        key={domain}
                                        className="text-xs px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-900/50 shadow-[0_0_10px_rgba(59,130,246,0.1)] rounded-lg font-medium"
                                    >
                                        {domain}: {Math.round(score)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
