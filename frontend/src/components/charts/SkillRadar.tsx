"use client";

import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip,
} from "recharts";

export interface RadarDataPoint { domain: string; score: number; }

// ─── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: {
    active?: boolean;
    payload?: { payload: RadarDataPoint; value: number }[];
}) {
    if (!active || !payload?.length) return null;
    const { domain, score } = payload[0].payload;
    const color = score >= 80 ? "#ec4899" : score >= 60 ? "#8b5cf6" : "#ef4444";
    return (
        <div style={{
            background: "rgba(9, 9, 11, 0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "10px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(24px)",
        }}>
            <p style={{ color: "#6b7280", fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{domain}</p>
            <p style={{ color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{score}<span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 2 }}>/100</span></p>
        </div>
    );
}

// ─── Custom angle label ───────────────────────────────────────────────────────
function CustomTick({ payload, x, y, cx, cy, ...rest }: {
    payload?: { value: string; coordinate: number };
    x?: number; y?: number; cx?: number; cy?: number;
    [key: string]: unknown;
}) {
    if (!payload || x === undefined || y === undefined || cx === undefined || cy === undefined) return null;
    const dx = (x - cx) * 0.12;
    const dy = (y - cy) * 0.12;
    void rest;
    return (
        <text
            x={x + dx}
            y={y + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 10, fontWeight: 600, fill: "#a1a1aa", letterSpacing: "0.04em", textTransform: "uppercase" }}
        >
            {payload.value}
        </text>
    );
}

// ─── SkillRadar ───────────────────────────────────────────────────────────────
export default function SkillRadar({ data }: { data: RadarDataPoint[] }) {
    return (
        <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
                    <defs>
                        {/* Main fill gradient */}
                        <radialGradient id="radarGradVibrant" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.15} />
                        </radialGradient>
                    </defs>

                    {/* Light polar grid */}
                    <PolarGrid
                        stroke="rgba(255,255,255,0.08)"
                        gridType="polygon"
                    />

                    {/* Domain labels */}
                    <PolarAngleAxis
                        dataKey="domain"
                        tick={<CustomTick />}
                    />

                    {/* Background benchmark at 100% — ghost fill */}
                    <Radar
                        name="max"
                        dataKey={() => 100}
                        stroke="rgba(255,255,255,0.05)"
                        fill="rgba(0,0,0,0.2)"
                        fillOpacity={1}
                        strokeWidth={1}
                        dot={false}
                        isAnimationActive={false}
                    />

                    {/* Actual score with glowing gradient fill */}
                    <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#ec4899" // pink-500
                        strokeWidth={3}
                        fill="url(#radarGradVibrant)"
                        fillOpacity={1}
                        dot={{ r: 4, fill: "#ec4899", stroke: "#000", strokeWidth: 1.5 }}
                        activeDot={{ r: 7, fill: "#be185d", stroke: "#000", strokeWidth: 2 }}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                    />

                    <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
