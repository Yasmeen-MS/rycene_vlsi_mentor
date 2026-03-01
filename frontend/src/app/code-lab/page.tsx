"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import EvaluationCard from "@/components/dashboard/EvaluationCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { callEvaluateCode, EvaluateCodeResult } from "@/lib/functions";
import { Play, Loader2, Code2, ChevronDown } from "lucide-react";

// ─── Monaco — loaded client-side only (no SSR) ────────────────────────────────
const MonacoEditor = dynamic(
    () => import("@monaco-editor/react").then((mod) => mod.default),
    { ssr: false, loading: () => <div className="h-[500px] bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-400 animate-pulse">Loading editor…</div> }
);

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAINS = [
    { value: "rtl", label: "RTL Design" },
    { value: "digital", label: "Digital Logic" },
    { value: "sta", label: "Static Timing" },
    { value: "physical", label: "Physical Design" },
    { value: "dft", label: "Design for Testability" },
    { value: "scripting", label: "Scripting (TCL/Python)" },
];

const DEFAULT_CODE = `// 4-bit synchronous up-counter with synchronous reset
module counter_4bit (
    input  wire        clk,
    input  wire        rst,   // synchronous active-high reset
    output reg  [3:0]  count
);

    always @(posedge clk) begin
        if (rst)
            count <= 4'b0000;
        else
            count <= count + 1'b1;
    end

endmodule
`;

// ─── Code Lab Content ─────────────────────────────────────────────────────────

function CodeLabContent() {
    const [code, setCode] = useState(DEFAULT_CODE);
    const [domain, setDomain] = useState("rtl");
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<EvaluateCodeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleEditorChange = useCallback((value: string | undefined) => {
        setCode(value ?? "");
    }, []);

    const handleEvaluate = async () => {
        if (!code.trim()) return;
        setRunning(true);
        setError(null);
        setResult(null);

        const { data, error: err } = await callEvaluateCode({ code, topic: domain });

        if (err) {
            setError("Evaluation failed. Please retry.");
        } else if (!data) {
            setError("Evaluation failed. Please retry.");
        } else {
            setResult(data);
        }
        setRunning(false);
    };

    return (
        <div className="space-y-5">

            {/* Page header */}
            <div>
                <h1 className="text-2xl font-semibold text-white flex items-center gap-2.5">
                    <Code2 size={22} className="text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                    Code Lab
                </h1>
                <p className="text-sm text-zinc-400 mt-0.5">
                    Write VLSI code, get AI-powered rubric evaluation and skill updates
                </p>
            </div>

            {/* Main 12-column grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* ── LEFT: Editor (8 cols) ── */}
                <div className="col-span-8 space-y-4">
                    <Card className="rounded-3xl border border-white/5 shadow-2xl bg-zinc-950/70 backdrop-blur-2xl">
                        <CardHeader className="pb-3 pt-4 px-5">
                            <div className="flex items-center justify-between gap-4">
                                <CardTitle className="text-sm font-semibold text-zinc-300">
                                    Verilog / SystemVerilog Editor
                                </CardTitle>

                                {/* Domain selector */}
                                <div className="relative">
                                    <select
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer backdrop-blur-md"
                                    >
                                        {DOMAINS.map((d) => (
                                            <option key={d.value} value={d.value} className="bg-black text-white">{d.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                            <div className="rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-black">
                                <MonacoEditor
                                    height="500px"
                                    defaultLanguage="verilog"
                                    language="verilog"
                                    value={code}
                                    onChange={handleEditorChange}
                                    theme="vs-dark"
                                    options={{
                                        fontSize: 13,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                        lineNumbers: "on",
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        padding: { top: 16, bottom: 16 },
                                        wordWrap: "on",
                                        renderLineHighlight: "line",
                                        smoothScrolling: true,
                                        cursorBlinking: "smooth",
                                        automaticLayout: true,
                                        tabSize: 4,
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Run Evaluation button */}
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleEvaluate}
                            disabled={running || !code.trim()}
                            className="rounded-xl px-6 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        >
                            {running
                                ? <><Loader2 size={15} className="animate-spin" />Evaluating…</>
                                : <><Play size={15} />Run Evaluation</>}
                        </Button>
                        {running && (
                            <p className="text-xs text-zinc-400 animate-pulse">
                                AI is analysing your code — takes ~15 seconds…
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-4 py-3 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            {error}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Results (4 cols) ── */}
                <div className="col-span-4">
                    {result ? (
                        <EvaluationCard result={result} />
                    ) : (
                        <Card className="rounded-3xl border border-white/5 shadow-2xl bg-zinc-950/70 backdrop-blur-2xl h-full min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center h-full text-center px-6">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <Play size={20} className="text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-300">
                                    No evaluation yet
                                </p>
                                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed max-w-[200px]">
                                    Submit your code to see evaluation results, rubric scores, and skill updates.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CodeLabPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <CodeLabContent />
            </AppLayout>
        </ProtectedRoute>
    );
}
