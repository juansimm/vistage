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
      <h3 className="text-lg font-semibold text-white mb-4 text-center">
        🎯 Fases de la Sesión Vistage
      </h3>
      <div className="space-y-4">
        {COACHING_PHASES.map((phase, index) => (
          <button
            key={phase.id}
            onClick={() => onPhaseChange(phase.id)}
            disabled={isSessionActive}
            className={`
              relative w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center gap-4
              ${currentPhase === phase.id
                ? `${phase.borderColor} bg-gradient-to-r ${phase.color} shadow-xl scale-[1.02] border-opacity-100`
                : 'border-gray-600/50 bg-gray-800/30 hover:border-gray-400/70 hover:bg-gray-700/40'
              }
              ${isSessionActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}
            `}
          >
            {/* Número de fase */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
              ${currentPhase === phase.id 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'bg-gray-700/50 text-gray-400'
              }
            `}>
              {index + 1}
            </div>
            
            {/* Contenido de la fase */}
            <div className="flex-grow text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{phase.icon}</span>
                <h4 className={`font-bold text-base ${
                  currentPhase === phase.id ? 'text-white' : 'text-gray-200'
                }`}>
                  {phase.name}
                </h4>
                <div className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${currentPhase === phase.id 
                    ? `${phase.bgColor} ${phase.textColor}` 
                    : 'bg-gray-700/50 text-gray-400'
                  }
                `}>
                  {phase.duration} min
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${
                currentPhase === phase.id ? 'text-white/90' : 'text-gray-400'
              }`}>
                {phase.description}
              </p>
              <p className={`text-xs mt-1 italic ${
                currentPhase === phase.id ? 'text-white/70' : 'text-gray-500'
              }`}>
                {phase.objective}
              </p>
            </div>
            
            {/* Indicador de selección */}
            {currentPhase === phase.id && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
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
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              currentPhase === phase.id
                ? `bg-gradient-to-r ${phase.color}`
                : 'bg-gray-700/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
