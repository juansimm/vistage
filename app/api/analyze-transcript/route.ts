import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Utterance = { start?: number; end?: number; speaker?: number | string; transcript?: string };

// Very simple Spanish stopwords list
const STOPWORDS = new Set([
  'y','de','la','el','los','las','un','una','unos','unas','que','en','a','para','por','con','se','al','del','o','u','es','no','si','ya','lo','su','sus','como','pero','más','menos','muy','también','porque','esto','esta','estas','estos','entre','sobre','sin','desde','hasta','cuando','donde','qué','cuál','cuáles','quién','quienes','yo','tú','usted','ustedes','nosotros','ellos','ellas'
]);

export async function POST(req: NextRequest) {
  try {
    const { transcript, utterances }: { transcript?: string; utterances?: Utterance[] } = await req.json();
    if (!transcript && (!utterances || utterances.length === 0)) {
      return NextResponse.json({ error: 'Missing transcript or utterances' }, { status: 400 });
    }

    // Heuristic analysis fallback (no external API)
    const speakersMap = new Map<string, { count: number; text: string[] }>();
    if (utterances?.length) {
      for (const u of utterances) {
        const sp = String(u.speaker ?? '0');
        if (!speakersMap.has(sp)) speakersMap.set(sp, { count: 0, text: [] });
        const e = speakersMap.get(sp)!;
        e.count += 1;
        if (u.transcript) e.text.push(u.transcript);
      }
    }

    const participants = Array.from(speakersMap.entries()).map(([id, data]) => ({
      id,
      label: `Speaker ${id}`,
      turns: data.count,
      sample: data.text.slice(0, 2),
    }));

    const textForTopics = (utterances?.map(u => u.transcript || '').join(' ') || transcript || '').toLowerCase();
    const terms = textForTopics
      .replace(/[.,;:!?()\[\]{}"'¿¡]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w));
    const freq = new Map<string, number>();
    for (const t of terms) freq.set(t, (freq.get(t) || 0) + 1);
    const topics = Array.from(freq.entries())
      .sort((a,b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }));

    const summary = {
      participants,
      topics,
      suggestions: [
        'Validar nombres reales de los hablantes si se conocen',
        'Revisar temas con baja confianza o ambigüedad',
      ],
    };

    return NextResponse.json({ summary });
  } catch (e) {
    console.error('Analyze transcript failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

