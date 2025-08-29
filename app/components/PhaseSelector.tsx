"use client";
import React from "react";
import { COACHING_PHASES } from "../lib/constants";
import { CoachingPhase } from "../lib/types";

interface PhaseSelectorProps {
  currentPhase: string | null;
  onPhaseChange: (phaseId: string) => void;
  isSessionActive: boolean;
}

export const PhaseSelector: React.FC<PhaseSelectorProps> = ({
  currentPhase,
  onPhaseChange,
  isSessionActive
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-yellow-400 mb-4 text-center tracking-wide drop-shadow-glowYellow">
        🎯 Fases de la Sesión Vistage
      </h3>
      <div className="space-y-4">
        {COACHING_PHASES.map((phase, index) => (
          <button
            key={phase.id}
            onClick={() => onPhaseChange(phase.id)}
            disabled={isSessionActive}
            className={`
              relative w-full p-5 rounded-xl border-2 transition-all duration-500 flex items-center gap-4 backdrop-blur-sm
              ${currentPhase === phase.id
                ? 'border-yellow-500/60 bg-yellow-500/10 shadow-lg shadow-yellow-500/20 scale-[1.02] border-opacity-100'
                : 'border-stone-600/30 bg-stone-800/20 hover:border-yellow-400/40 hover:bg-stone-700/30'
              }
              ${isSessionActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5'}
            `}
          >
            {/* Número de fase */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
              ${currentPhase === phase.id 
                ? 'bg-yellow-500/20 text-yellow-400 shadow-lg border-2 border-yellow-500/30' 
                : 'bg-stone-700/50 text-stone-400'
              }
            `}>
              {index + 1}
            </div>
            
            {/* Contenido de la fase */}
            <div className="flex-grow text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{phase.icon}</span>
                <h4 className={`font-bold text-base transition-colors duration-300 ${
                  currentPhase === phase.id ? 'text-yellow-400' : 'text-stone-200'
                }`}>
                  {phase.name}
                </h4>
              </div>
              <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                currentPhase === phase.id ? 'text-stone-100' : 'text-stone-400'
              }`}>
                {phase.description}
              </p>
              <p className={`text-xs mt-1 italic transition-colors duration-300 ${
                currentPhase === phase.id ? 'text-stone-300' : 'text-stone-500'
              }`}>
                {phase.objective}
              </p>
            </div>
            
            {/* Indicador de selección */}
            {currentPhase === phase.id && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg drop-shadow-glowYellow">
                  <div className="w-3 h-3 bg-stone-900 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Indicador de progreso */}
      <div className="mt-6 flex justify-center items-center gap-2">
        {COACHING_PHASES.map((phase, index) => (
          <div
            key={phase.id}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              currentPhase === phase.id
                ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30'
                : 'bg-stone-700/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
