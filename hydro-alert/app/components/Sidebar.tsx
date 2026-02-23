"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ShieldAlert, Database, Menu, X, ChevronLeft, ChevronRight, Droplet, Truck } from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const navLinks = [
        { name: "Command Center", href: "/admin", icon: Activity },
        { name: "Tanker Dispatch", href: "/admin/dispatch", icon: Truck },
        { name: "Alerts Registry", href: "/alerts", icon: ShieldAlert },
    ];

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button
                className="lg:hidden fixed bottom-6 right-6 z-[60] p-4 bg-[#00f5ff] hover:bg-[#00f5ff]/80 text-[#040814] rounded-full shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Backdrop for mobile */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-[#040814]/60 backdrop-blur-md"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Floating Sidebar */}
            <aside
                className={`fixed lg:sticky top-4 lg:top-8 left-4 lg:left-0 bottom-4 lg:bottom-auto z-[60] lg:h-[calc(100vh-4rem)] lg:self-start lg:flex-shrink-0 lg:ml-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                bg-[#0a1930]/30 backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl flex flex-col overflow-hidden
                ${isCollapsed ? 'w-[80px]' : 'w-64'} 
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-[150%] lg:translate-x-0'}
            `}
            >
                {/* Logo Section */}
                <div className="h-24 flex items-center justify-center relative">
                    <div className="absolute bottom-0 w-1/2 left-1/4 h-px bg-gradient-to-r from-transparent via-[#00f5ff]/30 to-transparent"></div>
                    <div className={`flex items-center justify-center gap-3 transition-all duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-100'}`}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-[#00f5ff] blur-[20px] opacity-20 rounded-full animate-pulse-slow"></div>
                            <Droplet className="h-8 w-8 text-[#00f5ff] relative z-10 drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
                        </div>
                        {!isCollapsed && (
                            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                                Hydro
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-8 px-4 space-y-3 overflow-y-auto">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                        ? 'bg-[#00f5ff]/10 text-white shadow-[inset_0_0_20px_rgba(0,245,255,0.1)]'
                                        : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                                    }
                                `}
                                title={isCollapsed ? link.name : undefined}
                            >
                                {/* Glowing active indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-[#00f5ff] rounded-r-full shadow-[0_0_10px_#00f5ff]"></div>
                                )}

                                <Icon className={`h-5 w-5 shrink-0 transition-all duration-300 z-10 ${isActive ? 'text-[#00f5ff] drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                                {!isCollapsed && <span className="text-sm font-medium tracking-wide z-10">{link.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse/Expand Toggle (Desktop only) */}
                <div className="hidden lg:flex p-4 border-t border-white/[0.05] justify-center">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="flex items-center justify-center p-3 text-zinc-500 hover:text-[#00f5ff] hover:bg-[#00f5ff]/10 rounded-xl transition-all duration-300 group"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" /> : <ChevronLeft className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />}
                    </button>
                </div>
            </aside>
        </>
    );
}
