"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type Mode = "login" | "register";

function BackgroundLogicGates() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50" style={{ perspective: "1000px" }}>
            {/* SVG Definitions for Metallic Steel Finish */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="steel-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4a423e" />
                        <stop offset="20%" stopColor="#a38779" />
                        <stop offset="50%" stopColor="#2e2622" />
                        <stop offset="80%" stopColor="#c27e5d" />
                        <stop offset="100%" stopColor="#1a1513" />
                    </linearGradient>
                    <linearGradient id="steel-amber" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#524a3e" />
                        <stop offset="25%" stopColor="#9e8a6e" />
                        <stop offset="50%" stopColor="#2e2922" />
                        <stop offset="75%" stopColor="#c2945d" />
                        <stop offset="100%" stopColor="#1f1b16" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Floating AND Gate */}
            <motion.div
                animate={{ y: [-30, 30, -30], rotateX: [10, 40, 10], rotateY: [-20, 20, -20], rotateZ: [5, 15, 5] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[15%] left-[10%] w-48 h-48 drop-shadow-[0_20px_30px_rgba(249,115,22,0.3)]"
                style={{ transformStyle: "preserve-3d" }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
                    <path d="M 20 20 L 50 20 A 30 30 0 0 1 50 80 L 20 80 Z" fill="url(#steel-orange)" stroke="#f97316" strokeWidth="1" strokeOpacity="0.5" />
                    <line x1="0" y1="35" x2="20" y2="35" stroke="url(#steel-orange)" strokeWidth="4" />
                    <line x1="0" y1="65" x2="20" y2="65" stroke="url(#steel-orange)" strokeWidth="4" />
                    <line x1="80" y1="50" x2="100" y2="50" stroke="url(#steel-orange)" strokeWidth="4" />
                </svg>
            </motion.div>

            {/* Floating OR Gate */}
            <motion.div
                animate={{ y: [40, -40, 40], rotateX: [-15, 30, -15], rotateY: [30, -10, 30], rotateZ: [-15, -5, -15] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-[20%] right-[10%] w-56 h-56 drop-shadow-[0_25px_40px_rgba(245,158,11,0.25)]"
                style={{ transformStyle: "preserve-3d" }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
                    <path d="M 20 20 Q 35 50 20 80 Q 70 80 80 50 Q 70 20 20 20" fill="url(#steel-amber)" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
                    <line x1="0" y1="35" x2="24" y2="35" stroke="url(#steel-amber)" strokeWidth="4" />
                    <line x1="0" y1="65" x2="24" y2="65" stroke="url(#steel-amber)" strokeWidth="4" />
                    <line x1="80" y1="50" x2="100" y2="50" stroke="url(#steel-amber)" strokeWidth="4" />
                </svg>
            </motion.div>

            {/* Floating XOR Gate */}
            <motion.div
                animate={{ x: [-30, 30, -30], y: [-20, 20, -20], rotateX: [30, -30, 30], rotateY: [-40, 40, -40], rotateZ: [30, 60, 30] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                className="absolute bottom-[20%] left-[20%] w-40 h-40 drop-shadow-[0_15px_30px_rgba(251,146,60,0.2)]"
                style={{ transformStyle: "preserve-3d" }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-70">
                    <path d="M 10 20 Q 25 50 10 80" fill="none" stroke="url(#steel-orange)" strokeWidth="3" />
                    <path d="M 20 20 Q 35 50 20 80 Q 70 80 80 50 Q 70 20 20 20" fill="url(#steel-orange)" stroke="#fb923c" strokeWidth="1" strokeOpacity="0.5" />
                    <line x1="0" y1="35" x2="14" y2="35" stroke="url(#steel-orange)" strokeWidth="4" />
                    <line x1="0" y1="65" x2="14" y2="65" stroke="url(#steel-orange)" strokeWidth="4" />
                    <line x1="80" y1="50" x2="100" y2="50" stroke="url(#steel-orange)" strokeWidth="4" />
                </svg>
            </motion.div>

            {/* Floating NAND Gate */}
            <motion.div
                animate={{ x: [40, -40, 40], rotateX: [-40, 10, -40], rotateY: [20, -30, 20], rotateZ: [-20, -5, -20] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[13%] right-[18%] w-44 h-44 drop-shadow-[0_20px_35px_rgba(217,119,6,0.25)]"
                style={{ transformStyle: "preserve-3d" }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
                    <path d="M 20 20 L 50 20 A 30 30 0 0 1 50 80 L 20 80 Z" fill="url(#steel-amber)" stroke="#d97706" strokeWidth="1" strokeOpacity="0.5" />
                    <circle cx="85" cy="50" r="5" fill="url(#steel-amber)" stroke="#d97706" strokeWidth="1.5" />
                    <line x1="0" y1="35" x2="20" y2="35" stroke="url(#steel-amber)" strokeWidth="4" />
                    <line x1="0" y1="65" x2="20" y2="65" stroke="url(#steel-amber)" strokeWidth="4" />
                    <line x1="90" y1="50" x2="100" y2="50" stroke="url(#steel-amber)" strokeWidth="4" />
                </svg>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    const router = useRouter();

    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const toggleMode = () => {
        setMode((m) => (m === "login" ? "register" : "login"));
        setError(null);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === "login") {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push("/dashboard");
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                        .replace("Firebase: ", "")
                        .replace(/ \(auth\/.*?\)\.?/, "")
                        .trim()
                    : "An unexpected error occurred.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black font-sans">
            {/* Ambient orange glow behind the card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-900/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Hardware logic gates floating background */}
            <BackgroundLogicGates />

            <div className="w-full max-w-md relative z-10 px-4">
                {/* Brand */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 12 }}
                        className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-5 shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                    >
                        <span className="text-3xl">🧠</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-2xl font-bold text-white tracking-wide"
                    >
                        Rycene AI
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-sm text-zinc-400 mt-1 font-medium"
                    >
                        VLSI Mentor Platform
                    </motion.p>
                </div>

                {/* Card with spinning orange conic-gradient border */}
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
                    className="relative rounded-3xl p-[1.5px] overflow-hidden shadow-[0_0_60px_rgba(249,115,22,0.12)]"
                >
                    {/* Rotating gradient border */}
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_70%,#f97316_85%,#fbbf24_100%)] animate-[spin_4s_linear_infinite]" />

                    <Card className="relative z-10 rounded-[calc(1.5rem-1.5px)] border-0 bg-zinc-950/85 backdrop-blur-2xl pt-2 pb-6 px-4">
                        <CardHeader className="pb-5 text-center">
                            <CardTitle className="text-xl font-bold text-white">
                                {mode === "login" ? "Welcome back" : "Create your account"}
                            </CardTitle>
                            <CardDescription className="text-zinc-400 mt-1.5 text-sm">
                                {mode === "login"
                                    ? "Sign in to continue your VLSI preparation"
                                    : "Start your AI-powered interview preparation"}
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-5 px-2">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        className="rounded-xl h-12 bg-zinc-900/80 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                                        className="rounded-xl h-12 bg-zinc-900/80 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500/50 transition-all duration-300"
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3 flex items-center gap-2">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <div className="pt-2 space-y-3">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-xl h-12 font-bold text-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 border-0 shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_38px_rgba(249,115,22,0.5)] transition-all duration-300"
                                    >
                                        {loading ? "Authenticating…" : mode === "login" ? "Sign In" : "Create Account"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={toggleMode}
                                        className="w-full h-11 text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-xl transition-all duration-300"
                                    >
                                        {mode === "login"
                                            ? "Don't have an account? Register"
                                            : "Already have an account? Sign In"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
