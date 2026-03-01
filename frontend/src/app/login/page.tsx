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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                {/* Brand mark */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl mb-4">
                        <span className="text-white text-xl font-bold">R</span>
                    </div>
                    <p className="text-sm text-gray-500">VLSI Mentor AI</p>
                </div>

                <Card className="rounded-2xl shadow-sm border-gray-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-semibold text-gray-900">
                            {mode === "login" ? "Welcome back" : "Create your account"}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            {mode === "login"
                                ? "Sign in to continue your VLSI preparation"
                                : "Start your AI-powered interview preparation"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-gray-700"
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
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-gray-700"
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
                                    className="rounded-xl"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full rounded-xl"
                                disabled={loading}
                            >
                                {loading
                                    ? "Please wait…"
                                    : mode === "login"
                                        ? "Sign In"
                                        : "Create Account"}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-gray-500 rounded-xl"
                                onClick={toggleMode}
                            >
                                {mode === "login"
                                    ? "Don't have an account? Register"
                                    : "Already have an account? Sign In"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
