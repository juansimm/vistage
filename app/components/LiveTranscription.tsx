"use client";
import React, { useEffect, useRef, useState } from "react";
import { COACHING_PHASES } from "../lib/constants";

interface Message {
  content: string;
  role: string;
  audio?: ArrayBuffer;
  voice?: string;
  id: number | string;
  isStreaming?: boolean;
}

interface LiveTranscriptionProps {
  messages: Message[];
  currentSpeaker: string | null;
  isSessionActive: boolean;
  microphoneOpen?: boolean;
  currentPhase?: string | null;
}

export const LiveTranscription: React.FC<LiveTranscriptionProps> = ({
  messages,
  currentSpeaker,
  isSessionActive,
  microphoneOpen = false,
  currentPhase = null
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [streamingMessages, setStreamingMessages] = useState<{[key: string]: string}>({});
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log("LiveTranscription render:", { 
    messagesCount: messages.length, 
    isSessionActive, 
    currentSpeaker,
    messages: messages.slice(0, 2) // Log first 2 messages
  });

  const scrollToBottom = (force = false) => {
    if (scrollContainerRef.current && (!isUserScrolling || force)) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  // Much simpler scroll handling - just disable auto-scroll when user scrolls manually
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 100;
    
    // If user is not at bottom, disable auto-scroll
    if (!isAtBottom) {
      setIsUserScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Re-enable auto-scroll after 60 seconds (very long timeout)
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 60000);
    } else {
      // User is at bottom - enable auto-scroll
      setIsUserScrolling(false);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    }
  };

  // Simple auto-scroll - only when not manually scrolling
  useEffect(() => {
    if (!isUserScrolling) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 1000); // Much longer delay to be less aggressive
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, isUserScrolling]);

  // Handle streaming text updates - respect scroll lock
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && currentSpeaker === 'model') {
        // Start streaming animation for new assistant messages
        const messageId = lastMessage.id.toString();
        if (!streamingMessages[messageId]) {
          setStreamingMessages(prev => ({
            ...prev,
            [messageId]: ''
          }));
          
          // Animate text reveal
          const text = lastMessage.content;
          let currentIndex = 0;
          
          const streamInterval = setInterval(() => {
            if (currentIndex < text.length) {
              const nextChar = text.charAt(currentIndex);
              setStreamingMessages(prev => ({
                ...prev,
                [messageId]: text.substring(0, currentIndex + 1)
              }));
              currentIndex++;
              
              // Only scroll if not manually scrolling
              if (!isUserScrolling) {
                scrollToBottom();
              }
            } else {
              clearInterval(streamInterval);
              // Remove from streaming after animation completes
              setTimeout(() => {
                setStreamingMessages(prev => {
                  const newStreaming = { ...prev };
                  delete newStreaming[messageId];
                  return newStreaming;
                });
              }, 500);
            }
          }, 30); // Adjust speed (lower = faster)
        }
      }
    }
  }, [messages, currentSpeaker, isUserScrolling]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (!isSessionActive) {
    return (
      <div className="p-8 bg-gray-800/30 rounded-xl border border-gray-600 text-center">
        <div className="text-4xl mb-4">🎤</div>
        <h3 className="text-xl font-semibold text-white mb-3">
          Transcripción en Vivo
        </h3>
        <p className="text-gray-400 text-sm">
          Inicia una sesión para comenzar a ver la transcripción de tu conversación de coaching
        </p>
      </div>
    );
  }

  if (isSessionActive && !microphoneOpen) {
    return (
      <div className="p-8 bg-gray-800/30 rounded-xl border border-gray-600 text-center">
        <div className="text-4xl mb-4">🎙️</div>
        <h3 className="text-xl font-semibold text-white mb-3">
          Sesión Activa
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          La sesión está activa. Activa el micrófono para comenzar la conversación.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 rounded-lg border border-blue-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-blue-400">Presiona el botón del micrófono para comenzar</span>
        </div>
      </div>
    );
  }

  // Obtener información de la fase actual
  const getCurrentPhaseInfo = () => {
    if (!currentPhase) return null;
    return COACHING_PHASES.find(p => p.id === currentPhase);
  };

  const phaseInfo = getCurrentPhaseInfo();

  return (
    <div className="h-full flex flex-col">
      {/* Header fijo - no scrolleable */}
      <div className="flex-shrink-0 p-4 pb-4 border-b border-gray-600 bg-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            💬 Transcripción en Vivo
          </h3>
          <div className="flex items-center gap-3">
            {currentSpeaker === "user" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-500 text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Usuario hablando</span>
              </div>
            )}
            {currentSpeaker === "model" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500 text-purple-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Vivi procesando</span>
              </div>
            )}
          </div>
        </div>

        {/* Indicador de fase actual */}
        {phaseInfo && (
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${phaseInfo.borderColor}`}>
            <span className="text-2xl">{phaseInfo.icon}</span>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <h4 className={`font-bold ${phaseInfo.textColor}`}>
                  Fase Actual: {phaseInfo.name}
                </h4>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${phaseInfo.borderColor} ${phaseInfo.textColor}`}>
                  {phaseInfo.duration} min
                </div>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                {phaseInfo.objective}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Área de mensajes con scroll - flex-1 para ocupar el resto del espacio */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto mt-4 p-4 chat-scroll ${isUserScrolling ? 'user-scrolling' : ''}`}
        onScroll={handleScroll}
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#57534e #1c1917'
        }}
      >
        {/* Scroll to bottom button - always visible when there are messages */}
        {messages.length > 0 && (
          <div className="fixed bottom-20 right-8 z-10">
            <button
              onClick={() => {
                setIsUserScrolling(false);
                scrollToBottom(true);
                // Clear any pending timeouts
                if (scrollTimeoutRef.current) {
                  clearTimeout(scrollTimeoutRef.current);
                }
              }}
              className={`p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                isUserScrolling 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-stone-900' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              title={isUserScrolling ? "Ir al final de la conversación" : "Ir al final"}
            >
              ⬇️
            </button>
          </div>
        )}
        
        {/* Scroll lock indicator */}
        {isUserScrolling && (
          <div className="scroll-lock-indicator">
            🔒 Scroll bloqueado - Haz clic en ⬇️ para ir al final
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-stone-400 py-8">
            <div className="text-2xl mb-3">💬</div>
            <p className="text-base mb-2">La conversación aparecerá aquí...</p>
            <p className="text-xs text-stone-500">Estado: {isSessionActive ? 'Sesión activa' : 'Sesión inactiva'}</p>
            <p className="text-xs text-stone-500 mt-1">Mensajes recibidos: {messages.length}</p>
            <p className="text-xs text-stone-500 mt-1">Micrófono: {microphoneOpen ? 'Activo' : 'Inactivo'}</p>
            <p className="text-xs text-stone-500 mt-1">Speaker actual: {currentSpeaker || 'Ninguno'}</p>
            {/* Test button for debugging */}
            <button
              onClick={() => {
                const testMessage = {
                  content: "Mensaje de prueba " + new Date().toLocaleTimeString(),
                  role: "user",
                  id: Date.now().toString(),
                  timestamp: new Date().toISOString()
                };
                console.log("Adding test message:", testMessage);
                // This will help us see if the message rendering works
              }}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              Agregar Mensaje de Prueba
            </button>
            {/* Test message for debugging */}
            <div className="mt-4 p-3 border-l-4 border-yellow-500 rounded-lg border border-stone-600">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium bg-yellow-500 text-stone-900">
                  T
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-yellow-400">
                      Test
                    </span>
                    <span className="text-xs text-stone-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    Este es un mensaje de prueba para verificar que el componente funciona correctamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  message.role === "user"
                    ? "border-stone-600 border-l-4 border-l-yellow-500"
                    : "border-stone-600 border-l-4 border-l-green-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                    message.role === "user"
                      ? "bg-yellow-500 text-stone-900"
                      : "bg-green-500 text-white"
                  }`}>
                    {message.role === "user" ? "U" : "IA"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${
                        message.role === "user" ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {message.role === "user" ? "Usuario" : "Vistage AI"}
                      </span>
                      <span className="text-xs text-stone-500">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-white text-sm leading-relaxed">
                      {message.role === 'assistant' && streamingMessages[message.id.toString()] !== undefined ? (
                        <>
                          <span>{streamingMessages[message.id.toString()]}</span>
                          <span className="animate-pulse text-yellow-400">|</span>
                        </>
                      ) : (
                        <span>{message.content}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Footer fijo - no scrolleable */}
      {isSessionActive && microphoneOpen && (
        <div className="flex-shrink-0 p-4 border-t border-stone-600 bg-stone-800/50">
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-3 text-green-400 text-sm px-4 py-2 rounded-lg border border-green-500 bg-green-500/10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Transcribiendo en vivo
            </div>
            <div className="text-stone-400 text-xs ml-4">
              Latencia: ~200ms
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
