"use client";

import Link from 'next/link';
import { Truck, Activity, Database, Navigation } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00f5ff]/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00f5ff]/10 text-[#00f5ff] text-xs font-bold uppercase tracking-[0.2em] border border-[#00f5ff]/20 mb-8 shadow-[0_0_20px_rgba(0,245,255,0.15)]">
                <span className="h-2 w-2 rounded-full bg-[#00f5ff] animate-pulse shadow-[0_0_10px_#00f5ff]"></span>
                District Water Governance
            </div>

            <h1 className="text-5xl md:text-7xl font-light text-white tracking-tighter drop-shadow-lg mb-6 max-w-4xl">
                Preventive Water Governance & <br /> <span className="font-bold text-[#00f5ff] drop-shadow-[0_0_15px_rgba(0,245,255,0.4)]">Predictive Dispatch</span>
            </h1>

            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl font-light leading-relaxed mb-12">
                An integrated digital platform that predicts emerging drought stress using rainfall and groundwater trends, enabling authorities to proactively plan and optimize water tanker allocation.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mb-20 w-full sm:w-auto">
                <Link href="/admin" className="px-8 py-5 bg-[#00f5ff] hover:bg-[#00f5ff]/90 text-[#040814] font-bold text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_40px_rgba(0,245,255,0.6)] active:scale-95 group">
                    <Activity className="h-5 w-5" /> Enter Command Center
                </Link>
                <Link href="/admin/dispatch" className="px-8 py-5 bg-[#0a1930]/60 hover:bg-[#00f5ff]/10 border border-white/10 hover:border-[#00f5ff]/30 text-white font-bold text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all backdrop-blur-xl group">
                    <Truck className="h-5 w-5 text-amber-500 group-hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all" /> Fleet Dispatch Grid
                </Link>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
                <FeatureCard
                    icon={<Activity className="h-8 w-8 text-[#00f5ff] drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />}
                    title="Predictive Stress Engine"
                    desc="Analyzes rainfall deviation and groundwater to generate a Live Water Stress Index."
                    color="cyan"
                />
                <FeatureCard
                    icon={<Navigation className="h-8 w-8 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />}
                    title="Smart Route Optimization"
                    desc="Algorithms minimize transit time and optimize tanker dispatch to high-priority zones."
                    color="amber"
                />
                <FeatureCard
                    icon={<Database className="h-8 w-8 text-[#20c997] drop-shadow-[0_0_8px_rgba(32,201,151,0.8)]" />}
                    title="Real-Time Telemetry"
                    desc="Monitor grid capacity, live tanker locations, and historical trends on a single pane."
                    color="emerald"
                />
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc, color }: any) {
    const colorClasses = {
        cyan: "border-[#00f5ff]/20 bg-[#00f5ff]/5 group-hover:bg-[#00f5ff]/10",
        amber: "border-amber-500/20 bg-amber-500/5 group-hover:bg-amber-500/10",
        emerald: "border-[#20c997]/20 bg-[#20c997]/5 group-hover:bg-[#20c997]/10",
    }

    return (
        <div className={`p-8 rounded-3xl border backdrop-blur-xl bg-[#0a1930]/40 hover:bg-[#0a1930]/60 transition-all text-left flex flex-col items-start shadow-xl group hover:-translate-y-2`}>
            <div className={`p-4 rounded-2xl mb-6 border transition-colors ${colorClasses[color as keyof typeof colorClasses]}`}>
                {icon}
            </div>
            <h3 className="text-white font-bold text-lg mb-2 tracking-tight">{title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
        </div>
    )
}
