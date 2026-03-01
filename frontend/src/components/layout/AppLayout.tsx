"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppLayoutProps {
    children: React.ReactNode;
}

/**
 * AppLayout — provides the full app shell (Sidebar + Topbar + content area).
 * Used inside every protected route page, always inside <ProtectedRoute>.
 */
export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen relative bg-black font-sans text-zinc-100">
            {/* Global Generated Abstract Background */}
            <div
                className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center"
                style={{ backgroundImage: "url('/images/abstract_bg.png')" }}
            />
            {/* Dark blur overlay to ensure text contrast and premium glow */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-black/40 backdrop-blur-[40px]" />

            <div className="relative z-10 flex">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
