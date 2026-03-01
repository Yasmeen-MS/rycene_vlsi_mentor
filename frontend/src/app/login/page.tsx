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

type Mode = "login" | "register";

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
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 animate-pulse" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 px-4">
                {/* Brand mark */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-5 shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-[bounce_3s_ease-in-out_infinite]">
                        <span className="text-3xl filter drop-shadow-md">🧠</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">Rycene AI</h1>
                    <p className="text-sm text-zinc-400 mt-1 font-medium">VLSI Mentor Platform</p>
                </div>

                <div className="relative rounded-3xl p-[1px] overflow-hidden group shadow-2xl">
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
                </div>
            </div>
        </div>
    );
}
