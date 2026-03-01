"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function Topbar() {
    const { user } = useAppStore();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch {
            // AuthProvider's onAuthStateChanged listener will handle state reset
        }
    };

    return (
        <header className="h-16 bg-black/20 backdrop-blur-md border-b border-white/5 shrink-0 flex items-center justify-between px-6 relative z-10">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" />
                <span className="text-sm font-medium text-zinc-400">Connected</span>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-zinc-300 truncate max-w-[220px]">
                    {user?.email ?? ""}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 gap-1.5 transition-colors"
                >
                    <LogOut size={15} />
                    Logout
                </Button>
            </div>
        </header>
    );
}
