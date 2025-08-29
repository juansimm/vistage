"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useWebSocketContext } from "../context/WebSocketContext";
import { LiveTranscription } from "./LiveTranscription";
import { AgentControls } from "./AgentControls";
import { CommandPalette } from "./CommandPalette";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { SessionState, CoachingPhase, ConversationMeta } from "../lib/types";
import { COACHING_PHASES, DEFAULT_PROMPTS } from "../lib/constants";
import { saveConversation, generateConversationId, ConversationData, loadConversation, buildExecutiveSummary } from "../lib/conversationStorage";

// Define a stable layout component outside of the dashboard to avoid remounts
const ShellLayout: React.FC<{
  sidebar: React.ReactNode;
  rightbar?: React.ReactNode;
  showCommandPalette: boolean;
  onClosePalette: () => void;
  onInject: (conversation: ConversationMeta) => void;
  children: React.ReactNode;
}> = ({ sidebar, rightbar, showCommandPalette, onClosePalette, onInject, children }) => (
  <div className="h-full bg-stone-900 text-white flex overflow-hidden">
    {sidebar}
    <div className="flex-1 flex flex-col min-w-0">{children}</div>
    {rightbar}
    <CommandPalette isOpen={showCommandPalette} onClose={onClosePalette} onInjectContext={onInject} />
  </div>
);

export const VistageAIDashboard: React.FC = () => {
  const {
    startStreaming,
    stopStreaming,
    microphoneOpen,
    chatMessages,
    currentSpeaker,
    connection,
    sendMessage,
    injectContext,
    updateSystemPrompt,
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
  const [industryId, setIndustryId] = useState<string>('general');
  const [showInitialInterface, setShowInitialInterface] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      
      // Cmd/Ctrl+K: Command Palette
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyK') {
        event.preventDefault();
        setShowCommandPalette(true);
        console.log('Command Palette abierto');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sessionState.isActive, microphoneOpen, startStreaming, stopStreaming]);

  // Session management functions
  const handleStartSession = useCallback(async () => {
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
    
    // NO iniciar streaming automáticamente - el usuario debe activar el micrófono manualmente
    console.log("Sesión iniciada - esperando activación del micrófono");
  }, [currentPhase]);

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
        console.log('Iniciando guardado de conversación...', {
          conversationId,
          messagesCount: chatMessages.length,
          currentPhase,
          sessionDuration: sessionState.totalDuration
        });

        // Determinar el modo como live siempre
        const mode: "live" | "useronly" = "live";
        
        // Generar nombre de archivo con la nueva convención
        const now = new Date();
        const dateTime = now.toISOString()
          .replace(/[-:]/g, '')
          .replace(/\..+/, '')
          .replace('T', '_');
        const filename = `conversation_${mode}_${dateTime}`;
        
        // Usar la nueva función de guardado con metadatos
        const { saveConversationWithMeta } = await import('../lib/conversationStorage');
        
        const meta = {
          id: filename,
          mode,
          startedAt: sessionState.startTime?.toISOString() || now.toISOString(),
          endedAt: now.toISOString(),
          phase: currentPhase as "descubrimiento" | "exploracion" | "plan_accion" || "descubrimiento",
          durationSec: sessionState.totalDuration,
          language: "es" as const,
          participants: ["Usuario", "Vistage AI"]
        };
        
        const convMessages = chatMessages.map((message, index) => ({
          id: `${filename}_msg_${index}`,
          role: message.role as "user" | "assistant" | "system",
          text: message.content,
          ts: message.timestamp || new Date().toISOString(),
          audio: message.audio,
          voice: message.voice
        }));
        
        console.log('Guardando conversación con datos:', {
          meta,
          messagesCount: convMessages.length,
          firstMessage: convMessages[0]?.text?.substring(0, 50) + '...',
          lastMessage: convMessages[convMessages.length - 1]?.text?.substring(0, 50) + '...'
        });
        
        await saveConversationWithMeta(meta, convMessages);
        console.log('Conversación guardada exitosamente con metadatos:', filename);
      } else {
        console.log('No hay conversación que guardar:', {
          conversationId,
          messagesCount: chatMessages.length
        });
      }
    } catch (error) {
      console.error('Error al guardar la conversación:', error);
      // Mostrar alert al usuario del error
      alert('Error al guardar la conversación: ' + (error as Error).message);
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
    try {
      updateSystemPrompt({ phaseId, industryId, customPrompt: customPrompts[phaseId] });
    } catch {}
  }, [industryId, customPrompts, updateSystemPrompt]);

  const handlePromptUpdate = useCallback((prompt: string) => {
    if (!currentPhase) return;
    
    setCustomPrompts(prev => ({
      ...prev,
      [currentPhase]: prompt
    }));
    // Apply immediately to the agent
    try {
      updateSystemPrompt({ phaseId: currentPhase, industryId, customPrompt: prompt });
    } catch {}
  }, [currentPhase, industryId, updateSystemPrompt]);

  const handleInjectContextFromPalette = useCallback(async (conversation: ConversationMeta) => {
    try {
      const data = await loadConversation(conversation.id);
      const summary = buildExecutiveSummary(data.messages);
      
      await injectContext(summary, data.meta);
      console.log("Contexto inyectado desde Command Palette:", conversation.id);
    } catch (error) {
      console.error("Error inyectando contexto desde Command Palette:", error);
    }
  }, [injectContext]);

  // Build a stable Sidebar element (keeps its state across dashboard re-renders)
  const sidebarEl = (
    <Sidebar
      currentPhase={currentPhase}
      onPhaseChange={handlePhaseChange}
      sessionState={sessionState}
      onStartSession={handleStartSession}
      onPauseSession={handlePauseSession}
      onResumeSession={handleResumeSession}
      onEndSession={handleEndSession}
      onPromptUpdate={handlePromptUpdate}
      isCollapsed={sidebarCollapsed}
      onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      industryId={industryId}
      onIndustryChange={(id) => {
        setIndustryId(id);
        if (currentPhase) {
          updateSystemPrompt({ phaseId: currentPhase, industryId: id, customPrompt: customPrompts[currentPhase] });
        }
      }}
    />
  );

  // Si no hay sesión activa, mostrar interfaz inicial
  if (!sessionState.isActive) {
    return (
      <ShellLayout
        sidebar={sidebarEl}
        rightbar={<RightSidebar />}
        showCommandPalette={showCommandPalette}
        onClosePalette={() => setShowCommandPalette(false)}
        onInject={handleInjectContextFromPalette}
      >
        <div className="flex-1 flex items-center justify-center px-6 py-4 bg-stone-900">
          <div className="max-w-3xl w-full text-center">
            <p className="text-stone-300 text-xl mb-12">
              Tu asistente de coaching ejecutivo personalizado
            </p>

            {/* Quick Start */}
            <div className="border border-stone-700 rounded-lg p-6 mb-8 bg-stone-800/50 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold text-white mb-6">Inicio Rápido</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-3 p-4 border border-stone-700 rounded-lg bg-stone-800/30 backdrop-blur-sm">
                  <span className="text-3xl">1️⃣</span>
                  <h3 className="text-white font-medium">Selecciona una Fase</h3>
                  <p className="text-stone-400 text-sm text-center">Elige la fase de coaching en el sidebar</p>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 border border-stone-700 rounded-lg bg-stone-800/30 backdrop-blur-sm">
                  <span className="text-3xl">2️⃣</span>
                  <h3 className="text-white font-medium">Inicia la Sesión</h3>
                  <p className="text-stone-400 text-sm text-center">Presiona "Iniciar Sesión" en el panel de control</p>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 border border-stone-700 rounded-lg bg-stone-800/30 backdrop-blur-sm">
                  <span className="text-3xl">3️⃣</span>
                  <h3 className="text-white font-medium">Activa el Micrófono</h3>
                  <p className="text-stone-400 text-sm text-center">Haz clic en el botón del micrófono para empezar</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex justify-center gap-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                connection 
                  ? 'text-green-400 border-green-600 bg-green-500/10' 
                  : 'text-red-400 border-red-600 bg-red-500/10'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connection ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {connection ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-yellow-400 border border-yellow-600 bg-yellow-500/10">
                <span className="text-sm font-medium">Fase: {currentPhase ? COACHING_PHASES.find(p => p.id === currentPhase)?.name : 'No seleccionada'}</span>
              </div>
            </div>
          </div>
        </div>
      </ShellLayout>
    );
  }

  // Layout para sesión activa
  return (
    <ShellLayout
      sidebar={sidebarEl}
      rightbar={<RightSidebar />}
      showCommandPalette={showCommandPalette}
      onClosePalette={() => setShowCommandPalette(false)}
      onInject={handleInjectContextFromPalette}
    >
      {/* Header compacto */}
      <div className="border-b border-stone-700 px-6 py-3 flex items-center justify-between bg-stone-800/50 backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Sesión de Coaching Activa
          </h1>
          {currentPhase && (
            <p className="text-sm text-stone-400">
              Fase: {COACHING_PHASES.find(p => p.id === currentPhase)?.name}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Duración */}
          <div className="flex items-center gap-2 px-3 py-1 border border-yellow-600 rounded text-yellow-400 bg-yellow-500/10">
            <span className="text-sm">⏱️</span>
            <span className="font-mono font-semibold text-sm">
              {Math.floor(sessionState.totalDuration / 60)}:{(sessionState.totalDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-2 px-3 py-1 border border-green-600 rounded text-green-400 bg-green-500/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">En Vivo</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full width chat */}
      <div className="flex-1 p-4 bg-stone-900">
        <div className="h-full border border-stone-700 rounded-lg bg-stone-800/30 backdrop-blur-sm">
          <LiveTranscription
            messages={chatMessages}
            currentSpeaker={currentSpeaker}
            isSessionActive={sessionState.isActive}
            microphoneOpen={microphoneOpen}
            currentPhase={currentPhase}
          />
        </div>
      </div>
    </ShellLayout>
  );
};
