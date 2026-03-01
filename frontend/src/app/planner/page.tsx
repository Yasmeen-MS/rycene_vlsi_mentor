"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { firestore as db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { callGenerateStudyPlan } from "@/lib/functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, Target, Clock, CheckCircle2, ChevronRight, BookOpen, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── TYPES ──────────────────────────────────────────────────────────────

interface RoadmapDay {
    day: number;
    focus: string;
    tasks: string[];
    revision: boolean;
    completed?: boolean;
}

interface StudyPlanDoc {
    userId: string;
    targetRole: string;
    interviewDate: string;
    hoursPerDay: number;
    roadmap: RoadmapDay[];
    daysRemaining: number;
    generatedAt: any;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function PlannerPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <StudyPlanner />
            </AppLayout>
        </ProtectedRoute>
    );
}

function StudyPlanner() {
    const [plan, setPlan] = useState<StudyPlanDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Generation Inputs
    const [targetRole, setTargetRole] = useState("VLSI Verification Engineer");
    const [interviewDate, setInterviewDate] = useState("");
    const [hoursPerDay, setHoursPerDay] = useState<number>(3);

    // ─── INIT ───────────────────────────────────────────────────────────────

    // Set default date to 14 days from now
    useEffect(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        setInterviewDate(d.toISOString().split('T')[0]);
    }, []);

    // Load Plan from Firestore
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, "studyPlans", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                setPlan(docSnap.data() as StudyPlanDoc);
            } else {
                setPlan(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ─── ACTIONS ────────────────────────────────────────────────────────────

    const handleGenerate = async () => {
        const user = auth.currentUser;
        if (!user || generating) return;

        if (plan) {
            const confirm = window.confirm("Are you sure you want to regenerate? This will overwrite your existing plan and progress.");
            if (!confirm) return;
        }

        setGenerating(true);

        const { data, error } = await callGenerateStudyPlan({
            targetRole,
            interviewDate,
            hoursPerDay
        });

        if (error) {
            console.error("Failed to generate plan:", error);
            alert("Failed to generate plan: " + error);
        }

        // Success relies on the onSnapshot listener picking up the Firestore write from the backend!
        setGenerating(false);
    };

    const toggleDayCompletion = async (dayIndex: number) => {
        const user = auth.currentUser;
        if (!user || !plan) return;

        // Optimistic UI update could go here, but since onSnapshot is fast, 
        // we'll let Firestore sync handle it.
        const updatedRoadmap = [...plan.roadmap];
        updatedRoadmap[dayIndex].completed = !updatedRoadmap[dayIndex].completed;

        try {
            await updateDoc(doc(db, "studyPlans", user.uid), {
                roadmap: updatedRoadmap
            });
        } catch (error) {
            console.error("Error updating completion status:", error);
        }
    };

    // ─── RENDER INFO ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    // ─── RENDER EMPTY STATE ─────────────────────────────────────────────────

    if (!plan && !loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 pt-10">
                <div className="text-center space-y-2 mb-10">
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
                        <BookOpen size={28} className="text-indigo-400" />
                        AI Study Planner
                    </h1>
                    <p className="text-zinc-400">Generate a personalized 14-day roadmap based on your target role and weaknesses.</p>
                </div>

                <Card className="rounded-3xl border border-white/5 shadow-2xl bg-zinc-950/70 backdrop-blur-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-sm font-bold text-zinc-300 uppercase tracking-widest text-center">
                            Configure Your Roadmap
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Target Role</label>
                                <Input
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    placeholder="e.g., RTL Design Engineer"
                                    className="h-12 bg-black/40 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Interview Date</label>
                                    <Input
                                        type="date"
                                        value={interviewDate}
                                        onChange={(e) => setInterviewDate(e.target.value)}
                                        className="h-12 bg-black/40 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500 [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Hours Per Day</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={16}
                                        value={hoursPerDay}
                                        onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                                        className="h-12 bg-black/40 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={generating || !targetRole || !interviewDate}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium shadow-lg transition-all"
                        >
                            {generating ? <><Loader2 size={16} className="animate-spin mr-2" /> Generating AI Plan...</> : "Generate 14-Day Plan"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── RENDER ROADMAP STATE ───────────────────────────────────────────────

    const completedDays = plan!.roadmap.filter(d => d.completed).length;
    const progressPercent = Math.round((completedDays / plan!.roadmap.length) * 100);

    return (
        <div className="space-y-8 pb-12 mt-4 max-w-5xl mx-auto">

            {/* ── HEADER & PROGRESS ── */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <BookOpen size={28} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        14-Day Study Plan
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <Target size={14} className="text-indigo-400" />
                            {plan?.targetRole}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-zinc-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <Calendar size={14} className="text-emerald-400" />
                            {new Date(plan?.interviewDate || "").toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="text-zinc-400 hover:text-white hover:bg-white/10 h-8 px-3 rounded-lg text-xs"
                    >
                        {generating ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <RotateCw size={12} className="mr-1.5" />}
                        Regenerate Plan
                    </Button>
                    <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-6 shadow-xl min-w-[300px]">
                        <div className="flex-1 space-y-2.5">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-zinc-300">Progress</span>
                                <span className="text-indigo-400">{progressPercent}%</span>
                            </div>
                            <div className="h-2 bg-black/60 rounded-full border border-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white leading-none">{completedDays}<span className="text-zinc-500 text-sm">/14</span></p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Days Done</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ROADMAP TIMELINE ── */}
            <div className="relative space-y-6">
                {/* Connecting Line */}
                <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-indigo-500/50 via-purple-500/20 to-transparent hidden md:block" />

                <div className="grid gap-6">
                    {plan?.roadmap.map((day, idx) => (
                        <div key={day.day} className="relative flex flex-col md:flex-row gap-6 md:items-start group">

                            {/* Marker Node */}
                            <div className="hidden md:flex flex-shrink-0 w-12 pt-2 items-center justify-center relative z-10">
                                <button
                                    onClick={() => toggleDayCompletion(idx)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110",
                                        day.completed
                                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                            : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-indigo-500/50 hover:bg-indigo-500/10"
                                    )}
                                >
                                    {day.completed ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{day.day}</span>}
                                </button>
                            </div>

                            {/* Card content */}
                            <Card className={cn(
                                "flex-1 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl",
                                day.completed
                                    ? "bg-black/40 border-emerald-500/20 opacity-80"
                                    : "bg-zinc-950/80 border-white/10 hover:border-white/20 shadow-xl"
                            )}>
                                <div className={cn(
                                    "absolute top-0 left-0 w-1 h-full",
                                    day.completed ? "bg-emerald-500" : day.revision ? "bg-amber-500" : "bg-indigo-500"
                                )} />

                                <CardContent className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white">Day {day.day}</h3>
                                                {day.revision && (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                                        Revision Day
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-indigo-300">
                                                Focus: <span className="text-zinc-300">{day.focus}</span>
                                            </p>
                                        </div>

                                        {/* Mobile completion toggle */}
                                        <div className="md:hidden">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleDayCompletion(idx)}
                                                className={cn(
                                                    "w-full rounded-xl border transition-colors",
                                                    day.completed
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                                                )}
                                            >
                                                {day.completed ? <><CheckCircle2 size={14} className="mr-2" /> Completed</> : "Mark as Done"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Tasks for today</h4>
                                        <ul className="space-y-3">
                                            {day.tasks.map((task, tIdx) => (
                                                <li key={tIdx} className="flex gap-3 text-sm text-zinc-300">
                                                    <ChevronRight size={16} className={cn("shrink-0 mt-0.5", day.completed ? "text-emerald-500/50" : "text-indigo-500/50")} />
                                                    <span className={cn("leading-relaxed", day.completed && "text-zinc-500 line-through")}>{task}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
