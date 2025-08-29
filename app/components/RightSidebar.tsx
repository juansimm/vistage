"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Utterance = { start?: number; end?: number; speaker?: number | string; transcript?: string };

type AnalysisSummary = {
  participants: Array<{
    id: string;
    label: string;
    turns: number;
    sample?: string[];
    roleHint?: string;
    summary?: string[];
    quotes?: string[];
  }>;
  topics?: string[];
  overall?: string;
  suggestions?: string[];
};

export const RightSidebar: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localTranscript, setLocalTranscript] = useState<string>("");
  const [localUtterances, setLocalUtterances] = useState<Utterance[] | undefined>(undefined);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen to analysis coming from KnowledgeBase via custom event
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail) setAnalysis(e.detail as AnalysisSummary);
    };
    // @ts-ignore
    window.addEventListener("personaAnalysisReady", handler);
    return () => {
      // @ts-ignore
      window.removeEventListener("personaAnalysisReady", handler);
    };
  }, []);

  const handleChooseFile = () => fileInputRef.current?.click();

  const onFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setFileName(f.name);
    const text = await f.text();
    try {
      if (f.name.toLowerCase().endsWith(".json")) {
        const obj = JSON.parse(text);
        if (typeof obj.transcript === 'string') {
          setLocalTranscript(obj.transcript);
          const utt = obj.metadata?.utterances || obj.utterances || [];
          if (Array.isArray(utt)) setLocalUtterances(utt as Utterance[]);
        } else {
          setLocalTranscript(JSON.stringify(obj));
          setLocalUtterances(undefined);
        }
      } else {
        // Treat as plain text / md
        setLocalTranscript(text);
        setLocalUtterances(undefined);
      }
    } catch (e) {
      setLocalTranscript(text);
      setLocalUtterances(undefined);
    }
  };

  const runAnalysis = async () => {
    if (!localTranscript || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: localTranscript, utterances: localUtterances || [] })
      });
      if (!res.ok) throw new Error('Analyze failed');
      const data = await res.json();
      setAnalysis(data.summary);
    } catch (e: any) {
      alert('Error al analizar: ' + (e?.message || e));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-96 border-l border-stone-700/30 bg-stone-800/60 backdrop-blur-md flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-stone-700/30 flex items-center justify-between glass">
        <h2 className="text-lg font-bold text-yellow-400 tracking-wide">Personas</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleChooseFile}
            className="px-2 py-1 text-xs rounded border border-stone-600 text-stone-300 hover:bg-stone-700/50"
          >
            Cargar .json/.md
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.md,.txt"
            className="hidden"
            onChange={e => onFileChange(e.target.files)}
          />
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || !localTranscript}
            className={`px-2 py-1 text-xs rounded ${isAnalyzing || !localTranscript ? 'text-stone-500 border border-stone-700' : 'text-blue-300 border border-blue-600 hover:bg-blue-900/30'}`}
            title={!localTranscript ? 'Carga un archivo o pega texto' : 'Analizar con LLM'}
          >
            {isAnalyzing ? 'Analizando…' : 'Analizar LLM'}
          </button>
        </div>
      </div>

      {/* Paste area */}
      <div className="p-3 border-b border-stone-700/30 bg-stone-800/30">
        <label className="block text-xs text-stone-400 mb-1">Pegar transcript (opcional)</label>
        <textarea
          value={localTranscript}
          onChange={e => setLocalTranscript(e.target.value)}
          placeholder="Pega tu transcript aquí o carga un archivo JSON con { transcript, metadata.utterances }"
          className="w-full h-20 text-xs p-2 rounded bg-stone-900 border border-stone-700 text-stone-200"
        />
        {fileName && (
          <div className="mt-1 text-[11px] text-stone-400">Archivo: {fileName}</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 bg-stone-800/20 min-h-0" onWheel={e => e.stopPropagation()}>
        {!analysis && (
          <div className="text-xs text-stone-400">
            Sube un transcript, pega texto o ejecuta el análisis desde la izquierda (Knowledge → analizar). Los resultados aparecen aquí.
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {analysis.overall && (
              <div className="p-3 rounded border border-stone-700 bg-stone-900/40">
                <div className="text-xs text-stone-400 mb-1">Resumen general</div>
                <div className="text-sm text-stone-200">{analysis.overall}</div>
              </div>
            )}

            {Array.isArray(analysis.topics) && analysis.topics.length > 0 && (
              <div className="p-3 rounded border border-stone-700 bg-stone-900/40">
                <div className="text-xs text-stone-400 mb-1">Temas principales</div>
                <div className="flex flex-wrap gap-1">
                  {analysis.topics.map((t, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border border-stone-600 text-stone-300 bg-stone-800/60">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {analysis.participants?.map((p) => (
              <div key={p.id} className="p-3 rounded border border-stone-700 bg-stone-900/40">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-semibold text-yellow-300 truncate">{p.label}</div>
                  <div className="text-[11px] text-stone-400">{p.roleHint ? p.roleHint + ' · ' : ''}{p.turns} turnos</div>
                </div>
                {p.summary && p.summary.length > 0 && (
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {p.summary.map((s, i) => (
                      <li key={i} className="text-xs text-stone-200">{s}</li>
                    ))}
                  </ul>
                )}
                {p.quotes && p.quotes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {p.quotes.slice(0,2).map((q, i) => (
                      <blockquote key={i} className="text-xs text-stone-300 italic border-l-2 border-stone-600 pl-2">“{q}”</blockquote>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

