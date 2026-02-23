import { NextResponse } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

type SummarizeBody = {
  criticalZones: number;
  activeTankers: number;
  avgWsi: number;
  criticalVillageNames?: string[];
  pendingDispatches?: number;
};

export async function POST(request: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY not set' },
      { status: 503 }
    );
  }

  let body: SummarizeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const {
    criticalZones = 0,
    activeTankers = 0,
    avgWsi = 0,
    criticalVillageNames = [],
    pendingDispatches = 0,
  } = body;

  const context = [
    `Critical zones (WSI > 80): ${criticalZones}.`,
    criticalVillageNames.length ? `Highest-risk villages: ${criticalVillageNames.slice(0, 5).join(', ')}.` : '',
    `Active tankers en route: ${activeTankers}.`,
    `Regional average WSI: ${avgWsi}/100.`,
    pendingDispatches ? `Pending dispatches: ${pendingDispatches}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const systemPrompt = `You are a drought command center assistant. Your response must have exactly two parts:
1. Intro: 2–3 sentences summarising the current regional situation (high-level).
2. Bullets: 4–5 bullet points with specific, actionable items (critical villages, tanker status, recommended actions). Use only the data provided. No greetings or sign-offs. Output as plain text: intro paragraph then a blank line then bullets, each bullet on its own line starting with "- ".`;
  const userPrompt = `Dashboard snapshot: ${context}\n\nGive the intro paragraph then 4–5 bullet points as described.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 450,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Groq API error:', res.status, err);
      return NextResponse.json(
        { error: 'Summary service unavailable' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || 'Unable to generate summary.';
    return NextResponse.json({ summary: text });
  } catch (e: any) {
    console.error('Summarize error:', e);
    return NextResponse.json(
      { error: e?.message ?? 'Summary failed' },
      { status: 500 }
    );
  }
}
