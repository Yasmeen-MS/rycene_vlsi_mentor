"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Code2, Brain, MessageSquare, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/code-lab", label: "Code Lab", icon: Code2 },
    { href: "/tutor", label: "AI Tutor", icon: Brain },
    { href: "/interview", label: "Interview", icon: MessageSquare },
    { href: "/planner", label: "Study Planner", icon: BookOpen },
] as const;

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-screen bg-black/20 backdrop-blur-2xl border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)] shrink-0 flex flex-col relative z-20">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                        <span className="text-lg">🧠</span>
                    </div>
                    <span className="text-lg font-bold text-white tracking-wide">Rycene AI</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                isActive
                                    ? "text-white font-semibold flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 bg-orange-500/10 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                            )}
                        >
                            <Icon
                                size={18}
                                className={isActive ? "text-orange-400" : "text-zinc-500"}
                            />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <p className="text-xs text-zinc-600 text-center font-medium">
                    VLSI Mentor — v1.0
                </p>
            </div>
        </aside >
    );
}
