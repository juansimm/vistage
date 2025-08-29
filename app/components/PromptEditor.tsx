"use client";
import React, { useEffect } from "react";
import { DEFAULT_PROMPTS, INDUSTRIES } from "../lib/constants";

interface PromptEditorProps {
  currentPhase: string | null;
  onPromptUpdate: (prompt: string) => void;
  isSessionActive: boolean;
  industryId: string;
  onIndustryChange: (industryId: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  currentPhase,
  onPromptUpdate,
  isSessionActive,
  industryId,
  onIndustryChange,
}) => {
  // Auto-update the system prompt when phase changes
  useEffect(() => {
    if (currentPhase && DEFAULT_PROMPTS[currentPhase as keyof typeof DEFAULT_PROMPTS]) {
      const defaultPrompt = DEFAULT_PROMPTS[currentPhase as keyof typeof DEFAULT_PROMPTS];
      onPromptUpdate(defaultPrompt);
    }
  }, [currentPhase, onPromptUpdate]);

  if (!currentPhase) {
    return (
      <div className="p-4 bg-stone-800/50 rounded-xl border border-stone-600">
        <p className="text-stone-400 text-center text-sm">
          Selecciona una fase para ver el prompt de coaching
        </p>
      </div>
    );
  }

  const defaultPrompt = DEFAULT_PROMPTS[currentPhase as keyof typeof DEFAULT_PROMPTS];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3 text-center">
        Prompt de Coaching - {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
      </h3>
      {/* Industry selector */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <label className="text-xs text-stone-400">Industria:</label>
        <select
          value={industryId}
          onChange={(e) => onIndustryChange(e.target.value)}
          className="bg-stone-800/70 border border-stone-600 text-stone-200 text-xs rounded px-2 py-1"
          disabled={isSessionActive}
        >
          {INDUSTRIES.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>
      <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-600 max-h-32 overflow-y-auto">
        <p className="text-white text-xs leading-relaxed whitespace-pre-wrap">
          {defaultPrompt}
        </p>
      </div>
    </div>
  );
};
