"use client";

import { useState, useEffect, useMemo } from "react";
import { Target, AlertTriangle, Calendar, Send, ChevronDown, ChevronUp, Loader2, Download } from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import SkillRadar from "@/components/charts/SkillRadar";
import ScoreTrend from "@/components/charts/ScoreTrend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserData } from "@/lib/useUserData";
import { callGenerateStudyPlan, callGetTutorResponse, TutorResponse } from "@/lib/functions";

// ─── Utilities ────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200): number {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (target === 0) { setCount(0); return; }
        let current = 0;
        const steps = 60;
        const increment = target / steps;
        const interval = duration / steps;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else { setCount(Math.round(current)); }
        }, interval);
        return () => clearInterval(timer);
    }, [target, duration]);
    return count;
}

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

const DOMAIN_LABELS: Record<string, string> = {
    rtl: "RTL Design", digital: "Digital Logic", sta: "Static Timing",
    physical: "Physical Design", dft: "DFT", scripting: "Scripting",
};

// ─── Dashboard Content ────────────────────────────────────────────────────────

function DashboardContent() {
    const { userData, studyPlan, recentEvals, loading } = useUserData();

    const displayReadiness = useCountUp(userData?.readinessScore ?? 0);

    const daysRemaining = useMemo(() => {
        const dateStr = studyPlan?.interviewDate;
        if (!dateStr) return null;
        return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
    }, [studyPlan?.interviewDate]);

    const radarData = useMemo(() => [
        { domain: "RTL", score: userData?.skillScores.rtl ?? 0 },
        { domain: "Digital", score: userData?.skillScores.digital ?? 0 },
        { domain: "STA", score: userData?.skillScores.sta ?? 0 },
        { domain: "Physical", score: userData?.skillScores.physical ?? 0 },
        { domain: "DFT", score: userData?.skillScores.dft ?? 0 },
        { domain: "Scripting", score: userData?.skillScores.scripting ?? 0 },
    ], [userData?.skillScores]);

    const trendData = useMemo(() =>
        [...recentEvals].reverse().map((e, i) => ({ label: `#${i + 1}`, score: Math.round(e.overallScore) })),
        [recentEvals]);

    // ── Study plan form state ──────────────────────────────────────────────────
    const defaultDate = useMemo(() => {
        const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split("T")[0];
    }, []);

    const [planForm, setPlanForm] = useState({ targetRole: "RTL Design Engineer", interviewDate: defaultDate, hoursPerDay: 4 });
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState<string | null>(null);
    const [planExpanded, setPlanExpanded] = useState(false);
    const [showRegenForm, setShowRegenForm] = useState(false);

    const handleGeneratePlan = async () => {
        setGenerating(true); setGenError(null);
        const { error } = await callGenerateStudyPlan({ targetRole: planForm.targetRole, interviewDate: planForm.interviewDate, hoursPerDay: planForm.hoursPerDay });
        if (error) setGenError(error);
        setGenerating(false);
        setShowRegenForm(false);
    };

    const handleDownloadPDF = () => {
        if (!studyPlan) return;
        const role = studyPlan.targetRole ?? "VLSI Engineer";
        const date = studyPlan.interviewDate
            ? new Date(studyPlan.interviewDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
            : "TBD";

        const daysHtml = studyPlan.roadmap.map((day) => `
            <div class="day-card ${day.revision ? "revision" : ""}">
                <div class="day-header">
                    <span class="day-badge ${day.revision ? "rev-badge" : "new-badge"}">
                        Day ${day.day} · ${day.revision ? "Revision" : "New Material"}
                    </span>
                </div>
                <p class="day-focus">${day.focus}</p>
                <ul class="task-list">
                    ${day.tasks.map((t) => `<li>${t}</li>`).join("")}
                </ul>
            </div>`).join("");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Rycene AI — Study Plan</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 32px; }
        .cover { text-align: center; padding: 40px 0 32px; border-bottom: 2px solid #e5e7eb; margin-bottom: 32px; }
        .cover h1 { font-size: 24px; font-weight: 700; color: #1e3a5f; }
        .cover .meta { margin-top: 12px; display: flex; justify-content: center; gap: 24px; font-size: 13px; color: #6b7280; }
        .cover .meta span { background: #f3f4f6; padding: 4px 12px; border-radius: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .day-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; page-break-inside: avoid; }
        .day-card.revision { border-color: #ddd6fe; background: #faf5ff; }
        .day-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 6px; display: inline-block; margin-bottom: 8px; }
        .new-badge { background: #eff6ff; color: #1d4ed8; }
        .rev-badge { background: #f3e8ff; color: #7c3aed; }
        .day-focus { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 8px; }
        .task-list { list-style: none; padding: 0; }
        .task-list li { font-size: 11.5px; color: #6b7280; padding: 2px 0; padding-left: 10px; position: relative; }
        .task-list li::before { content: "·"; position: absolute; left: 0; color: #9ca3af; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
        @page { margin: 20mm; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <div class="cover">
        <h1>🎯 Rycene VLSI — 14-Day Study Plan</h1>
        <div class="meta">
            <span>Role: ${role}</span>
            <span>Interview: ${date}</span>
            <span>${studyPlan.roadmap.length} Days</span>
        </div>
    </div>
    <div class="grid">${daysHtml}</div>
    <div class="footer">Generated by Rycene AI · VLSI Mentor Platform</div>
    <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

        const win = window.open("", "_blank");
        if (win) { win.document.write(html); win.document.close(); }
    };

    // ── Tutor state ────────────────────────────────────────────────────────────
    const [tutorQ, setTutorQ] = useState("");
    const [tutorLoading, setTutorLoading] = useState(false);
    const [tutorResponse, setTutorResponse] = useState<TutorResponse | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleTutorAsk = async () => {
        const q = tutorQ.trim(); if (!q) return;
        setTutorLoading(true); setTutorResponse(null);
        const { data } = await callGetTutorResponse({ question: q });
        if (data) { setTutorResponse(data.response); setExpanded(true); }
        setTutorLoading(false);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-3 gap-6">
                    <Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" />
                </div>
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-5"><Skeleton className="h-80" /></div>
                    <div className="col-span-7"><Skeleton className="h-80" /></div>
                    <div className="col-span-12"><Skeleton className="h-60" /></div>
                    <div className="col-span-12"><Skeleton className="h-24" /></div>
                </div>
            </div>
        );
    }

    const weakTopics = userData?.weakTopics ?? [];

    return (
        <div className="space-y-6 relative rounded-3xl p-6 overflow-hidden">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                <p className="text-sm text-zinc-400 mt-0.5">Your VLSI readiness overview</p>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-3 gap-6">

                <Card
                    className="rounded-3xl border shadow-2xl backdrop-blur-2xl relative overflow-hidden"
                    style={{
                        background: "radial-gradient(120% 100% at 50% 0%, rgba(249,115,22,0.15) 0%, rgba(9,9,11,0.9) 100%)",
                        borderColor: "rgba(249,115,22,0.3)" // orange-500
                    }}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Target size={15} className="text-orange-500" />
                            <span className="text-sm font-medium text-zinc-300">Industry Readiness</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{displayReadiness}</span>
                            <span className="text-lg text-zinc-500 mb-1">/ 100</span>
                        </div>
                        <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(displayReadiness, 100)}%` }} />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="rounded-3xl border shadow-2xl backdrop-blur-2xl relative overflow-hidden"
                    style={{
                        background: "radial-gradient(120% 100% at 50% 0%, rgba(239,68,68,0.12) 0%, rgba(9,9,11,0.9) 100%)",
                        borderColor: "rgba(239,68,68,0.25)" // red-500
                    }}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={15} className="text-red-500" />
                            <span className="text-sm font-medium text-zinc-300">Weak Domains</span>
                        </div>
                        {weakTopics.length === 0 ? (
                            <p className="text-sm text-zinc-500 mt-2">{userData ? "No weak topics — great job!" : "Complete an evaluation to start"}</p>
                        ) : (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {weakTopics.slice(0, 3).map((t) => (
                                    <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                        {DOMAIN_LABELS[t] ?? t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card
                    className="rounded-3xl border shadow-2xl backdrop-blur-2xl relative overflow-hidden"
                    style={{
                        background: "radial-gradient(120% 100% at 50% 0%, rgba(245,158,11,0.12) 0%, rgba(9,9,11,0.9) 100%)",
                        borderColor: "rgba(245,158,11,0.25)" // amber-500
                    }}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar size={15} className="text-amber-500" />
                            <span className="text-sm font-medium text-zinc-300">Interview Countdown</span>
                        </div>
                        {daysRemaining !== null ? (
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-white shadow-[0_0_15px_rgba(251,191,36,0.2)]">{daysRemaining}</span>
                                <span className="text-sm text-zinc-500 mb-1">days remaining</span>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500 mt-2">Set an interview date in Study Plan</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Charts + Plan + Tutor ── */}
            <div className="grid grid-cols-12 gap-6">

                {/* Skill Radar */}
                <div className="col-span-4">
                    <Card
                        className="rounded-3xl border shadow-2xl backdrop-blur-2xl h-full overflow-hidden relative"
                        style={{
                            background: "radial-gradient(120% 100% at 50% 0%, rgba(236,72,153,0.1) 0%, rgba(9,9,11,0.95) 100%)",
                            borderColor: "rgba(236,72,153,0.2)" // pink-500
                        }}
                    >
                        <CardHeader className="pb-0 pt-5 px-6">
                            <CardTitle className="text-sm font-bold text-white uppercase tracking-widest leading-loose">Skill Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="px-2">
                            <SkillRadar data={radarData} />
                        </CardContent>
                    </Card>
                </div>

                {/* Score Trend */}
                <div className="col-span-8">
                    <Card
                        className="rounded-3xl border shadow-2xl backdrop-blur-2xl h-full overflow-hidden relative"
                        style={{
                            background: "radial-gradient(120% 100% at 50% 0%, rgba(139,92,246,0.1) 0%, rgba(9,9,11,0.95) 100%)",
                            borderColor: "rgba(139,92,246,0.2)" // violet-500
                        }}
                    >
                        <CardHeader className="pb-0 pt-5 px-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold text-white uppercase tracking-widest leading-loose">Score Trend</CardTitle>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">Live</span>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2">
                            <ScoreTrend data={trendData} />
                        </CardContent>
                    </Card>
                </div>

                {/* ── Study Plan ── */}
                <div className="col-span-12">
                    <Card className="rounded-3xl border border-white/5 shadow-2xl bg-zinc-950/70 backdrop-blur-2xl">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-white">Study Plan</CardTitle>
                                {studyPlan && (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={handleDownloadPDF}
                                            className="text-xs text-zinc-400 hover:text-orange-400 hover:bg-orange-950/30 rounded-xl h-7 gap-1.5"
                                        >
                                            <Download size={12} />PDF
                                        </Button>
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => setShowRegenForm((v) => !v)}
                                            className="text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-7"
                                        >
                                            {showRegenForm ? "Cancel" : "Regenerate"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {studyPlan ? (
                                <div className="space-y-4">

                                    {/* Plan summary badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {studyPlan.targetRole && (
                                            <span className="text-xs px-2.5 py-1 bg-orange-950/40 text-orange-400 border border-orange-900/50 rounded-lg font-medium shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                                {studyPlan.targetRole}
                                            </span>
                                        )}
                                        {studyPlan.interviewDate && (
                                            <span className="text-xs px-2.5 py-1 bg-zinc-900/50 text-zinc-400 border border-zinc-800 rounded-lg">
                                                Interview: {new Date(studyPlan.interviewDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        )}
                                        <span className="text-xs px-2.5 py-1 bg-amber-950/40 text-amber-500 border border-amber-900/50 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                            {studyPlan.roadmap.length} days
                                        </span>
                                    </div>

                                    {/* Inline regenerate form */}
                                    {showRegenForm && (
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-gray-600">Target Role</label>
                                                    <Input value={planForm.targetRole} onChange={(e) => setPlanForm((p) => ({ ...p, targetRole: e.target.value }))} className="text-xs rounded-xl h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-gray-600">Interview Date</label>
                                                    <Input type="date" value={planForm.interviewDate} onChange={(e) => setPlanForm((p) => ({ ...p, interviewDate: e.target.value }))} className="text-xs rounded-xl h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-gray-600">Hours / Day</label>
                                                    <Input type="number" min={1} max={16} value={planForm.hoursPerDay} onChange={(e) => setPlanForm((p) => ({ ...p, hoursPerDay: parseInt(e.target.value) || 4 }))} className="text-xs rounded-xl h-8" />
                                                </div>
                                            </div>
                                            <Button onClick={handleGeneratePlan} disabled={generating} size="sm" className="rounded-xl h-7 text-xs">
                                                {generating ? <><Loader2 size={11} className="mr-1.5 animate-spin" />Generating…</> : "Generate New Plan"}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Day cards — 4 visible by default, expand to see all */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {studyPlan.roadmap.slice(0, planExpanded ? studyPlan.roadmap.length : 4).map((day) => (
                                            <div key={day.day} className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 backdrop-blur-md">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`w-2 h-2 rounded-full ${day.revision ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"}`} />
                                                    <span className={`text-xs font-semibold tracking-wide uppercase ${day.revision ? "text-red-400" : "text-orange-400"}`}>
                                                        Day {day.day} · {day.revision ? "Revision" : "New Material"}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-white mb-2">{day.focus}</p>
                                                <ul className="space-y-1">
                                                    {day.tasks.map((task, i) => (
                                                        <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                                                            <span className="text-orange-500 shrink-0">·</span>
                                                            <span>{task}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Expand / Collapse */}
                                    {studyPlan.roadmap.length > 4 && (
                                        <button
                                            onClick={() => setPlanExpanded((v) => !v)}
                                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            {planExpanded
                                                ? <><ChevronUp size={13} />Show less</>
                                                : <><ChevronDown size={13} />View all {studyPlan.roadmap.length} days</>}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                /* No plan yet — generate form */
                                <div className="space-y-4">
                                    <p className="text-sm text-zinc-400">Generate a personalised 14-day VLSI study roadmap targeted to your weak areas.</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-500">Target Role</label>
                                            <Input value={planForm.targetRole} onChange={(e) => setPlanForm((p) => ({ ...p, targetRole: e.target.value }))} className="text-sm rounded-xl bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500" placeholder="RTL Design Engineer" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-500">Interview Date</label>
                                            <Input type="date" value={planForm.interviewDate} onChange={(e) => setPlanForm((p) => ({ ...p, interviewDate: e.target.value }))} className="text-sm rounded-xl bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-500">Hours / Day</label>
                                            <Input type="number" min={1} max={16} value={planForm.hoursPerDay} onChange={(e) => setPlanForm((p) => ({ ...p, hoursPerDay: parseInt(e.target.value) || 4 }))} className="text-sm rounded-xl bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500" />
                                        </div>
                                    </div>
                                    {genError && <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-3 py-2">{genError}</p>}
                                    <Button onClick={handleGeneratePlan} disabled={generating} size="sm" className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black border-0 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                        {generating ? <><Loader2 size={13} className="mr-2 animate-spin text-black" />Generating…</> : "Generate Study Plan"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Quick Tutor ── */}
                <div className="col-span-12">
                    <Card className="rounded-3xl border border-white/5 shadow-2xl bg-zinc-950/70 backdrop-blur-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-white">Quick Tutor</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Ask a VLSI concept… e.g. What is metastability?"
                                    value={tutorQ}
                                    onChange={(e) => setTutorQ(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleTutorAsk(); }}
                                    className="rounded-xl bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500"
                                />
                                <Button onClick={handleTutorAsk} disabled={tutorLoading || !tutorQ.trim()} size="sm" className="rounded-xl shrink-0 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black border-0 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                    {tutorLoading ? <Loader2 size={14} className="animate-spin text-black" /> : <Send size={14} className="text-black" />}
                                </Button>
                            </div>

                            {tutorResponse && (
                                <div className="border border-white/10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                    <button
                                        onClick={() => setExpanded((e) => !e)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-950/60 backdrop-blur-md text-sm font-medium text-zinc-300 hover:bg-zinc-900/80 transition-colors border-b border-white/5"
                                    >
                                        <span>AI Response</span>
                                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </button>
                                    {expanded && (
                                        <div className="p-5 space-y-4 divide-y divide-white/5 bg-zinc-950/40 backdrop-blur-md">
                                            {([
                                                { key: "concept", label: "Concept" },
                                                { key: "analogy", label: "Analogy" },
                                                { key: "example", label: "Example" },
                                                { key: "miniQuiz", label: "Mini Quiz" },
                                            ] as const).map(({ key, label }) => (
                                                <div key={key} className="pt-4 first:pt-0">
                                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{label}</span>
                                                    <p className="text-sm text-zinc-300 mt-1.5 leading-relaxed">{tutorResponse[key]}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <DashboardContent />
            </AppLayout>
        </ProtectedRoute>
    );
}
