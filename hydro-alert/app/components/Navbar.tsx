"use client";

import { Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => setMounted(true), []);

    return (
        <nav className="sticky top-4 lg:top-8 z-40 mx-4 sm:mx-6 lg:mx-0 lg:mr-8 mb-8 rounded-2xl bg-[#0a1930]/30 backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300">
            <div className="px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-1 lg:hidden">
                        <span className="text-xl font-bold text-white ml-10 tracking-tight drop-shadow-[0_0_15px_rgba(0,245,255,0.5)]">HydroAlert</span>
                    </div>
                    <div className="hidden lg:flex flex-1">
                        <h1 className="text-lg font-bold text-zinc-100 flex items-center tracking-tight">
                            {/* Optional page title space */}
                        </h1>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-shrink-0 items-center gap-4">
                        {/* Division Badge */}
                        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f5ff]/10 text-xs font-bold text-[#00f5ff] tracking-wide border border-[#00f5ff]/20 shadow-[0_0_15px_rgba(0,245,255,0.15)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00f5ff] animate-pulse"></span>
                            Nagpur Division
                        </div>

                        {/* Theme Toggle - Hidden as we force dark mode, but kept for structural consistency if needed */}
                        <div className="w-px h-6 bg-white/10 hidden sm:block"></div>

                        {/* User Profile Outline */}
                        <button className="p-2 text-zinc-400 hover:text-[#00f5ff] hover:bg-[#00f5ff]/10 rounded-full transition-all duration-300 active:scale-95 group">
                            <User className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
