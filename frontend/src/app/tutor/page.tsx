"use client";

import React, { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { firestore as db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot } from "firebase/firestore";
import { callGetTutorResponse, TutorResponse } from "@/lib/functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Plus, Brain, MessageSquare, Lightbulb, GraduationCap, Code2, Building2, ChevronDown, ChevronRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── TYPES ──────────────────────────────────────────────────────────────

interface ChatMessage {
    role: "user" | "assistant";
    content: string | TutorResponse;
    timestamp?: any;
}

interface ChatSession {
    id: string;
    title: string;
    createdAt: any;
    messages: ChatMessage[];
}

export default function TutorPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <TutorChatbot />
            </AppLayout>
        </ProtectedRoute>
    );
}

function TutorChatbot() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ─── LOAD SESSIONS ON MOUNT ─────────────────────────────────────────
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, "chatSessions"),
            where("userId", "==", user.uid),
            orderBy("lastMessageAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatSession[];

            setSessions(loadedSessions);

            // If we are currently active on a session, sync its messages seamlessly
            if (currentSessionId) {
                const active = loadedSessions.find(s => s.id === currentSessionId);
                if (active) {
                    setMessages(active.messages || []);
                }
            }
        });

        return () => unsubscribe();
    }, [currentSessionId]);

    // ─── AUTO SCROLL ────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // ─── SWITCH SESSION ─────────────────────────────────────────────────
    const handleSelectSession = (id: string) => {
        setCurrentSessionId(id);
        const session = sessions.find(s => s.id === id);
        if (session) {
            setMessages(session.messages || []);
        }
    };

    // ─── NEW SESSION ────────────────────────────────────────────────────
    const handleNewSession = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const now = Timestamp.now();
            const docRef = await addDoc(collection(db, "chatSessions"), {
                userId: user.uid,
                title: "New Session",
                messages: [],
                createdAt: now,
                lastMessageAt: now
            });
            setCurrentSessionId(docRef.id);
            setMessages([]);
        } catch (error) {
            console.error("Error creating session:", error);
        }
    };

    // ─── ASK QUESTION ───────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text || loading) return;

        const user = auth.currentUser;
        if (!user) return;

        // 1. Append user message locally
        const newUserMsg: ChatMessage = { role: "user", content: text, timestamp: Timestamp.now() };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText("");
        setLoading(true);

        // 2. Identify session or wait for backend to create one, but prompt says "Create docs... set title to first question".
        // Let's create session instantly if we don't have one
        let sessionId = currentSessionId;
        if (!sessionId) {
            const now = Timestamp.now();
            const docRef = await addDoc(collection(db, "chatSessions"), {
                userId: user.uid,
                title: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
                messages: [newUserMsg],
                createdAt: now,
                lastMessageAt: now
            });
            sessionId = docRef.id;
            setCurrentSessionId(sessionId);
        } else {
            // Check if it's the first message to update the title
            const session = sessions.find(s => s.id === sessionId);
            if (session && session.title === "New Session") {
                await updateDoc(doc(db, "chatSessions", sessionId), {
                    title: text.substring(0, 30) + (text.length > 30 ? "..." : "")
                });
            }
        }

        // 3. Prepare History for Gemini (last 5 messages)
        const historyContext = messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
        }));

        // 4. Call Backend
        const { data, error } = await callGetTutorResponse({
            question: text,
            sessionId: sessionId,
            history: historyContext
        });

        setLoading(false);

        // 5. Handle Error
        if (error || !data) {
            const errorMsg: ChatMessage = {
                role: "assistant",
                content: {
                    concept: "Unable to generate explanation. Please retry.",
                    analogy: "",
                    industryContext: "",
                    example: "",
                    miniQuiz: "",
                    hint: ""
                },
                timestamp: Timestamp.now()
            };
            setMessages(prev => [...prev, errorMsg]);

            // Revert or log error
            return;
        }

        // The backend `getTutorResponse` automatically updates Firestore using `arrayUnion`,
        // which triggers the `onSnapshot` listener to sync `messages` perfectly without duplicate local writes.
        // We just ensure the current session ID matches the resolved one.
        if (data.sessionId && data.sessionId !== sessionId) {
            setCurrentSessionId(data.sessionId);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">

            {/* ── LEFT SIDEBAR: SESSIONS (3 cols) ── */}
            <div className="col-span-3 h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">AI Tutor</h1>
                        <p className="text-xs text-zinc-400 mt-1">Chat history</p>
                    </div>
                </div>

                <Button
                    onClick={handleNewSession}
                    className="w-full justify-start gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all"
                >
                    <Plus size={16} />
                    New Session
                </Button>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {sessions.map(session => (
                        <button
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 border",
                                currentSessionId === session.id
                                    ? "bg-zinc-900/80 border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                    : "bg-transparent border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                            )}
                        >
                            <span className="truncate block font-medium w-full">{session.title}</span>
                            <span className="text-[10px] text-zinc-600 mt-1 block">
                                {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </span>
                        </button>
                    ))}
                    {sessions.length === 0 && (
                        <p className="text-xs text-zinc-500 text-center mt-6">No previous sessions</p>
                    )}
                </div>
            </div>

            {/* ── RIGHT MAIN: CHAT AREA (9 cols) ── */}
            <div className="col-span-9 h-full">
                <Card className="rounded-3xl border border-white/5 shadow-2xl bg-zinc-950/70 backdrop-blur-2xl flex flex-col h-full overflow-hidden relative">

                    {/* Chat Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-10">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                                    <Brain className="text-indigo-400" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">How can I help you learn VLSI?</h3>
                                <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                                    Ask me to explain concepts line CDC, setup/hold time violations, arbitrary Verilog syntax, or even request an analogy for complex architecture.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <ChatMessageBubble key={i} message={msg} />
                            ))
                        )}

                        {loading && (
                            <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 mr-auto max-w-[80%] items-center">
                                <Loader2 size={16} className="text-indigo-400 animate-spin" />
                                <span className="text-sm text-zinc-400 animate-pulse">AI is thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </CardContent>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/5 bg-black/40">
                        <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Enter a VLSI concept (e.g., Explain Setup Time)..."
                                    disabled={loading}
                                    className="w-full bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 rounded-2xl pl-5 pr-12 py-6 text-sm focus-visible:ring-1 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={!inputText.trim() || loading}
                                className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-0"
                            >
                                <Send size={18} />
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>

        </div>
    );
}

// ─── CHAT BUBBLE COMPONENT ──────────────────────────────────────────────────

function ChatMessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    if (isUser) {
        return (
            <div className="flex justify-end">
                <div className="px-5 py-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 text-zinc-200 text-sm max-w-[80%] shadow-lg leading-relaxed">
                    {typeof message.content === "string" ? message.content : "..."}
                </div>
            </div>
        );
    }

    // Assistant Response Structure
    const m = message.content as TutorResponse;

    return (
        <div className="flex gap-4 max-w-[90%]">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mt-1">
                <Brain size={16} className="text-indigo-400" />
            </div>

            <div className="space-y-4 flex-1">
                {/* Concept */}
                {m.concept && (
                    <div className="text-zinc-200 text-sm leading-relaxed p-4 rounded-b-2xl rounded-tr-2xl bg-white/[0.03] border border-white/5">
                        {m.concept}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {/* Analogy */}
                    {m.analogy && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-orange-500/10">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">
                                <Lightbulb size={14} /> Analogy
                            </h4>
                            <p className="text-sm text-zinc-300 leading-relaxed">{m.analogy}</p>
                        </div>
                    )}

                    {/* Industry Context */}
                    {m.industryContext && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
                                <Building2 size={14} /> Industry Context
                            </h4>
                            <p className="text-sm text-zinc-300 leading-relaxed">{m.industryContext}</p>
                        </div>
                    )}
                </div>

                {/* Example */}
                {m.example && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                            <Code2 size={14} /> Example Scenario
                        </h4>
                        <div className="text-sm text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
                            {m.example}
                        </div>
                    </div>
                )}

                {/* Mini Quiz & Hint */}
                {m.miniQuiz && (
                    <QuizFeature quiz={m.miniQuiz} hint={m.hint} />
                )}
            </div>
        </div>
    );
}

// ─── QUIZ COLLAPSIBLE HELPER ────────────────────────────────────────────────

function QuizFeature({ quiz, hint }: { quiz: string, hint?: string }) {
    const [showHint, setShowHint] = useState(false);

    return (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-transparent border-l-2 border-purple-500">
            <h4 className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">
                <Target size={14} /> Knowledge Check
            </h4>
            <p className="text-sm text-zinc-300 font-medium leading-relaxed mb-3">
                {quiz}
            </p>

            {hint && (
                <div>
                    <button
                        onClick={() => setShowHint(!showHint)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-400/70 hover:text-purple-400 transition-colors"
                    >
                        {showHint ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {showHint ? "Hide Hint" : "Show Hint"}
                    </button>
                    {showHint && (
                        <div className="mt-2 text-sm text-zinc-500 italic pl-5 border-l border-white/10">
                            {hint}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
