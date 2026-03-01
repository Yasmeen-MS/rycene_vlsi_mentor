"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

export interface TrendPoint { label: string; score: number; }

// ─── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const color = val >= 80 ? "#ec4899" : val >= 60 ? "#8b5cf6" : "#ef4444";
    return (
        <div style={{
            background: "rgba(9, 9, 11, 0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "10px 14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(24px)",
        }}>
            <p style={{ color: "#6b7280", fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
            <p style={{ color, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{val}<span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 2 }}>/100</span></p>
        </div>
    );
}

// ─── Custom dot ────────────────────────────────────────────────────────────────
function GlowDot(props: { cx?: number; cy?: number; value?: number }) {
    const { cx = 0, cy = 0, value = 0 } = props;
    const color = value >= 80 ? "#ec4899" : value >= 60 ? "#8b5cf6" : "#ef4444";
    return (
        <g>
            <circle cx={cx} cy={cy} r={14} fill={color} opacity={0.15} />
            <circle cx={cx} cy={cy} r={7} fill={color} opacity={0.3} />
            <circle cx={cx} cy={cy} r={4} fill={color} />
            <circle cx={cx} cy={cy} r={2} fill="#fff" />
        </g>
    );
}

// ─── Score Trend Chart ─────────────────────────────────────────────────────────
export default function ScoreTrend({ data }: { data: TrendPoint[] }) {
    if (data.length === 0) {
        return (
            <div style={{ height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(236,72,153,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                </div>
                <p style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 500 }}>No evaluations yet</p>
                <p style={{ color: "#52525b", fontSize: 11 }}>Complete Code Lab or Interview to begin</p>
            </div>
        );
    }

    return (
        <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: -8 }}>
                    <defs>
                        <linearGradient id="scoreGradVibrant" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.6} />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="scoreLineVibrant" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />

                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={28} />

                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />

                    {/* Benchmark area at 70 */}
                    <ReferenceLine
                        y={70}
                        stroke="rgba(236,72,153,0.4)"
                        strokeDasharray="4 4"
                        label={{ value: "Target 70", position: "right", fontSize: 9, fill: "#ec4899" }}
                    />

                    {/* Score area */}
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="url(#scoreLineVibrant)"
                        strokeWidth={3}
                        fill="url(#scoreGradVibrant)"
                        activeDot={<GlowDot />}
                        isAnimationActive={true}
                        animationDuration={1200}
                        animationEasing="ease-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
