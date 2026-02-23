import { NextResponse } from 'next/server';
import { processAllVillagesStress } from '@/lib/stressEngine';
import { sendWaterStressAlert } from '@/lib/sendAlertEmail';

export async function POST() {
    try {
        const results = await processAllVillagesStress();
        const critical = results.filter((r) => r.newWsi > 80).map((r) => ({ village: r.village, newWsi: r.newWsi }));
        if (critical.length > 0) {
            const sent = await sendWaterStressAlert(critical);
            if (!sent.ok) console.error('Alert email failed:', sent.error);
        }
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Error calculating stress indices:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
