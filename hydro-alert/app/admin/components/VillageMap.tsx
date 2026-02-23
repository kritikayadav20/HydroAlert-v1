"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Droplets, MapPin } from 'lucide-react';

export default function VillageMap({ selectedVillageId, onSelectVillage }: any) {
    const [villages, setVillages] = useState<any[]>([]);

    useEffect(() => {
        supabase.from('villages').select('*').then(({ data }) => setVillages(data || []));
    }, []);

    // Calculate bounding box
    const bounds = useMemo(() => {
        if (!villages.length) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
        const lats = villages.map(v => v.lat);
        const lngs = villages.map(v => v.lng);
        return {
            minLat: Math.min(...lats) - 0.05,
            maxLat: Math.max(...lats) + 0.05,
            minLng: Math.min(...lngs) - 0.05,
            maxLng: Math.max(...lngs) + 0.05
        };
    }, [villages]);

    const getPosition = (lat: number, lng: number) => {
        const top = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
        const left = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
        return { top: `${top}%`, left: `${left}%` };
    };

    const getStressColor = (wsi: number) => {
        if (wsi > 80) return 'bg-[#ff2a5f] shadow-[0_0_15px_rgba(255,42,95,0.8)] border-[#ff2a5f]';
        if (wsi > 50) return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] border-amber-500';
        return 'bg-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.8)] border-[#00f5ff]';
    };

    return (
        <div className="relative w-full h-full rounded-3xl bg-[#0a1930] border border-white/10 overflow-hidden shadow-2xl">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 bg-transparent"
                style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {villages.map(v => (
                <div
                    key={v.id}
                    onClick={() => onSelectVillage && onSelectVillage(v)}
                    className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 group cursor-pointer`}
                    style={getPosition(v.lat, v.lng)}
                >
                    {/* Ping Animation for High Stress */}
                    {v.water_stress_index > 80 && (
                        <span className="absolute inset-0 flex h-full w-full">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2a5f] opacity-75"></span>
                        </span>
                    )}

                    {/* Node Point */}
                    <div className={`w-4 h-4 rounded-full border-2 transition-transform duration-300 ${getStressColor(v.water_stress_index)} ${selectedVillageId === v.id ? 'scale-[2.0] ring-4 ring-white/30' : 'hover:scale-[1.5]'}`} />

                    {/* Tooltip on Hover */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl z-50 pointer-events-none">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-white font-bold text-sm truncate">{v.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${v.water_stress_index > 80 ? 'bg-[#ff2a5f]/20 text-[#ff2a5f]' : v.water_stress_index > 50 ? 'bg-amber-500/20 text-amber-500' : 'bg-[#00f5ff]/20 text-[#00f5ff]'}`}>
                                WSI: {v.water_stress_index}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-1 uppercase tracking-widest font-semibold">
                            <MapPin className="w-3 h-3" /> {v.population.toLocaleString()} pop
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
                            <Droplets className="w-3 h-3 text-[#00f5ff]" /> {v.current_water_level_pct}% Tank Cap
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
