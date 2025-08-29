import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Utterance = {
  start?: number;
  end?: number;
  speaker?: number | string;
  transcript?: string;
};

const STOPWORDS = new Set([
  'y','de','la','el','los','las','un','una','unos','unas','que','en','a','para','por','con','se','al','del','o','u','es','no','si','ya','lo','su','sus','como','pero','más','menos','muy','también','porque','esto','esta','estas','estos','entre','sobre','sin','desde','hasta','cuando','donde','qué','cuál','cuáles','quién','quienes','yo','tú','usted','ustedes','nosotros','ellos','ellas'
]);

function heuristicSummary(transcript?: string, utterances?: Utterance[]) {
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
    .replace(/[.,;:!?()\[\]{}\"'ÁÂãÃàÀéÉíÍóÓúÚñÑ]/g, ' ')
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
    topics: topics.map(t => t.word),
    overall: '',
    suggestions: [
      'Validar nombres reales de los hablantes si se conocen',
      'Revisar temas con baja confianza o ambigüedad',
    ],
  };

  return summary;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, utterances }: { transcript?: string; utterances?: Utterance[] } = await req.json();
    if (!transcript && (!utterances || utterances.length === 0)) {
      return NextResponse.json({ error: 'Missing transcript or utterances' }, { status: 400 });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const diarized = (utterances && utterances.length > 0)
      ? utterances
          .filter(u => (u.transcript || '').trim().length > 0)
          .map(u => `[S${String(u.speaker ?? '0')}] ${u.transcript}`)
          .join('\n')
      : (transcript || '');
    // Trim very large inputs to keep model within limits
    const MAX_CHARS = 12000;
    const inputText = diarized.length > MAX_CHARS ? diarized.slice(0, MAX_CHARS) : diarized;

    if (OPENAI_API_KEY) {
      try {
        const systemPrompt = `Eres un analista de reuniones. A partir del transcript, identifica las personas (personas) que hablaron y resume qué aportó cada una. Si hay diarización (S0, S1, etc.), úsala para agrupar; intenta inferir nombres propios si aparecen. Devuelve SOLO JSON con este esquema:
{
  "personas": [
    {
      "speakerTag": "S0",
      "displayName": "Cande",
      "roleHint": "moderador|miembro|presentador|otro",
      "turns": 12,
      "summary": ["..."],
      "notableQuotes": ["..."]
    }
  ],
  "topics": ["tema1", "tema2"],
  "overall": "resumen general en 2-3 oraciones"
}`;

        const body = {
          model: 'gpt-4.1-mini',
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Transcript (abreviado):\n${inputText}` }
          ],
          temperature: 0.2,
          max_output_tokens: 2000,
          text: { format: { type: 'json_object' } },
        } as any;

        const resp = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.warn('OpenAI API error:', resp.status, text);
          const summary = heuristicSummary(transcript, utterances);
          return NextResponse.json({ summary, llm: false });
        }

        const json = await resp.json();
        let parsed: any = null;
        // Prefer explicit JSON content if provided
        try {
          const first = Array.isArray(json.output) ? json.output[0] : null;
          const contentArr: any[] = first?.content || [];
          const jsonItem = contentArr.find((c: any) => c?.json);
          if (jsonItem && typeof jsonItem.json === 'object') {
            parsed = jsonItem.json;
          }
        } catch {}

        // Fallback: parse text fields that contain JSON
        if (!parsed) {
          let raw = '';
          if (json.output_text) {
            raw = json.output_text;
          } else if (Array.isArray(json.output) && json.output[0]?.content?.[0]?.text) {
            raw = json.output[0].content[0].text;
          } else if (json.choices?.[0]?.message?.content) {
            raw = json.choices[0].message.content;
          }
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            const match = String(raw).match(/\{[\s\S]*\}$/);
            if (match) parsed = JSON.parse(match[0]);
          }
        }

        if (!parsed || typeof parsed !== 'object') {
          const summary = heuristicSummary(transcript, utterances);
          return NextResponse.json({ summary, llm: false });
        }

        const normalized = {
          participants: (parsed.personas || []).map((p: any) => ({
            id: String(p.speakerTag || p.id || 'unknown'),
            label: p.displayName || `Speaker ${p.speakerTag || 'unknown'}`,
            turns: p.turns || 0,
            sample: p.notableQuotes?.slice?.(0, 2) || [],
            roleHint: p.roleHint || undefined,
            summary: p.summary || [],
            quotes: p.notableQuotes || [],
          })),
          topics: parsed.topics || [],
          overall: parsed.overall || '',
          suggestions: [
            'Validar nombres reales de los hablantes si se conocen',
          ],
        };

        const hasLlm = true;
        return NextResponse.json({ summary: normalized, llm: hasLlm });
      } catch (err) {
        console.warn('LLM analysis failed, using heuristic fallback:', err);
        const summary = heuristicSummary(transcript, utterances);
        return NextResponse.json({ summary, llm: false });
      }
    }

    const summary = heuristicSummary(transcript, utterances);
    return NextResponse.json({ summary, llm: false });
  } catch (e) {
    console.error('Analyze personas failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
