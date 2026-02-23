import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to calculate distance in km using Haversine
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export async function POST(request: Request) {
    try {
        const { action, payload } = await request.json();

        if (action === 'optimize_route') {
            const { villageIds, tankerId } = payload;
            // Fetch villages
            const { data: villages, error: vErr } = await supabase.from('villages').select('*').in('id', villageIds);
            if (vErr) throw vErr;

            // Fetch tanker
            const { data: tankerResp, error: tErr } = await supabase.from('tankers').select('*').eq('id', tankerId).single();
            if (tErr) throw tErr;

            const tanker = tankerResp;

            // Sort villages by distance from tanker's current position (Nearest Neighbor mock)
            let currentLat = tanker.current_lat || 21.1458; // Default Nagpur
            let currentLng = tanker.current_lng || 79.0882;

            let unvisited = [...villages];
            let route = [];
            let totalDistance = 0;

            while (unvisited.length > 0) {
                let nearestDist = Infinity;
                let nearestIdx = -1;

                for (let i = 0; i < unvisited.length; i++) {
                    const v = unvisited[i];
                    const dist = getDistanceFromLatLonInKm(currentLat, currentLng, v.lat, v.lng);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestIdx = i;
                    }
                }

                const nextStop = unvisited.splice(nearestIdx, 1)[0];
                route.push(nextStop);
                totalDistance += nearestDist;
                currentLat = nextStop.lat;
                currentLng = nextStop.lng;
            }

            // Create dispatch logs
            const dispatchLogs = [];
            let delayHours = 1;

            for (const stop of route) {
                const arrivalTime = new Date();
                arrivalTime.setHours(arrivalTime.getHours() + delayHours);

                const { data: log, error: logErr } = await supabase.from('dispatch_logs').insert({
                    tanker_id: tanker.id,
                    village_id: stop.id,
                    status: 'Pending',
                    estimated_arrival: arrivalTime.toISOString(),
                    notes: 'Auto-optimized route segment'
                }).select().single();

                if (logErr) console.error("Error creating dispatch log", logErr);
                else dispatchLogs.push(log);

                delayHours += 2; // Mock adding 2 hours per stop
            }

            // Update tanker status
            await supabase.from('tankers').update({ status: 'En_Route' }).eq('id', tanker.id);

            return NextResponse.json({ success: true, route, totalDistanceKm: Math.round(totalDistance), dispatchLogs });
        }

        if (action === 'complete_dispatch') {
            const { dispatchId } = payload;

            const { data, error } = await supabase.from('dispatch_logs').update({
                status: 'Delivered',
                delivered_at: new Date().toISOString()
            }).eq('id', dispatchId).select().single();

            if (error) throw error;

            // Make tanker available again
            await supabase.from('tankers').update({ status: 'Available' }).eq('id', data.tanker_id);

            return NextResponse.json({ success: true, dispatch: data });
        }

        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

    } catch (error: any) {
        console.error('Dispatch API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
