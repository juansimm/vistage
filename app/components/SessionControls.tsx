"use client";
import React, { useState } from "react";
import { SessionState } from "../lib/types";
import { AgentControls } from "./AgentControls";

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
      discovery: "Descubrimiento",
      exploration: "Exploración",
      "action-planning": "Plan de Acción"
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
      <h3 className="text-lg font-semibold text-white mb-4 text-center">
        Controles de Sesión
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Session Status */}
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
          <h4 className="font-medium text-white mb-3 text-center text-sm">Estado de la Sesión</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 px-2 bg-gray-700/30 rounded">
              <span className="text-gray-400 text-xs">Estado:</span>
              <span className={`font-medium text-xs ${
                sessionState.isActive ? 'text-green-400' : 'text-gray-400'
              }`}>
                {sessionState.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {sessionState.currentPhase && (
              <div className="flex justify-between items-center py-1 px-2 bg-gray-700/30 rounded">
                <span className="text-gray-400 text-xs">Fase:</span>
                <span className="text-white font-medium text-xs">
                  {getPhaseInfo()}
                </span>
              </div>
            )}
            {sessionState.isActive && (
              <div className="flex justify-between items-center py-1 px-2 bg-gray-700/30 rounded">
                <span className="text-gray-400 text-xs">Duración:</span>
                <span className="text-white font-medium text-xs">
                  {formatTime(sessionState.totalDuration)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Controls */}
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
          <h4 className="font-medium text-white mb-3 text-center text-sm">Acciones</h4>
          
          {/* Info sobre guardado automático */}
          <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400 text-center">
              💾 Las conversaciones se guardan automáticamente al finalizar
            </p>
          </div>
          
          <div className="space-y-3">
            {!sessionState.isActive ? (
              <button
                onClick={onStartSession}
                disabled={!currentPhase}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all duration-200 hover:scale-105"
              >
                🚀 Iniciar Sesión
              </button>
            ) : (
              <>
                {/* Microphone Control - Integrated in actions */}
                <div className="flex flex-col items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-xs text-gray-400 font-medium">Control de Micrófono</span>
                  <AgentControls />
                </div>
                
                <button
                  onClick={handleEndSession}
                  disabled={isSaving}
                  className={`w-full px-4 py-2 text-white text-sm rounded-lg transition-all duration-200 hover:scale-105 ${
                    isSaving 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSaving ? '💾 Guardando...' : '⏹️ Terminar Sesión'}
                </button>
                
                {/* Save Status Message */}
                {saveStatus && (
                  <div className={`text-center text-xs p-2 rounded-lg ${
                    saveStatus.includes('✅') 
                      ? 'bg-green-900/30 text-green-400 border border-green-500'
                      : saveStatus.includes('❌')
                      ? 'bg-red-900/30 text-red-400 border border-red-500'
                      : 'bg-blue-900/30 text-blue-400 border border-blue-500'
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
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
            <h4 className="font-medium text-white mb-2 text-center text-sm">Progreso de la Sesión</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
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
