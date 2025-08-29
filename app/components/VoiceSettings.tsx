"use client";
import React, { useState } from "react";
import { useWebSocketContext } from "../context/WebSocketContext";

const DG_VOICES = [
  "aura-2-selena-es",
  "aura-2-luna-en",
  "aura-2-lyra-en",
  "aura-2-aria-en",
  "aura-2-orion-en",
];

export const VoiceSettings: React.FC = () => {
  const { voice, setVoice } = useWebSocketContext();
  const [provider, setProvider] = useState(
    /^(elevenlabs:|11labs:|eleven:)/i.test(voice) ? "elevenlabs" : "deepgram"
  );
  const [dgVoice, setDgVoice] = useState(
    provider === "deepgram" ? voice : DG_VOICES[0]
  );
  const [elevenId, setElevenId] = useState(
    provider === "elevenlabs" ? voice.split(":" )[1] || "" : ""
  );

  const apply = () => {
    if (provider === "deepgram") {
      setVoice(dgVoice);
    } else {
      if (!elevenId.trim()) return;
      setVoice(`elevenlabs:${elevenId.trim()}`);
    }
  };

  return (
    <div className="p-3 glass rounded-lg border border-stone-600/30 bg-stone-800/30">
      <h5 className="text-xs font-medium text-stone-300 mb-2">Voz del Agente</h5>
      <div className="flex items-center gap-3 mb-2">
        <label className="text-xs text-stone-400">Proveedor:</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="bg-stone-800/70 border border-stone-600 text-stone-200 text-xs rounded px-2 py-1"
        >
          <option value="deepgram">Deepgram</option>
          <option value="elevenlabs">ElevenLabs</option>
        </select>
      </div>
      {provider === "deepgram" ? (
        <div className="flex items-center gap-2">
          <select
            value={dgVoice}
            onChange={(e) => setDgVoice(e.target.value)}
            className="flex-1 bg-stone-800/70 border border-stone-600 text-stone-200 text-xs rounded px-2 py-1"
          >
            {DG_VOICES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <button
            onClick={apply}
            className="px-2 py-1 text-xs modern-button text-stone-900 rounded"
          >
            Aplicar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            placeholder="ElevenLabs Voice ID"
            value={elevenId}
            onChange={(e) => setElevenId(e.target.value)}
            className="flex-1 bg-stone-800/70 border border-stone-600 text-stone-200 text-xs rounded px-2 py-1"
          />
          <button
            onClick={apply}
            className="px-2 py-1 text-xs modern-button text-stone-900 rounded"
          >
            Aplicar
          </button>
        </div>
      )}
      <p className="mt-2 text-[10px] text-stone-500">
        Consejo: usa prefijo "elevenlabs:" seguido del Voice ID para ElevenLabs.
      </p>
    </div>
  );
};

