"use client";

import { useEffect, useState, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Map as MapIcon, ArrowLeft, Clock, Truck, MapPin, Navigation } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

declare global {
    interface Window {
        google: any;
    }
}

const NAGPUR_DEPOT = { lat: 21.1458, lng: 79.0882 };

export default function TankerRoutePage(props: { params: Promise<{ tankerId: string }> }) {
    const params = use(props.params);
    const [tanker, setTanker] = useState<any>(null);
    const [dispatch, setDispatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [routeDetails, setRouteDetails] = useState<{ distance: string, duration: string } | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any | null>(null);
    const directionsRenderer = useRef<any | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                // Fetch tanker
                const { data: tankerData } = await supabase
                    .from('tankers')
                    .select('*')
                    .eq('id', params.tankerId)
                    .single();

                if (tankerData) {
                    setTanker(tankerData);
                }

                // Fetch active dispatch for this tanker
                const { data: dispatchData } = await supabase
                    .from('dispatch_logs')
                    .select('*, villages(*)')
                    .eq('tanker_id', params.tankerId)
                    .in('status', ['Pending', 'En_Route'])
                    .order('dispatched_at', { ascending: false })
                    .limit(1)
                    .single();

                if (dispatchData) {
                    setDispatch(dispatchData);
                }
            } catch (error) {
                console.error("Error fetching tanker/dispatch:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.tankerId) {
            fetchDetails();
        }
    }, [params.tankerId]);

    const initMap = () => {
        if (!mapRef.current || !dispatch?.villages || !window.google) return;

        const destination = { lat: Number(dispatch.villages.lat), lng: Number(dispatch.villages.lng) };

        if (!mapInstance.current) {
            mapInstance.current = new window.google.maps.Map(mapRef.current, {
                center: NAGPUR_DEPOT,
                zoom: 10,
                mapId: 'drought_command_center_route_map',
                disableDefaultUI: true,
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#040814" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#040814" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#00f5ff" }] },
                    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#00f5ff" }] },
                    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#20c997" }] },
                    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0a1930" }] },
                    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#20c997" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }, { lightness: -50 }] },
                    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0a1930" }] },
                    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
                    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ff2a5f" }, { lightness: -30 }] },
                    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#ff2a5f" }, { lightness: -50 }] },
                    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
                    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#0a1930" }] },
                    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#00f5ff" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#00f5ff" }, { lightness: -80 }] },
                    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#00f5ff" }] },
                    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#040814" }] },
                ]
            });
        }

        if (!directionsRenderer.current) {
            directionsRenderer.current = new window.google.maps.DirectionsRenderer({
                map: mapInstance.current,
                suppressBicyclingLayer: true,
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: "#00f5ff",
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    icons: [{
                        icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, fillOpacity: 1, scale: 3 },
                        offset: '100%',
                        repeat: '50px'
                    }]
                }
            });
        }

        const directionsService = new window.google.maps.DirectionsService();

        directionsService.route(
            {
                origin: NAGPUR_DEPOT,
                destination: destination,
                travelMode: window.google.maps.TravelMode.DRIVING
            },
            (response: any, status: any) => {
                if (status === 'OK' && response && directionsRenderer.current) {
                    directionsRenderer.current.setDirections(response);

                    const route = response.routes[0];
                    if (route && route.legs && route.legs.length > 0) {
                        const leg = route.legs[0];
                        setRouteDetails({
                            distance: leg.distance?.text || 'N/A',
                            duration: leg.duration?.text || 'N/A'
                        });

                        // Add Custom Markers
                        new window.google.maps.Marker({
                            position: NAGPUR_DEPOT,
                            map: mapInstance.current,
                            title: 'Depot (Origin)',
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: '#00f5ff',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                            }
                        });

                        new window.google.maps.Marker({
                            position: destination,
                            map: mapInstance.current,
                            title: dispatch.villages.name + ' (Destination)',
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: '#ff2a5f',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                            }
                        });
                    }
                } else {
                    console.error('Directions request failed due to ' + status);
                }
            }
        );
    };

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

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[90rem] mx-auto pb-12 px-4 sm:px-6 relative">
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
                onLoad={initMap}
            />

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
                        Active Route Optimization Tracking
                    </p>
                </div>
                <div className="px-6 py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] rounded-2xl flex items-center gap-3 shadow-[0_0_15px_rgba(0,245,255,0.2)] font-bold text-xs uppercase tracking-widest">
                    <Navigation className="w-4 h-4 animate-pulse" />
                    Status: {dispatch.status}
                </div>
            </div>

            {/* Main Stage: Map & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px] lg:h-[600px]">
                {/* Map Section */}
                <div className="lg:col-span-2 relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-full flex flex-col bg-[#0a1930] rounded-3xl overflow-hidden border border-white/10">
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                            <MapIcon className="w-4 h-4 text-[#00f5ff]" />
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Optimized Route</span>
                        </div>
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

                    <div className="flex-1 h-full min-h-[400px] w-full" ref={mapRef}>
                        {/* Map is injected here */}
                    </div>
                </div>

                {/* Details Section */}
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
                                    {routeDetails ? routeDetails.distance : '...'}
                                </div>
                            </div>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center group">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Est. Duration</div>
                                <div className="text-2xl font-light text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                    {routeDetails ? routeDetails.duration : '...'}
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
