import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWaterStressAlert } from '@/lib/sendAlertEmail';

const SIMULATED_WSI = 85;

/**
 * Simulates a drought: sets one village's WSI above 80 and sends the alert email.
 * Picks the first village from the DB (or one with lowest WSI so the change is visible).
 */
export async function POST() {
    try {
        const { data: villages, error: fetchErr } = await supabase
            .from('villages')
            .select('id, name, water_stress_index')
            .order('water_stress_index', { ascending: true })
            .limit(10);

        if (fetchErr || !villages?.length) {
            return NextResponse.json(
                { success: false, error: 'No villages found' },
                { status: 400 }
            );
        }

        const village = villages[0];
        const { error: updateErr } = await supabase
            .from('villages')
            .update({
                water_stress_index: SIMULATED_WSI,
                updated_at: new Date().toISOString(),
            })
            .eq('id', village.id);

        if (updateErr) {
            return NextResponse.json(
                { success: false, error: updateErr.message },
                { status: 500 }
            );
        }

        const critical = [{ village: village.name, newWsi: SIMULATED_WSI }];
        const sent = await sendWaterStressAlert(critical);

        return NextResponse.json({
            success: true,
            village: village.name,
            wsi: SIMULATED_WSI,
            emailSent: sent.ok,
            emailError: sent.error ?? undefined,
        });
    } catch (error: any) {
        console.error('Simulate drought error:', error);
        return NextResponse.json(
            { success: false, error: error?.message ?? 'Simulation failed' },
            { status: 500 }
        );
    }
}
