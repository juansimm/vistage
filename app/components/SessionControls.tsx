"use client";
import React, { useState } from "react";
import { SessionState } from "../lib/types";
import { AgentControls } from "./AgentControls";
import { VoiceSettings } from "./VoiceSettings";
import { UserRecorder } from "./UserRecorder";

interface SessionControlsProps {
  sessionState: SessionState;
  onStartSession: () => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => void;
  currentPhase: string | null;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  sessionState,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onEndSession,
  currentPhase
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = () => {
    if (!currentPhase) return null;
    
    const phaseNames: Record<string, string> = {
      presentacion: "Presentación del Caso",
      preguntas: "Preguntas",
      recomendaciones: "Recomendaciones"
    };
    
    return phaseNames[currentPhase] || currentPhase;
  };

  const handleEndSession = async () => {
    setIsSaving(true);
    setSaveStatus('Guardando conversación automáticamente...');
    
    try {
      await onEndSession();
      setSaveStatus('✅ Conversación guardada automáticamente');
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      setSaveStatus('❌ Error al guardar la conversación');
      
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => {
        setSaveStatus(null);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-yellow-400 mb-4 text-center tracking-wide drop-shadow-glowYellow">
        Controles de Sesión
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Session Status */}
        <div className="p-4 glass rounded-xl border border-stone-600/30 backdrop-blur-sm bg-stone-800/40">
          <h4 className="font-medium text-stone-200 mb-3 text-center text-sm tracking-wide">Estado de la Sesión</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 px-3 bg-stone-700/40 rounded-lg border border-stone-600/30">
              <span className="text-stone-400 text-xs">Estado:</span>
              <span className={`font-medium text-xs ${
                sessionState.isActive ? 'text-green-400 drop-shadow-glowGreen' : 'text-stone-400'
              }`}>
                {sessionState.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {sessionState.currentPhase && (
              <div className="flex justify-between items-center py-2 px-3 bg-stone-700/40 rounded-lg border border-stone-600/30">
                <span className="text-stone-400 text-xs">Fase:</span>
                <span className="text-yellow-400 font-medium text-xs">
                  {getPhaseInfo()}
                </span>
              </div>
            )}
            {sessionState.isActive && (
              <div className="flex justify-between items-center py-2 px-3 bg-stone-700/40 rounded-lg border border-stone-600/30">
                <span className="text-stone-400 text-xs">Duración:</span>
                <span className="text-stone-200 font-medium text-xs">
                  {formatTime(sessionState.totalDuration)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Controls */}
        <div className="p-4 glass rounded-xl border border-stone-600/30 backdrop-blur-sm bg-stone-800/40">
          <h4 className="font-medium text-stone-200 mb-3 text-center text-sm tracking-wide">Acciones</h4>
          
          {/* Info sobre guardado automático */}
          <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg backdrop-blur-sm">
            <p className="text-xs text-yellow-400 text-center font-medium">
              💾 Las conversaciones se guardan automáticamente al finalizar
            </p>
          </div>
          
          <div className="space-y-3">
            {!sessionState.isActive ? (
              <>
                <button
                  onClick={onStartSession}
                  disabled={!currentPhase}
                  className="w-full px-4 py-3 modern-button disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 text-sm rounded-lg transition-all duration-300 hover:scale-105 font-semibold tracking-wide"
                >
                  🚀 Iniciar Sesión
                </button>
                
                {!currentPhase && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-red-400 text-center font-medium">
                      ⚠️ Selecciona una fase en la pestaña "Fases" para iniciar la sesión
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Microphone Control - Integrated in actions */}
                <div className="flex flex-col items-center gap-2 p-3 glass rounded-lg bg-stone-700/30 relative z-10">
                  <span className="text-xs text-stone-400 font-medium">Control de Micrófono</span>
                  <AgentControls />
                </div>
                
                {/* Voice settings */}
                <div className="mt-2">
                  <VoiceSettings />
                </div>

                {/* User-only recorder */}
                <div className="mt-2">
                  <UserRecorder />
                </div>

                <button
                  onClick={handleEndSession}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 text-white text-sm rounded-lg transition-all duration-300 hover:scale-105 font-semibold tracking-wide ${
                    isSaving 
                      ? 'bg-stone-600 cursor-not-allowed' 
                      : 'mic-inactive hover:shadow-lg hover:shadow-red-500/30'
                  }`}
                >
                  {isSaving ? '💾 Guardando...' : '⏹️ Terminar Sesión'}
                </button>
                
                {/* Save Status Message */}
                {saveStatus && (
                  <div className={`text-center text-xs p-3 rounded-lg backdrop-blur-sm font-medium ${
                    saveStatus.includes('✅') 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30 drop-shadow-glowGreen'
                      : saveStatus.includes('❌')
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30 drop-shadow-glowRed'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 drop-shadow-glowYellow'
                  }`}>
                    {saveStatus}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Session Progress */}
        {sessionState.isActive && (
          <div className="p-4 glass rounded-xl border border-stone-600/30 backdrop-blur-sm bg-stone-800/40">
            <h4 className="font-medium text-stone-200 mb-2 text-center text-sm tracking-wide">Progreso de la Sesión</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-stone-700/50 rounded-full h-2 border border-stone-600/30">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500 shadow-lg shadow-yellow-500/30"
                  style={{ 
                    width: `${Math.min((sessionState.totalDuration / (sessionState.totalDuration + 60)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <span className="text-white font-medium text-xs">
                {formatTime(sessionState.totalDuration)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
