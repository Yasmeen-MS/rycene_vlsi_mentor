"use client";

import { useState, FormEvent } from "react";
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

// Custom SVG Logic Gates for 3D Background
const AndGate = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <path d="M 20 20 L 50 20 A 30 30 0 0 1 80 50 A 30 30 0 0 1 50 80 L 20 80 Z" stroke="url(#steelGrad)" strokeWidth="4" fill="url(#glassGrad)" />
        <line x1="0" y1="35" x2="20" y2="35" stroke="url(#steelGrad)" strokeWidth="4" />
        <line x1="0" y1="65" x2="20" y2="65" stroke="url(#steelGrad)" strokeWidth="4" />
        <line x1="80" y1="50" x2="100" y2="50" stroke="url(#steelGrad)" strokeWidth="4" />
    </svg>
);

const OrGate = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <path d="M 20 20 Q 50 20 80 50 Q 50 80 20 80 Q 35 50 20 20 Z" stroke="url(#steelGrad)" strokeWidth="4" fill="url(#glassGrad)" />
        <line x1="0" y1="35" x2="25" y2="35" stroke="url(#steelGrad)" strokeWidth="4" />
        <line x1="0" y1="65" x2="25" y2="65" stroke="url(#steelGrad)" strokeWidth="4" />
        <line x1="80" y1="50" x2="100" y2="50" stroke="url(#steelGrad)" strokeWidth="4" />
    </svg>
);

const NotGate = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <polygon points="20,20 20,80 70,50" stroke="url(#orangeGrad)" strokeWidth="4" fill="url(#glassGrad)" />
        <circle cx="78" cy="50" r="8" stroke="url(#orangeGrad)" strokeWidth="4" fill="none" />
        <line x1="0" y1="50" x2="20" y2="50" stroke="url(#orangeGrad)" strokeWidth="4" />
        <line x1="86" y1="50" x2="100" y2="50" stroke="url(#orangeGrad)" strokeWidth="4" />
    </svg>
);

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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050510] font-sans perspective-1000">
            {/* SVG Definitions for 3D metallic gradients used in gates */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ea580c" />
                        <stop offset="50%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(249, 115, 22, 0.2)" />
                        <stop offset="100%" stopColor="rgba(217, 119, 6, 0.05)" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Simulated Spline 3D Floating Logic Gates */}
            {/* Gate 1 */}
            <motion.div
                className="absolute top-[15%] left-[10%] w-48 h-48 drop-shadow-[0_20px_30px_rgba(249,115,22,0.3)]"
                animate={{
                    y: [-20, 20, -20],
                    rotateX: [10, 30, 10],
                    rotateY: [-20, 20, -20],
                    rotateZ: [0, 5, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
                <AndGate className="w-full h-full text-white/10" />
            </motion.div>

            {/* Gate 2 */}
            <motion.div
                className="absolute bottom-[20%] right-[10%] w-64 h-64 drop-shadow-[0_30px_40px_rgba(56,189,248,0.2)]"
                animate={{
                    y: [30, -30, 30],
                    rotateX: [-20, 10, -20],
                    rotateY: [10, -30, 10],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
                <OrGate className="w-full h-full text-white/5" />
            </motion.div>

            {/* Gate 3 */}
            <motion.div
                className="absolute top-[20%] right-[25%] w-32 h-32 drop-shadow-[0_15px_20px_rgba(168,85,247,0.3)]"
                animate={{
                    y: [15, -15, 15],
                    rotateX: [0, 40, 0],
                    rotateY: [40, 0, 40],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
                <NotGate className="w-full h-full text-white/10" />
            </motion.div>

            <div className="w-full max-w-md relative z-10 px-4">
                {/* Brand mark */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-5 shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-[bounce_3s_ease-in-out_infinite]">
                        <span className="text-3xl filter drop-shadow-md">🧠</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">Rycene AI</h1>
                    <p className="text-sm text-zinc-400 mt-1 font-medium">VLSI Mentor Platform</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative rounded-3xl p-[1px] overflow-hidden group shadow-[0_0_50px_rgba(249,115,22,0.15)]"
                >
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_75%,#f97316_100%)] animate-[spin_4s_linear_infinite]" />
                    <Card className="rounded-[calc(1.5rem-1px)] border-0 bg-zinc-950/80 backdrop-blur-3xl relative z-10 transition-all duration-500 pt-2 pb-6 px-4">
                        <CardHeader className="pb-6 text-center">
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
                                    <label
                                        htmlFor="email"
                                        className="text-xs font-semibold text-zinc-300 uppercase tracking-wide"
                                    >
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
                                        className="rounded-xl h-12 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 transition-all duration-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="password"
                                        className="text-xs font-semibold text-zinc-300 uppercase tracking-wide"
                                    >
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete={
                                            mode === "login" ? "current-password" : "new-password"
                                        }
                                        className="rounded-xl h-12 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 transition-all duration-300"
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3 flex items-center gap-2">
                                        <span className="text-lg">⚠️</span> {error}
                                    </div>
                                )}

                                <div className="pt-2 space-y-3">
                                    <Button
                                        type="submit"
                                        className="w-full rounded-xl h-12 font-bold text-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Authenticating…"
                                            : mode === "login"
                                                ? "Sign In"
                                                : "Create Account"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-zinc-400 rounded-xl h-12 hover:text-white hover:bg-white/5 transition-all duration-300"
                                        onClick={toggleMode}
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
