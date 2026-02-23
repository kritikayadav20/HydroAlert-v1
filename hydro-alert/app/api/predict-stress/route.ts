import { NextResponse } from 'next/server';
import { processAllVillagesStress } from '@/lib/stressEngine';

export async function POST() {
    try {
        const results = await processAllVillagesStress();
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Error calculating stress indices:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
