"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, AlertTriangle, Droplets, ArrowRightCircle, RefreshCcw, Map as MapIcon, CalendarRange } from 'lucide-react';
import VillageMap from './components/VillageMap';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ highRisk: 0, activeTankers: 0, avgWsi: 0 });
    const [villages, setVillages] = useState<any[]>([]);
    const [selectedVillage, setSelectedVillage] = useState<any>(null);
    const [isPredicting, setIsPredicting] = useState(false);

    const fetchData = async () => {
        const { data: vData } = await supabase.from('villages').select('*').order('water_stress_index', { ascending: false });
        const { data: tData } = await supabase.from('tankers').select('*').eq('status', 'En_Route');

        if (vData) {
            setVillages(vData);
            setStats({
                highRisk: vData.filter((v: any) => v.water_stress_index >= 80).length,
                activeTankers: tData?.length || 0,
                avgWsi: Math.round(vData.reduce((acc: number, v: any) => acc + v.water_stress_index, 0) / vData.length)
            });
            if (!selectedVillage && vData.length > 0) {
                setSelectedVillage(vData[0]);
            }
        }
    };

    useEffect(() => {
        fetchData();
        // Poll every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const runPredictions = async () => {
        setIsPredicting(true);
        try {
            await fetch('/api/predict-stress', { method: 'POST' });
            await fetchData();
        } finally {
            setIsPredicting(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
            {/* Header & Main Control */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a1930]/40 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f5ff]/5 rounded-full blur-[80px] -z-10 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div>
                    <h1 className="text-3xl md:text-5xl font-light text-white tracking-tighter drop-shadow-lg">
                        Drought <span className="font-bold text-[#00f5ff] drop-shadow-[0_0_15px_rgba(0,245,255,0.4)]">Command Center</span>
                    </h1>
                    <p className="text-zinc-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs max-w-xl">
                        Predictive Water Governance & Tanker Optimization Grid
                    </p>
                </div>
                <button
                    onClick={runPredictions}
                    disabled={isPredicting}
                    className="group px-6 py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] rounded-2xl hover:bg-[#00f5ff] hover:text-[#0a0a0a] transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(0,245,255,0.2)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                >
                    <RefreshCcw className={`w-4 h-4 ${isPredicting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    {isPredicting ? 'Computing Stress...' : 'Update Stress Index'}
                </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Critical Zones"
                    value={stats.highRisk}
                    icon={<AlertTriangle className="w-8 h-8 text-[#ff2a5f] drop-shadow-[0_0_10px_rgba(255,42,95,0.8)]" />}
                    colorClass="border-[#ff2a5f]/30 bg-[#ff2a5f]/10"
                    textClass="text-[#ff2a5f]"
                    subtitle="WSI > 80"
                />
                <MetricCard
                    title="Active Tankers"
                    value={stats.activeTankers}
                    icon={<ArrowRightCircle className="w-8 h-8 text-[#00f5ff] drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]" />}
                    colorClass="border-[#00f5ff]/30 bg-[#00f5ff]/10"
                    textClass="text-[#00f5ff]"
                    subtitle="Currently dispatched"
                />
                <MetricCard
                    title="Avg Regional Stress"
                    value={`${stats.avgWsi}/100`}
                    icon={<Activity className="w-8 h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />}
                    colorClass="border-amber-500/30 bg-amber-500/10"
                    textClass="text-amber-500"
                    subtitle="Nagpur District Avg"
                />
            </div>

            {/* Main Stage: Map & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px] lg:h-[600px]">
                {/* Left: Interactive Map */}
                <div className="lg:col-span-2 relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-full flex flex-col">
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                        <MapIcon className="w-4 h-4 text-[#00f5ff]" />
                        <span className="text-white text-xs font-bold uppercase tracking-widest">Live Stress Heatmap</span>
                    </div>
                    <div className="flex-1 h-full min-h-[400px]">
                        <VillageMap selectedVillageId={selectedVillage?.id} onSelectVillage={setSelectedVillage} />
                    </div>
                </div>

                {/* Right: Village Radar & Inspector */}
                <div className="bg-[#0a1930]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col overflow-hidden relative">
                    {/* Glowing corner orb */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00f5ff]/10 blur-[50px] rounded-full pointer-events-none" />

                    <h2 className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00f5ff]" /> Node Inspector
                    </h2>

                    {selectedVillage ? (
                        <div key={selectedVillage.id} className="space-y-6 flex-1 animate-in slide-in-from-right-8 duration-500 fade-in flex flex-col">
                            <div>
                                <div className="text-4xl font-light text-white tracking-tight">{selectedVillage.name}</div>
                                <div className="text-zinc-500 text-xs mt-1 font-bold uppercase tracking-widest">{selectedVillage.district} District • {selectedVillage.population.toLocaleString()} Pop</div>
                            </div>

                            {/* Huge WSI Display */}
                            <div className="flex flex-col items-center justify-center py-8 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
                                {selectedVillage.water_stress_index > 80 && <div className="absolute inset-0 bg-gradient-to-t from-[#ff2a5f]/20 to-transparent animate-pulse" />}
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2 z-10">Stress Index (0-100)</div>
                                <div className={`text-7xl font-light tracking-tighter z-10 ${selectedVillage.water_stress_index > 80 ? 'text-[#ff2a5f] drop-shadow-[0_0_20px_rgba(255,42,95,0.8)]' : selectedVillage.water_stress_index > 50 ? 'text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'text-[#00f5ff] drop-shadow-[0_0_20px_rgba(0,245,255,0.5)]'}`}>
                                    {selectedVillage.water_stress_index}
                                </div>
                            </div>

                            {/* "AI Explainability" Chart mockup */}
                            <div className="flex-1 flex flex-col justify-end pt-4">
                                <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-center">AI Predictive Factors</h3>
                                <div className="space-y-4">
                                    <FactorBar label="Rainfall Deficit" pct={Math.min(100, (selectedVillage.water_stress_index / 100) * 110)} />
                                    <FactorBar label="Groundwater Drop" pct={Math.min(100, (selectedVillage.water_stress_index / 100) * 85)} />
                                    <FactorBar label="Population Demand" pct={Math.min(100, (selectedVillage.population / 100000) * 100)} />
                                    <FactorBar label="Tank Capacity Gap" pct={100 - selectedVillage.current_water_level_pct} />
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-zinc-600 italic text-sm">Select a node on the map view data</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, colorClass, textClass, subtitle }: any) {
    return (
        <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform ${colorClass}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] -z-10 group-hover:bg-white/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-zinc-300 font-bold uppercase tracking-[0.1em] text-[10px] sm:text-xs">{title}</h3>
                    <p className={`text-4xl sm:text-5xl font-light tracking-tighter drop-shadow-md ${textClass}`}>{value}</p>
                </div>
                <div className={`p-4 rounded-2xl border group-hover:scale-110 transition-transform ${colorClass}`}>
                    {icon}
                </div>
            </div>
            {subtitle && <p className="text-zinc-500 font-semibold tracking-[0.1em] text-[10px] uppercase relative z-10">{subtitle}</p>}
        </div>
    );
}

function FactorBar({ label, pct }: { label: string, pct: number }) {
    const isHigh = pct > 75;
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <span>{label}</span>
                <span className={isHigh ? 'text-[#ff2a5f]' : 'text-zinc-300'}>{pct.toFixed(0)}% Impact</span>
            </div>
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className={`h-full rounded-full transition-all duration-1000 ${isHigh ? 'bg-[#ff2a5f] shadow-[0_0_10px_rgba(255,42,95,0.8)]' : pct > 40 ? 'bg-amber-500' : 'bg-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.8)]'}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}
