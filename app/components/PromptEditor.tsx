"use client";
import React, { useEffect } from "react";
import { DEFAULT_PROMPTS } from "../lib/constants";

interface PromptEditorProps {
  currentPhase: string | null;
  onPromptUpdate: (prompt: string) => void;
  isSessionActive: boolean;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  currentPhase,
  onPromptUpdate,
  isSessionActive
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
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-600">
        <p className="text-gray-400 text-center text-sm">
          Selecciona una fase para ver el prompt de coaching
        </p>
      </div>
    );
  }

  const defaultPrompt = DEFAULT_PROMPTS[currentPhase as keyof typeof DEFAULT_PROMPTS];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 text-center">
        Prompt de Coaching - {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
      </h3>
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-600">
        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
          {defaultPrompt}
        </p>
      </div>
    </div>
  );
};
