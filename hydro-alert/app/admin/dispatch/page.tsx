"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Truck, MapPin, Search, CheckCircle2, Navigation, AlertTriangle } from 'lucide-react';

export default function DispatchPage() {
    const [villages, setVillages] = useState<any[]>([]);
    const [tankers, setTankers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRouting, setIsRouting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const { data: vData } = await supabase.from('villages').select('*').order('water_stress_index', { ascending: false });
        const { data: tData } = await supabase.from('tankers').select('*').order('status', { ascending: true });

        if (vData) setVillages(vData.filter((v: any) => v.water_stress_index > 50)); // Only show stressed villages
        if (tData) setTankers(tData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const autoAssign = async () => {
        setIsRouting(true);
        try {
            const availableTankers = tankers.filter(t => t.status === 'Available');
            if (availableTankers.length === 0) {
                alert("No available tankers to dispatch!");
                return;
            }

            // Simple demo: Assign top 3 critical villages to the first available tanker
            const targetVillages = villages.slice(0, 3).map(v => v.id);
            const selectedTanker = availableTankers[0];

            const response = await fetch('/api/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'optimize_route',
                    payload: { villageIds: targetVillages, tankerId: selectedTanker.id }
                })
            });

            const result = await response.json();
            if (result.success) {
                await fetchData();
            } else {
                console.error("Routing failed:", result.error);
                alert("Routing failed");
            }
        } finally {
            setIsRouting(false);
        }
    };

    const completeDispatch = async (logId: string) => {
        // Complete mock action (in reality, you'd complete a specific log, here we mock completing the tanker's run)
        try {
            const tanker = tankers.find(t => t.status === 'En_Route');
            if (tanker) {
                await supabase.from('tankers').update({ status: 'Available' }).eq('id', tanker.id);
                // Mark logs as delivered
                await supabase.from('dispatch_logs').update({ status: 'Delivered', delivered_at: new Date().toISOString() }).eq('tanker_id', tanker.id).eq('status', 'Pending');
                await fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };


    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a1930]/40 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -z-10 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div>
                    <h1 className="text-3xl md:text-5xl font-light text-white tracking-tighter drop-shadow-lg flex items-center gap-4">
                        <Truck className="w-10 h-10 text-amber-500" />
                        Fleet <span className="font-bold text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">Dispatch</span>
                    </h1>
                    <p className="text-zinc-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs max-w-xl">
                        AI-Optimized Route Planning & Tanker Allocation
                    </p>
                </div>
                <button
                    onClick={autoAssign}
                    disabled={isRouting}
                    className="group px-6 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl hover:bg-amber-500 hover:text-[#0a0a0a] transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                >
                    <Navigation className={`w-4 h-4 ${isRouting ? 'animate-bounce' : 'group-hover:translate-x-1 transition-transform'}`} />
                    {isRouting ? 'Generating Routes...' : 'Auto-Route Critical'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px] lg:h-[600px]">
                {/* Left: Pending SOS / High Stress Villages */}
                <div className="bg-[#0a1930]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative col-span-1">
                    <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center z-10">
                        <h2 className="text-zinc-300 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#ff2a5f]" /> Priority Zones Queue
                        </h2>
                        <span className="bg-[#ff2a5f]/20 text-[#ff2a5f] text-[10px] font-bold px-2 py-1 rounded">
                            {villages.length} Nodes
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 custom-scrollbar">
                        {loading ? (
                            <div className="text-center text-zinc-500 italic text-xs py-10">Syncing telemetry...</div>
                        ) : villages.length === 0 ? (
                            <div className="text-center text-zinc-500 italic text-xs py-10">No critical stress zones detected.</div>
                        ) : (
                            villages.map((v, i) => (
                                <div key={v.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${v.water_stress_index > 80 ? 'bg-[#ff2a5f]/20 text-[#ff2a5f]' : 'bg-amber-500/20 text-amber-500'}`}>
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm">{v.name}</div>
                                            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {v.population.toLocaleString()} Pop
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase">WSI</div>
                                        <div className={`text-lg font-bold ${v.water_stress_index > 80 ? 'text-[#ff2a5f]' : 'text-amber-500'}`}>
                                            {v.water_stress_index}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Active Fleet Status */}
                <div className="lg:col-span-2 bg-[#0a1930]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f5ff]/5 rounded-full blur-[100px] -z-10 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                    <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center z-10">
                        <h2 className="text-zinc-300 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#00f5ff]" /> Fleet Status Matrix
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 z-10 custom-scrollbar content-start">
                        {loading ? (
                            <div className="col-span-1 md:col-span-2 text-center text-zinc-500 italic text-xs py-10">Syncing fleet matrix...</div>
                        ) : (
                            tankers.map(t => (
                                <div key={t.id} className="relative bg-black/40 border border-white/5 p-5 rounded-2xl overflow-hidden group hover:border-[#00f5ff]/30 transition-colors">
                                    {t.status === 'En_Route' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />}
                                    {t.status === 'Available' && <div className="absolute top-0 left-0 w-1 h-full bg-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.8)]" />}
                                    {t.status === 'Maintenance' && <div className="absolute top-0 left-0 w-1 h-full bg-zinc-600" />}

                                    <div className="flex justify-between items-start mb-4 pl-2">
                                        <div>
                                            <div className="text-white font-bold text-lg tracking-wider">{t.registration_no}</div>
                                            <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{t.capacity_liters.toLocaleString()} L Capacity</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${t.status === 'Available' ? 'bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]/20' :
                                                t.status === 'En_Route' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                                            }`}>
                                            {t.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="pl-2 space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                                            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center font-bold text-white text-[10px] uppercase">
                                                {t.driver_name?.charAt(0) ?? '?'}
                                            </div>
                                            {t.driver_name ?? '—'} <span className="text-zinc-500 mx-1">•</span> {t.driver_phone ?? '—'}
                                        </div>

                                        {t.status === 'En_Route' && (
                                            <div className="mt-4 pt-4 border-t border-white/10 text-right">
                                                <button onClick={() => completeDispatch(t.id)} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-[#00f5ff]/20 text-[#00f5ff] hover:bg-[#00f5ff] hover:text-black transition-colors rounded items-center gap-2 inline-flex">
                                                    <CheckCircle2 className="w-3 h-3" /> Mark Delivered
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
