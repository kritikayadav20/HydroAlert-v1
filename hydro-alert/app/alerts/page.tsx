"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, MapPin, Calendar, Clock, Truck, CheckCircle2 } from "lucide-react";

export default function AlertsPage() {
    const [dispatches, setDispatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDispatches() {
            try {
                // Fetch recent dispatch logs joined with tanker and village info
                // We'll simulate the join by fetching all and joining in memory for this demo
                const { data: logData, error: logErr } = await supabase
                    .from("dispatch_logs")
                    .select("*")
                    .order("dispatched_at", { ascending: false })
                    .limit(50);

                if (logErr) throw logErr;

                const { data: tankerData } = await supabase.from('tankers').select('*');
                const { data: villageData } = await supabase.from('villages').select('*');

                if (logData && tankerData && villageData) {
                    const enriched = logData.map(log => {
                        const t = tankerData.find(tank => tank.id === log.tanker_id);
                        const v = villageData.find(vil => vil.id === log.village_id);
                        return { ...log, tanker: t, village: v };
                    });
                    setDispatches(enriched);
                }
            } catch (error) {
                console.error("Failed to fetch dispatch logs:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDispatches();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-8 relative z-10 px-2 sm:px-0">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tighter drop-shadow-lg flex items-center gap-4">
                        <ShieldAlert className="w-10 h-10 text-[#00f5ff]" />
                        Dispatch <span className="font-bold text-[#00f5ff] drop-shadow-[0_0_15px_rgba(0,245,255,0.4)]">Registry</span>
                    </h1>
                    <p className="text-[#00f5ff]/70 mt-3 text-sm sm:text-base font-semibold tracking-widest uppercase">Historical Fleet Deployments & Logistics Logs</p>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-[#0a1930]/30 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="p-8 border-b border-white/[0.05] flex justify-between items-center bg-black/10">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">System wide Action Log</h3>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-[0.2em] font-bold">Latest 50 registered dispatch events</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                <th className="p-5 pl-8 border-b border-white/[0.05]">Time Generated</th>
                                <th className="p-5 border-b border-white/[0.05]">Assigned Fleet</th>
                                <th className="p-5 border-b border-white/[0.05]">Target Node</th>
                                <th className="p-5 border-b border-white/[0.05]">Status</th>
                                <th className="p-5 pr-8 border-b border-white/[0.05] text-right">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-4">
                                            <div className="h-8 w-8 border-2 border-[#0a1930] border-t-[#00f5ff] rounded-full animate-spin shadow-[0_0_15px_#00f5ff]" />
                                            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Syncing history...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : dispatches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-3">
                                            <CheckCircle2 className="h-10 w-10 text-[#00f5ff]/30 mb-2 drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
                                            <span className="text-sm font-bold text-white tracking-widest uppercase">No dispatches found</span>
                                            <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">System is idle</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                dispatches.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-5 pl-8 text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-zinc-500 opacity-50" />
                                                <span className="font-bold tracking-wider">{new Date(log.dispatched_at).toLocaleDateString()}</span>
                                                <span className="text-zinc-600 ml-1">{new Date(log.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm font-medium text-[#00f5ff]">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4" />
                                                <span className="drop-shadow-[0_0_8px_rgba(0,245,255,0.5)] font-mono font-bold tracking-widest">{log.tanker?.registration_no || "Unknown"}</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                                {log.tanker?.capacity_liters?.toLocaleString()} L Capacity
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm font-semibold text-zinc-200">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-zinc-500" />
                                                {log.village?.name || "Unknown"}
                                            </div>
                                            <div className="text-[10px] font-bold text-[#ff2a5f] uppercase tracking-widest mt-1 ml-6">
                                                WSI: {log.village?.water_stress_index || "N/A"}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg
                                                ${log.status === "Pending" ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" :
                                                    log.status === "Delivered" ? "bg-[#20c997]/10 text-[#20c997] border border-[#20c997]/30" :
                                                        "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30"}`}>
                                                <span className={`h-2 w-2 rounded-full ${log.status === "Pending" ? "bg-amber-500 shadow-[0_0_10px_#f5a623]" :
                                                        log.status === "Delivered" ? "bg-[#20c997] shadow-[0_0_10px_#20c997]" : "bg-zinc-500"
                                                    }`}></span>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="p-5 pr-8 text-xs font-medium text-zinc-400 text-right uppercase tracking-wider">
                                            {log.notes || "--"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
