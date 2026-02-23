"use client";
import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, Droplets, MapPin } from 'lucide-react';

// Fix for default Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default?.src || require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png').default?.src || require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png').default?.src || require('leaflet/dist/images/marker-shadow.png'),
});


function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
}

export default function VillageMap({ villages = [], selectedVillageId, onSelectVillage }: any) {
    const [mapKey, setMapKey] = useState('');

    useEffect(() => {
        // This forces React Leaflet to completely remount the MapContainer 
        // during React 18 Strict Mode or Fast Refresh instead of reusing the old DOM node.
        setMapKey(Date.now().toString());
    }, []);

    // Calculate bounding box for Leaflet
    const mapBounds = useMemo(() => {
        if (!villages || villages.length === 0) return null;
        const lats = villages.map((v: any) => v.lat);
        const lngs = villages.map((v: any) => v.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        // Leaflet expects [ [lat1, lng1], [lat2, lng2] ]
        return [[minLat, minLng], [maxLat, maxLng]] as L.LatLngBoundsExpression;
    }, [villages]);

    const getStressColorHex = (wsi: number) => {
        if (wsi > 80) return '#ff2a5f';
        if (wsi > 50) return '#f59e0b';
        return '#00f5ff';
    };

    if (!mapKey) {
        return <div className="w-full h-full rounded-3xl bg-[#0a1930] flex items-center justify-center text-zinc-500">Loading Map Engine...</div>;
    }

    return (
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10" style={{ zIndex: 0 }}>
            <MapContainer
                key={mapKey}
                center={[21.1458, 79.0882]} // Default Nagpur
                zoom={9}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', background: '#0a1930' }}
            >
                {/* Dark matter tile layer for government dashboard aesthetic */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {mapBounds && <ChangeView bounds={mapBounds} />}

                {villages.map((v: any) => {
                    const isSelected = selectedVillageId === v.id;
                    const color = getStressColorHex(v.water_stress_index);
                    const isHighStress = v.water_stress_index > 80;

                    return (
                        <CircleMarker
                            key={v.id}
                            center={[v.lat, v.lng]}
                            radius={isSelected ? 12 : 8}
                            pathOptions={{
                                color: isSelected ? '#ffffff' : color,
                                fillColor: color,
                                fillOpacity: 0.8,
                                weight: isSelected ? 3 : 2
                            }}
                            eventHandlers={{
                                click: () => {
                                    if (onSelectVillage) onSelectVillage(v);
                                },
                            }}
                        >
                            {/* Simple popup override with Tailwind styles */}
                            <Popup className="custom-popup">
                                <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl z-50 pointer-events-none min-w-[200px] -m-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white font-bold text-sm truncate">{v.name}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isHighStress ? 'bg-[#ff2a5f]/20 text-[#ff2a5f]' : v.water_stress_index > 50 ? 'bg-amber-500/20 text-amber-500' : 'bg-[#00f5ff]/20 text-[#00f5ff]'}`}>
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
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>

            <style jsx global>{`
                .leaflet-popup-content-wrapper {
                    background: transparent;
                    box-shadow: none;
                    padding: 0;
                }
                .leaflet-popup-tip-container {
                    display: none;
                }
                .custom-popup .leaflet-popup-close-button {
                    display: none;
                }
            `}</style>
        </div>
    );
}
