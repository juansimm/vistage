"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useWebSocketContext } from "../context/WebSocketContext";
import { PhaseSelector } from "./PhaseSelector";
import { PromptEditor } from "./PromptEditor";
import { SessionControls } from "./SessionControls";
import { LiveTranscription } from "./LiveTranscription";

import { AgentControls } from "./AgentControls";
import { ConversationPicker } from "./ConversationPicker";
import { SessionState, CoachingPhase } from "../lib/types";
import { COACHING_PHASES, DEFAULT_PROMPTS } from "../lib/constants";
import { saveConversation, generateConversationId, ConversationData } from "../lib/conversationStorage";

export const VistageAIDashboard: React.FC = () => {
  const {
    startStreaming,
    stopStreaming,
    microphoneOpen,
    chatMessages,
    currentSpeaker,
    connection,
    sendMessage,
    userTalkOnly
  } = useWebSocketContext();

  // State
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    currentPhase: null,
    startTime: null,
    endTime: null,
    isPaused: false,
    totalDuration: 0
  });
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});
  const [showInitialInterface, setShowInitialInterface] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionState.isActive && !sessionState.isPaused) {
      interval = setInterval(() => {
        setSessionState(prev => ({
          ...prev,
          totalDuration: prev.totalDuration + 1
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState.isActive, sessionState.isPaused]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log("VistageAIDashboard state changed:", {
      showInitialInterface,
      sessionState,
      currentPhase,
      chatMessagesCount: chatMessages.length,
      connection
    });
  }, [showInitialInterface, sessionState, currentPhase, chatMessages.length, connection]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Space: mute/unmute mic
      if (event.code === 'Space' && sessionState.isActive) {
        event.preventDefault();
        if (microphoneOpen) {
          stopStreaming();
        } else {
          startStreaming();
        }
      }
      
      // Shift+U: toggle User Talk Only
      if (event.shiftKey && event.code === 'KeyU') {
        event.preventDefault();
        // Aquí necesitaríamos acceso al toggleUserTalkOnly del contexto
        console.log('Atajo Shift+U presionado');
      }
      
      // Cmd/Ctrl+K: Command Palette (placeholder)
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyK') {
        event.preventDefault();
        console.log('Command Palette abierto');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sessionState.isActive, microphoneOpen, startStreaming, stopStreaming]);

  // Session management functions
  const handleStartSession = useCallback(() => {
    if (!currentPhase) return;
    
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
    
    setSessionState({
      isActive: true,
      currentPhase,
      startTime: new Date(),
      endTime: null,
      isPaused: false,
      totalDuration: 0
    });

    setShowInitialInterface(false);
    startStreaming();
  }, [currentPhase, startStreaming]);

  const handlePauseSession = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      isPaused: true
    }));
    
    stopStreaming();
  }, [stopStreaming]);

  const handleResumeSession = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      isPaused: false
    }));
    
    startStreaming();
  }, [startStreaming]);

  const handleEndSession = useCallback(async () => {
    try {
      // Guardar la conversación antes de terminar
      if (conversationId && chatMessages.length > 0) {
        // Determinar el modo basado en el estado actual
        const mode: "live" | "useronly" = userTalkOnly ? "useronly" : "live";
        
        // Generar nombre de archivo con la nueva convención
        const now = new Date();
        const dateTime = now.toISOString()
          .replace(/[-:]/g, '')
          .replace(/\..+/, '')
          .replace('T', '_');
        const filename = `conversation_${mode}_${dateTime}`;
        
        const conversationData: ConversationData = {
          id: filename,
          timestamp: now.toISOString(),
          phase: currentPhase || 'unknown',
          duration: sessionState.totalDuration,
          messages: chatMessages.map((message, index) => ({
            role: message.role,
            content: message.content,
            timestamp: new Date().toISOString(),
            audio: message.audio,
            voice: message.voice
          })),
          sessionState: {
            isActive: sessionState.isActive,
            currentPhase: sessionState.currentPhase,
            startTime: sessionState.startTime?.toISOString() || null,
            endTime: now.toISOString(),
            totalDuration: sessionState.totalDuration
          },
          metadata: {
            llm: "OpenAI GPT-4o-mini",
            voice: "Thalia",
            version: "1.0.0"
          }
        };

        // Usar la nueva función de guardado con metadatos
        const { saveConversationWithMeta } = await import('../lib/conversationStorage');
        
        const meta = {
          id: filename,
          mode,
          startedAt: sessionState.startTime?.toISOString() || now.toISOString(),
          endedAt: now.toISOString(),
          phase: currentPhase as "descubrimiento" | "exploracion" | "plan_accion" || "descubrimiento",
          durationSec: sessionState.totalDuration,
          language: "es",
          participants: ["Usuario", "Vistage AI"]
        };
        
        const convMessages = chatMessages.map((message, index) => ({
          id: `${filename}_msg_${index}`,
          role: message.role as "user" | "assistant" | "system",
          text: message.content,
          ts: message.timestamp || now.toISOString(),
          audio: message.audio,
          voice: message.voice
        }));
        
        await saveConversationWithMeta(meta, convMessages);
        console.log('Conversación guardada exitosamente con metadatos:', filename);
      }
    } catch (error) {
      console.error('Error al guardar la conversación:', error);
    } finally {
      // Terminar la sesión independientemente del resultado del guardado
      setSessionState({
        isActive: false,
        currentPhase: null,
        startTime: null,
        endTime: new Date(),
        isPaused: false,
        totalDuration: 0
      });
      
      stopStreaming();
      setCurrentPhase(null);
      setShowInitialInterface(true);
      setConversationId(null);
    }
  }, [stopStreaming, conversationId, chatMessages, currentPhase, sessionState]);

  const handlePhaseChange = useCallback((phaseId: string) => {
    setCurrentPhase(phaseId);
    
    // Note: System prompt is now handled directly in the WebSocket context
    // using the systemContent from constants
  }, [customPrompts]);

  const handlePromptUpdate = useCallback((prompt: string) => {
    if (!currentPhase) return;
    
    setCustomPrompts(prev => ({
      ...prev,
      [currentPhase]: prompt
    }));
  }, [currentPhase]);

  // Si no hay sesión activa y es la primera vez, mostrar interfaz inicial
  if (!sessionState.isActive) {
    console.log("Showing initial interface", { showInitialInterface, sessionState });
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2">
            Vistage AI
          </h1>
          <p className="text-gray-400 text-lg">
            Tu asistente de coaching ejecutivo inteligente
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Fases de Coaching */}
          <PhaseSelector
            currentPhase={currentPhase}
            onPhaseChange={handlePhaseChange}
            isSessionActive={false}
          />

          {/* Botón de Inicio Principal */}
          <div className="text-center mt-8">
            <button
              onClick={handleStartSession}
              disabled={!currentPhase}
              className={`
                px-8 py-4 text-xl font-bold rounded-lg transition-all duration-300
                ${currentPhase 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:scale-105' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {currentPhase ? '🚀 Iniciar Sesión de Coaching' : 'Selecciona una fase primero'}
            </button>
          </div>

          {/* Editor de Prompts */}
          {currentPhase && (
            <div className="mt-8">
              <PromptEditor
                currentPhase={currentPhase}
                onPromptUpdate={handlePromptUpdate}
                isSessionActive={false}
              />
            </div>
          )}

          {/* Estado de Conexión */}
          <div className="mt-8 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              connection 
                ? 'bg-green-900/30 text-green-400 border border-green-500' 
                : 'bg-red-900/30 text-red-400 border border-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connection ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm">
                {connection ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("Showing main interface", { 
    showInitialInterface, 
    sessionState, 
    currentPhase, 
    chatMessages: chatMessages.length 
  });

  return (
    <div className="bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with LLM and Voice info */}
        <div className="mb-8 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2">
                Vistage AI
              </h1>
              <p className="text-gray-400">
                Tu asistente de coaching ejecutivo inteligente
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg">
                <span className="text-gray-400">LLM:</span>
                <span className="text-green-400 font-medium">OpenAI GPT-4o-mini</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg">
                <span className="text-gray-400">Voice:</span>
                <span className="text-blue-400 font-medium">Thalia</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg">
                <span className="text-gray-400">Estado:</span>
                <span className={`font-medium ${sessionState.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {sessionState.isActive ? '● Activa' : '● Inactiva'}
                </span>
              </div>
              {sessionState.isActive && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-400">Duración:</span>
                  <span className="text-blue-400 font-medium">
                    {Math.floor(sessionState.totalDuration / 60)}:{(sessionState.totalDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Column - Controls (40%) */}
          <div className="xl:col-span-2 space-y-4">
            {/* Phase Selector */}
            <div className="bg-gray-800/30 rounded-lg border border-gray-600 p-3">
              <PhaseSelector
                currentPhase={currentPhase}
                onPhaseChange={handlePhaseChange}
                isSessionActive={sessionState.isActive}
              />
            </div>

            {/* Prompt Editor */}
            <div className="bg-gray-800/30 rounded-lg border border-gray-600 p-3">
              <PromptEditor
                currentPhase={currentPhase}
                onPromptUpdate={handlePromptUpdate}
                isSessionActive={sessionState.isActive}
              />
            </div>

            {/* Session Controls */}
            <div className="bg-gray-800/30 rounded-lg border border-gray-600 p-3">
              <SessionControls
                sessionState={sessionState}
                onStartSession={handleStartSession}
                onPauseSession={handlePauseSession}
                onResumeSession={handleResumeSession}
                onEndSession={handleEndSession}
                currentPhase={currentPhase}
              />
            </div>

            {/* Conversation Picker */}
            <div className="bg-gray-800/30 rounded-lg border border-gray-600 p-3">
              <ConversationPicker />
            </div>
          </div>

          {/* Right Column - Chat (60%) */}
          <div className="xl:col-span-3">
            <div className="bg-gray-800/30 rounded-lg border border-gray-600 p-3 h-full">
              <LiveTranscription
                messages={chatMessages}
                currentSpeaker={currentSpeaker}
                isSessionActive={sessionState.isActive}
              />
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connection ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">
              {connection ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
