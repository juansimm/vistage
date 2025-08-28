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
      <h3 className="text-xl font-semibold text-white mb-6 text-center">
        Fases de Coaching
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {COACHING_PHASES.map((phase) => (
          <button
            key={phase.id}
            onClick={() => onPhaseChange(phase.id)}
            disabled={isSessionActive}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-300 min-h-[120px] flex flex-col items-center justify-center
              ${currentPhase === phase.id
                ? `border-white bg-gradient-to-r ${phase.color} shadow-lg scale-105`
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-400 hover:bg-gray-700/50'
              }
              ${isSessionActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-102'}
            `}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{phase.icon}</div>
              <h4 className="font-semibold text-white text-xs mb-1 leading-tight">
                {phase.name}
              </h4>
              <p className="text-xs text-gray-300 mb-1 font-medium">
                {phase.duration} min
              </p>
              <div className="text-xs text-gray-400 leading-tight">
                {phase.description}
              </div>
            </div>
            {currentPhase === phase.id && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
