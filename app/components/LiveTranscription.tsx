"use client";
import React, { useEffect, useRef } from "react";

interface Message {
  content: string;
  role: string;
  audio?: ArrayBuffer;
  voice?: string;
  id: number | string;
}

interface LiveTranscriptionProps {
  messages: Message[];
  currentSpeaker: string | null;
  isSessionActive: boolean;
}

export const LiveTranscription: React.FC<LiveTranscriptionProps> = ({
  messages,
  currentSpeaker,
  isSessionActive
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log("LiveTranscription render:", { 
    messagesCount: messages.length, 
    isSessionActive, 
    currentSpeaker,
    messages: messages.slice(0, 2) // Log first 2 messages
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          Transcripción en Vivo
        </h3>
        <div className="flex items-center gap-3">
          {currentSpeaker === "user" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 rounded-lg border border-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Usuario hablando</span>
            </div>
          )}
          {currentSpeaker === "model" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/30 rounded-lg border border-purple-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-400">IA procesando</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-lg border border-gray-600 p-4 h-96 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <div className="text-2xl mb-3">💬</div>
            <p className="text-base mb-2">La conversación aparecerá aquí...</p>
            <p className="text-xs text-gray-500">Estado: {isSessionActive ? 'Sesión activa' : 'Sesión inactiva'}</p>
            <p className="text-xs text-gray-500 mt-1">Mensajes recibidos: {messages.length}</p>
            {/* Test message for debugging */}
            <div className="mt-4 p-3 bg-blue-900/30 border-l-4 border-blue-500 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium bg-blue-600 text-white">
                  T
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-400">
                      Test
                    </span>
                    <span className="text-xs text-gray-500">
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
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-900/30 border-l-4 border-blue-500"
                    : "bg-purple-900/30 border-l-4 border-purple-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-purple-600 text-white"
                  }`}>
                    {message.role === "user" ? "U" : "IA"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${
                        message.role === "user" ? "text-blue-400" : "text-purple-400"
                      }`}>
                        {message.role === "user" ? "Usuario" : "Vistage AI"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Live indicator */}
      {isSessionActive && (
        <div className="sticky bottom-0 mt-4 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm py-2 rounded-t-lg border-t border-gray-600">
          <div className="flex items-center gap-3 text-green-400 text-sm px-4 py-2 bg-green-900/20 rounded-lg border border-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Transcribiendo en vivo
          </div>
          <div className="text-gray-400 text-xs ml-4">
            Latencia: ~200ms
          </div>
        </div>
      )}
    </div>
  );
};
