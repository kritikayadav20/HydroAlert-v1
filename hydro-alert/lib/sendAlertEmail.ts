import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'kritikayadav727@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HydroAlert <onboarding@resend.dev>';

export type CriticalVillage = { village: string; newWsi: number };

/**
 * Sends an email alert to the admin when one or more villages have WSI > 80.
 * Uses Resend (configure with RESEND_API_KEY).
 */
export async function sendWaterStressAlert(criticalVillages: CriticalVillage[]): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set; skipping email alert.');
    return { ok: false, error: 'RESEND_API_KEY not set' };
  }

  if (criticalVillages.length === 0) return { ok: true };

  const subject = `[HydroAlert] Critical: ${criticalVillages.length} village(s) with WSI > 80`;
  const rows = criticalVillages
    .map((v) => `<tr><td style="padding:8px 12px;border:1px solid #333;">${escapeHtml(v.village)}</td><td style="padding:8px 12px;border:1px solid #333;color:#ff2a5f;font-weight:bold;">${v.newWsi}</td></tr>`)
    .join('');
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>HydroAlert – Critical WSI</title></head>
<body style="font-family:sans-serif;background:#0a1930;color:#e4e4e7;padding:24px;">
  <div style="max-width:560px;margin:0 auto;">
    <h1 style="color:#00f5ff;font-size:1.5rem;">HydroAlert – Water Stress Alert</h1>
    <p style="color:#a1a1aa;">The following village(s) have Water Stress Index (WSI) &gt; 80. Please review and consider dispatch.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:rgba(255,255,255,0.05);">
          <th style="padding:10px 12px;text-align:left;border:1px solid #333;">Village</th>
          <th style="padding:10px 12px;text-align:left;border:1px solid #333;">WSI</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#71717a;font-size:0.875rem;">This is an automated message from HydroAlert. WSI is calculated from rainfall, groundwater, and demand factors.</p>
  </div>
</body>
</html>
  `.trim();

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject,
      html,
    });
    if (error) {
      console.error('Resend send error:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    console.error('Failed to send alert email:', e);
    return { ok: false, error: e?.message || 'Unknown error' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
