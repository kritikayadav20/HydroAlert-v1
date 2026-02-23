"use client";

import { useEffect, useState, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Map as MapIcon, ArrowLeft, Clock, Truck, MapPin, Navigation } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const NAGPUR_DEPOT = { lat: 21.1458, lng: 79.0882 };

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

type RouteMapProps = {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    routeCoordinates: [number, number][];
};

// Leaflet map only on client (no SSR) — uses OpenStreetMap + OSRM, no Google billing
const RouteMap = dynamic<RouteMapProps>(
    () => import('../../components/RouteMap').then((m) => m.default),
    { ssr: false, loading: () => <div className="w-full h-full bg-[#0a1930] flex items-center justify-center text-[#00f5ff]/60 text-sm">Loading map…</div> }
);

export default function TankerRoutePage(props: { params: Promise<{ tankerId: string }> }) {
    const params = use(props.params);
    const [tanker, setTanker] = useState<any>(null);
    const [dispatch, setDispatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string } | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [routeError, setRouteError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const { data: tankerData } = await supabase
                    .from('tankers')
                    .select('*')
                    .eq('id', params.tankerId)
                    .single();

                if (tankerData) setTanker(tankerData);

                const { data: dispatchData } = await supabase
                    .from('dispatch_logs')
                    .select('*, villages(*)')
                    .eq('tanker_id', params.tankerId)
                    .in('status', ['Pending', 'En_Route'])
                    .order('dispatched_at', { ascending: false })
                    .limit(1)
                    .single();

                if (dispatchData) setDispatch(dispatchData);
            } catch (error) {
                console.error('Error fetching tanker/dispatch:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.tankerId) fetchDetails();
    }, [params.tankerId]);

    // Fetch route from OSRM (free, no API key)
    useEffect(() => {
        if (!dispatch?.villages) return;

        const destLat = Number(dispatch.villages.lat);
        const destLng = Number(dispatch.villages.lng);
        const coords = `${NAGPUR_DEPOT.lng},${NAGPUR_DEPOT.lat};${destLng},${destLat}`;
        const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

        setRouteError(null);
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (data.code !== 'Ok' || !data.routes?.[0]) {
                    setRouteError('Route not available for this region');
                    return;
                }
                const route = data.routes[0];
                // GeoJSON is [lng, lat]; Leaflet wants [lat, lng]
                const coordsLatLng: [number, number][] = (route.geometry?.coordinates || []).map(
                    (c: number[]) => [c[1], c[0]]
                );
                setRouteCoordinates(coordsLatLng);
                const distKm = (route.distance / 1000).toFixed(1);
                const durMin = Math.round(route.duration / 60);
                setRouteDetails({
                    distance: `${distKm} km`,
                    duration: durMin >= 60 ? `${Math.floor(durMin / 60)} h ${durMin % 60} min` : `${durMin} min`,
                });
            })
            .catch(() => setRouteError('Could not load route'));
    }, [dispatch?.villages]);

    if (loading) {
        return <div className="min-h-[500px] flex items-center justify-center text-[#00f5ff] animate-pulse">Initializing Comm-Link...</div>;
    }

    if (!tanker) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                <Link href="/admin" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" /> Back to Command Center
                </Link>
                <div className="p-12 text-center text-[#ff2a5f] border border-[#ff2a5f]/30 bg-[#ff2a5f]/10 rounded-3xl flex flex-col items-center gap-3">
                    <Truck className="w-12 h-12" />
                    <div className="font-bold uppercase tracking-widest text-xl">Tanker Unit Not Found</div>
                    <div className="text-sm text-[#ff2a5f]/80">The requested fleet unit could not be located in the registry.</div>
                </div>
            </div>
        );
    }

    if (!dispatch || !dispatch.villages) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                <Link href="/admin" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" /> Back to Command Center
                </Link>
                <div className="p-12 text-center text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-3xl flex flex-col items-center gap-3">
                    <Activity className="w-12 h-12" />
                    <div className="font-bold uppercase tracking-widest text-xl">No Active Dispatch</div>
                    <div className="text-sm text-amber-500/80">Unit {tanker.registration_no} currently has no active dispatch orders.</div>
                </div>
            </div>
        );
    }

    const destination = { lat: Number(dispatch.villages.lat), lng: Number(dispatch.villages.lng) };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[90rem] mx-auto pb-12 px-4 sm:px-6 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a1930]/40 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#00f5ff]/5 rounded-full blur-[80px] -z-10 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="space-y-2">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest mb-2 group">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Command Center
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-light text-white tracking-tighter drop-shadow-lg flex items-center gap-4">
                        <Truck className="w-8 h-8 md:w-12 md:h-12 text-[#00f5ff]" />
                        <span className="font-bold text-[#00f5ff] drop-shadow-[0_0_15px_rgba(0,245,255,0.4)] tracking-widest">{tanker.registration_no}</span>
                    </h1>
                    <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs max-w-xl">
                        Active Route Optimization Tracking (OpenStreetMap)
                    </p>
                </div>
                <div className="px-6 py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] rounded-2xl flex items-center gap-3 shadow-[0_0_15px_rgba(0,245,255,0.2)] font-bold text-xs uppercase tracking-widest">
                    <Navigation className="w-4 h-4 animate-pulse" />
                    Status: {dispatch.status}
                </div>
            </div>

            {/* Main Stage: Map & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px] lg:h-[600px]">
                <div className="lg:col-span-2 relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-full flex flex-col bg-[#0a1930] rounded-3xl overflow-hidden border border-white/10">
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                            <MapIcon className="w-4 h-4 text-[#00f5ff]" />
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Optimized Route</span>
                        </div>
                        {routeError && (
                            <div className="bg-amber-500/20 border border-amber-500/40 text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                {routeError}
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            <div className="w-3 h-3 rounded-full bg-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.8)] border border-white"></div>
                            <span className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Depot Origin</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            <div className="w-3 h-3 rounded-full bg-[#ff2a5f] shadow-[0_0_10px_rgba(255,42,95,0.8)] border border-white"></div>
                            <span className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Destination</span>
                        </div>
                    </div>
                    <div className="flex-1 h-full min-h-[400px] w-full">
                        <RouteMap
                            origin={NAGPUR_DEPOT}
                            destination={destination}
                            routeCoordinates={routeCoordinates}
                        />
                    </div>
                </div>

                <div className="bg-[#0a1930]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00f5ff]/10 blur-[50px] rounded-full pointer-events-none" />
                    <h2 className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00f5ff]" /> Mission Briefing
                    </h2>
                    <div className="space-y-6 flex-1 flex flex-col">
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-1 bg-[#ff2a5f]/50 group-hover:bg-[#ff2a5f] transition-colors" />
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Assigned Destination
                            </div>
                            <div className="text-3xl font-light text-white tracking-tight">{dispatch.villages.name}</div>
                            <div className="text-[10px] text-zinc-400 mt-2 font-mono uppercase tracking-widest bg-white/5 py-1 px-2 rounded inline-block">
                                Lng: {dispatch.villages.lng} | Lat: {dispatch.villages.lat}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center group">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Est. Distance</div>
                                <div className="text-2xl font-light text-[#00f5ff] drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">
                                    {routeDetails ? routeDetails.distance : (routeError ? '—' : '...')}
                                </div>
                            </div>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center group">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Est. Duration</div>
                                <div className="text-2xl font-light text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                    {routeDetails ? routeDetails.duration : (routeError ? '—' : '...')}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 mt-auto">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Operation Timeline
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Dispatched At</span>
                                <span className="text-sm font-mono text-white">
                                    {new Date(dispatch.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
