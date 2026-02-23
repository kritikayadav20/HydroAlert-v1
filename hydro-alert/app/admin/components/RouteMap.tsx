"use client";

import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom icons to match the old Google Maps style (depot = cyan, destination = red)
const depotIcon = new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#00f5ff;border:2px solid #fff;box-shadow:0 0 10px rgba(0,245,255,0.8);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});
const destinationIcon = new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#ff2a5f;border:2px solid #fff;box-shadow:0 0 10px rgba(255,42,95,0.8);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

function FitBounds({ origin, destination, routeCoordinates }: { origin: { lat: number; lng: number }; destination: { lat: number; lng: number }; routeCoordinates: [number, number][] }) {
    const map = useMap();
    const bounds = useMemo(() => {
        const points: [number, number][] = [[origin.lat, origin.lng], [destination.lat, destination.lng]];
        if (routeCoordinates.length > 0) {
            routeCoordinates.forEach((c) => points.push(c));
        }
        return L.latLngBounds(points);
    }, [origin, destination, routeCoordinates]);
    useEffect(() => {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }, [map, bounds]);
    return null;
}

type RouteMapProps = {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    routeCoordinates: [number, number][];
};

export default function RouteMap({ origin, destination, routeCoordinates }: RouteMapProps) {
    const originLatLng = useMemo(() => [origin.lat, origin.lng] as [number, number], [origin.lat, origin.lng]);
    const destLatLng = useMemo(() => [destination.lat, destination.lng] as [number, number], [destination.lat, destination.lng]);

    return (
        <MapContainer
            center={[origin.lat, origin.lng]}
            zoom={9}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: '#0a1930' }}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <FitBounds origin={origin} destination={destination} routeCoordinates={routeCoordinates} />
            <Marker position={originLatLng} icon={depotIcon} />
            <Marker position={destLatLng} icon={destinationIcon} />
            {routeCoordinates.length > 1 && (
                <Polyline
                    positions={routeCoordinates}
                    pathOptions={{
                        color: '#00f5ff',
                        weight: 5,
                        opacity: 0.8,
                    }}
                />
            )}
        </MapContainer>
    );
}
