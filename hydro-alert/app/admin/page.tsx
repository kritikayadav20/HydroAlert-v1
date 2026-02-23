"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, AlertTriangle, Droplets, ArrowRightCircle, RefreshCcw, Map as MapIcon, ShieldCheck, Truck, Clock, CheckCircle2, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const DynamicVillageMap = dynamic(() => import('./components/VillageMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-[#0a1930] text-zinc-500 rounded-3xl">Loading Grid Protocol...</div>
});

export default function AdminDashboard() {
    const [stats, setStats] = useState({ highRisk: 0, activeTankers: 0, avgWsi: 0 });
    const [villages, setVillages] = useState<any[]>([]);
    const [tankers, setTankers] = useState<any[]>([]);
    const [activeDispatches, setActiveDispatches] = useState<any[]>([]);
    const [selectedVillage, setSelectedVillage] = useState<any>(null);
    const [isPredicting, setIsPredicting] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dispatchVillage, setDispatchVillage] = useState<any>(null);
    const [selectedTankerIds, setSelectedTankerIds] = useState<string[]>([]);
    const [isDispatching, setIsDispatching] = useState(false);

    const fetchData = async () => {
        const { data: vData } = await supabase.from('villages').select('*');
        const { data: tData } = await supabase.from('tankers').select('*');
        const { data: dData } = await supabase.from('dispatch_logs').select('*, tankers(*), villages(*)').eq('status', 'Pending').order('dispatched_at', { ascending: false });

        if (vData) {
            // Priority Score calculation
            const maxPop = Math.max(...vData.map(v => v.population), 1);

            const enrichedVillages = vData.map(v => {
                const normPop = (v.population / maxPop) * 100;
                const priorityScore = Math.round((v.water_stress_index * 0.7) + (normPop * 0.3));

                let suggestedTankers = 0;
                if (v.water_stress_index > 80) suggestedTankers = 2;
                else if (v.water_stress_index >= 60) suggestedTankers = 1;

                if (v.population > 70000) suggestedTankers += 1;
                if (v.current_water_level_pct < 20) suggestedTankers += 1;

                return { ...v, priorityScore, suggestedTankers };
            }).sort((a, b) => b.priorityScore - a.priorityScore);

            setVillages(enrichedVillages);

            const activeT = tData?.filter((t: any) => t.status === 'En_Route') || [];
            if (tData) setTankers(tData);
            if (dData) setActiveDispatches(dData);

            setStats({
                highRisk: enrichedVillages.filter((v: any) => v.water_stress_index >= 80).length,
                activeTankers: activeT.length,
                avgWsi: Math.round(enrichedVillages.reduce((acc: number, v: any) => acc + v.water_stress_index, 0) / enrichedVillages.length)
            });
            if (!selectedVillage && enrichedVillages.length > 0) {
                setSelectedVillage(enrichedVillages[0]);
            }
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s poll for active operations
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

    const openDispatchModal = (village: any) => {
        setDispatchVillage(village);
        setSelectedTankerIds([]);
        setIsModalOpen(true);
    };

    const toggleTankerSelection = (id: string) => {
        setSelectedTankerIds(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const confirmDispatch = async () => {
        if (selectedTankerIds.length === 0) return;
        setIsDispatching(true);
        try {
            await fetch('/api/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'manual_dispatch',
                    payload: {
                        villageId: dispatchVillage.id,
                        tankerIds: selectedTankerIds,
                        wsiAtDispatch: dispatchVillage.water_stress_index,
                        priorityScore: dispatchVillage.priorityScore
                    }
                })
            });
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Dispatch failed", error);
        } finally {
            setIsDispatching(false);
        }
    };

    const markDelivered = async (dispatchId: string) => {
        try {
            await fetch('/api/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete_dispatch', payload: { dispatchId } })
            });
            await fetchData();
        } catch (e) {
            console.error("Delivery failed", e);
        }
    }

    const availableTankers = tankers.filter(t => t.status === 'Available');

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[90rem] mx-auto pb-12 px-4 sm:px-6 relative">
            {/* Header */}
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
                <button onClick={runPredictions} disabled={isPredicting} className="group px-6 py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] rounded-2xl hover:bg-[#00f5ff] hover:text-[#0a0a0a] transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(0,245,255,0.2)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] font-bold text-xs uppercase tracking-widest disabled:opacity-50">
                    <RefreshCcw className={`w-4 h-4 ${isPredicting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    {isPredicting ? 'Computing Stress...' : 'Update Stress Index'}
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Critical Zones" value={stats.highRisk} icon={<AlertTriangle className="w-8 h-8 text-[#ff2a5f] drop-shadow-[0_0_10px_rgba(255,42,95,0.8)]" />} colorClass="border-[#ff2a5f]/30 bg-[#ff2a5f]/10" textClass="text-[#ff2a5f]" subtitle="WSI > 80" />
                <MetricCard title="Active Tankers" value={stats.activeTankers} icon={<ArrowRightCircle className="w-8 h-8 text-[#00f5ff] drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]" />} colorClass="border-[#00f5ff]/30 bg-[#00f5ff]/10" textClass="text-[#00f5ff]" subtitle="Currently dispatched" />
                <MetricCard title="Avg Regional Stress" value={`${stats.avgWsi}/100`} icon={<Activity className="w-8 h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />} colorClass="border-amber-500/30 bg-amber-500/10" textClass="text-amber-500" subtitle="Nagpur District Avg" />
            </div>

            {/* Main Stage: Map & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px] lg:h-[600px]">
                <div className="lg:col-span-2 relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-full flex flex-col">
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                        <MapIcon className="w-4 h-4 text-[#00f5ff]" />
                        <span className="text-white text-xs font-bold uppercase tracking-widest">Live Stress Heatmap</span>
                    </div>
                    <div className="flex-1 h-full min-h-[400px]">
                        <DynamicVillageMap villages={villages} selectedVillageId={selectedVillage?.id} onSelectVillage={setSelectedVillage} />
                    </div>
                </div>

                <div className="bg-[#0a1930]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00f5ff]/10 blur-[50px] rounded-full pointer-events-none" />
                    <h2 className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00f5ff]" /> Node Inspector
                    </h2>
                    {selectedVillage ? (
                        <div key={selectedVillage.id} className="space-y-6 flex-1 animate-in slide-in-from-right-8 duration-500 fade-in flex flex-col">
                            <div>
                                <div className="text-4xl font-light text-white tracking-tight">{selectedVillage.name}</div>
                                <div className="text-zinc-500 text-xs mt-1 font-bold uppercase tracking-widest">{selectedVillage.district} District • {selectedVillage.population.toLocaleString()} Pop</div>
                                <div className="text-[#00f5ff] text-xs mt-1 font-bold uppercase tracking-widest">Calculated Priority Score: {selectedVillage.priorityScore}</div>
                            </div>
                            <div className="flex flex-col items-center justify-center py-6 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
                                {selectedVillage.water_stress_index > 80 && <div className="absolute inset-0 bg-gradient-to-t from-[#ff2a5f]/20 to-transparent animate-pulse" />}
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2 z-10">Stress Index (0-100)</div>
                                <div className={`text-6xl font-light tracking-tighter z-10 ${selectedVillage.water_stress_index > 80 ? 'text-[#ff2a5f] drop-shadow-[0_0_20px_rgba(255,42,95,0.8)]' : selectedVillage.water_stress_index > 50 ? 'text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'text-[#00f5ff] drop-shadow-[0_0_20px_rgba(0,245,255,0.5)]'}`}>
                                    {selectedVillage.water_stress_index}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-end pt-2">
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
                        <div className="flex-1 flex items-center justify-center text-zinc-600 italic text-sm">Select a node to view data</div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Recommendations & Active Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Panel 1: PRIORITY DISPATCH RECOMMENDATIONS */}
                <div className="bg-[#0a1930]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-lg p-6 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-white font-bold tracking-tight text-lg flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-amber-500" /> Village Dispatch Recommendation Panel
                        </h2>
                        <span className="text-[10px] uppercase tracking-widest text-[#00f5ff] font-bold border border-[#00f5ff]/30 bg-[#00f5ff]/10 px-3 py-1 rounded-full">Available Fleet: {availableTankers.length}</span>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                    <th className="p-4 border-b border-white/[0.05]">Village Node</th>
                                    <th className="p-4 border-b border-white/[0.05]">Priority Score</th>
                                    <th className="p-4 border-b border-white/[0.05]">Tank Level</th>
                                    <th className="p-4 border-b border-white/[0.05]">Predicted Demand</th>
                                    <th className="p-4 border-b border-white/[0.05] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {villages.filter(v => !activeDispatches.some(d => d.village_id === v.id)).slice(0, 8).map(v => (
                                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="text-sm font-semibold text-zinc-200">{v.name}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">WSI: {v.water_stress_index} • Pop: {(v.population / 1000).toFixed(1)}k</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xl font-light text-[#00f5ff] drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]">{v.priorityScore}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
                                                    <div className={`h-full ${v.current_water_level_pct < 20 ? 'bg-[#ff2a5f]' : 'bg-[#00f5ff]'}`} style={{ width: `${v.current_water_level_pct}%` }}></div>
                                                </div>
                                                <span className="text-xs text-zinc-400 font-mono">{v.current_water_level_pct}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                                <Truck className="w-3 h-3" /> {v.suggestedTankers} Units
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => openDispatchModal(v)} className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:border-white/30">
                                                Initiate Dispatch
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Panel 2: ACTIVE TANKER OPERATIONS */}
                <div className="bg-[#0a1930]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-lg p-6 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-white font-bold tracking-tight text-lg flex items-center gap-3">
                            <Navigation className="w-5 h-5 text-[#00f5ff]" /> Active Tanker Operations
                        </h2>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                    <th className="p-4 border-b border-white/[0.05]">Fleet Unit</th>
                                    <th className="p-4 border-b border-white/[0.05]">Destination</th>
                                    <th className="p-4 border-b border-white/[0.05]">Status</th>
                                    <th className="p-4 border-b border-white/[0.05] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {activeDispatches.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-zinc-500 text-sm italic">No active dispatch operations.</td>
                                    </tr>
                                ) : activeDispatches.map(dispatch => (
                                    <tr key={dispatch.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="text-sm font-semibold text-[#00f5ff] flex items-center gap-2">
                                                <Truck className="w-4 h-4" />
                                                <Link href={`/admin/tanker/${dispatch.tankers?.id}`} className="hover:underline hover:text-white transition-colors">
                                                    {dispatch.tankers?.registration_no}
                                                </Link>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Dispatched: {new Date(dispatch.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-semibold text-white">{dispatch.villages?.name}</div>
                                            <div className="text-[10px] text-[#ff2a5f] uppercase tracking-widest font-bold mt-1">WSI: {dispatch.notes?.match(/WSI: (\d+)/)?.[1] || "N/A"}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ff2a5f]/10 text-[#ff2a5f] border border-[#ff2a5f]/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                <Clock className="w-3 h-3 animate-pulse" /> {dispatch.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => markDelivered(dispatch.id)} className="px-5 py-2 bg-[#20c997]/10 hover:bg-[#20c997]/20 border border-[#20c997]/30 text-[#20c997] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ml-auto">
                                                <CheckCircle2 className="w-4 h-4" /> Mark Delivered
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Manual Authority Dispatch Modal */}
            {isModalOpen && dispatchVillage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0a1930] border border-white/10 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col slide-in-from-bottom-8">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-[#00f5ff]" />
                                    Authority Dispatch Approval
                                </h3>
                                <p className="text-zinc-400 text-xs mt-1 uppercase tracking-widest">Target Node: <span className="text-white font-bold">{dispatchVillage.name}</span></p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-light text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">{dispatchVillage.suggestedTankers}</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">AI Suggested Units</div>
                            </div>
                        </div>

                        {/* Modal Body: Available Tankers List */}
                        <div className="p-6 overflow-y-auto max-h-[400px]">
                            <h4 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-4">Select Fleet Units ({availableTankers.length} Available)</h4>

                            {availableTankers.length === 0 ? (
                                <div className="p-8 text-center text-[#ff2a5f] border border-[#ff2a5f]/30 bg-[#ff2a5f]/10 rounded-2xl flex flex-col items-center gap-3">
                                    <AlertTriangle className="w-8 h-8" />
                                    <div className="font-bold uppercase tracking-widest">Insufficient Tankers Available</div>
                                    <div className="text-xs text-[#ff2a5f]/80">The system cannot dispatch immediately. Fleet units are currently deployed or in maintenance.</div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {availableTankers.map(tanker => {
                                        const isSelected = selectedTankerIds.includes(tanker.id);
                                        return (
                                            <div
                                                key={tanker.id}
                                                onClick={() => toggleTankerSelection(tanker.id)}
                                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center group
                                                    ${isSelected ? 'bg-[#00f5ff]/10 border-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.2)]' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#00f5ff] border-[#00f5ff] text-black' : 'border-zinc-500'}`}>
                                                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold font-mono tracking-widest ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{tanker.registration_no}</div>
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Cap: {tanker.capacity_liters}L • Driver ID: {tanker.id.slice(0, 6)}</div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-[#20c997] uppercase tracking-widest font-bold bg-[#20c997]/10 px-2 py-1 rounded">Available</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between items-center">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-zinc-400 hover:text-white uppercase tracking-widest font-bold text-xs transition-colors">
                                Cancel
                            </button>
                            {availableTankers.length > 0 && (
                                <button
                                    onClick={confirmDispatch}
                                    disabled={selectedTankerIds.length === 0 || isDispatching}
                                    className="px-8 py-3 bg-[#00f5ff] text-black rounded-xl uppercase tracking-widest font-bold text-xs hover:bg-[#00f5ff]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(0,245,255,0.4)] flex items-center gap-2"
                                >
                                    {isDispatching ? 'Confirming...' : `Confirm Dispatch (${selectedTankerIds.length} Units)`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
