"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ConversationMeta, ConversationFile, ConvMessage } from "@/app/lib/types";
import { listConversations, loadConversation, buildExecutiveSummary } from "@/app/lib/conversationStorage";
import { useWebSocketContext } from "@/app/context/WebSocketContext";

interface ConversationPickerProps {
  className?: string;
}

export const ConversationPicker: React.FC<ConversationPickerProps> = ({ className = "" }) => {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationMeta[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "live" | "useronly">("all");
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationMeta | null>(null);
  const [previewMessages, setPreviewMessages] = useState<ConvMessage[]>([]);
  const [injecting, setInjecting] = useState(false);

  const { injectContext } = useWebSocketContext();

  // Cargar conversaciones
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listConversations(modeFilter);
      setConversations(data);
      setFilteredConversations(data);
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [modeFilter]);

  // Filtrar conversaciones
  useEffect(() => {
    if (!searchTerm) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv => 
        conv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(conv.endedAt).toLocaleDateString().includes(searchTerm)
      );
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations]);

  // Cargar conversaciones cuando cambie el filtro
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Cargar preview de mensajes
  const loadPreview = useCallback(async (conversation: ConversationMeta) => {
    try {
      const data = await loadConversation(conversation.id);
      setPreviewMessages(data.messages.slice(-3)); // Últimos 3 mensajes
      setSelectedConversation(conversation);
    } catch (error) {
      console.error("Error cargando preview:", error);
    }
  }, []);

  // Inyectar contexto
  const handleInjectContext = useCallback(async () => {
    if (!selectedConversation) return;
    
    setInjecting(true);
    try {
      const data = await loadConversation(selectedConversation.id);
      const summary = buildExecutiveSummary(data.messages);
      
      await injectContext(summary, data.meta);
      
      // Mostrar toast de éxito
      console.log("Contexto inyectado exitosamente");
      setIsOpen(false);
      setSelectedConversation(null);
      setPreviewMessages([]);
    } catch (error) {
      console.error("Error inyectando contexto:", error);
    } finally {
      setInjecting(false);
    }
  }, [selectedConversation, injectContext]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📚</span>
          <span className="text-sm font-medium text-white">Conversaciones Guardadas</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header con filtros */}
          <div className="p-4 border-b border-gray-600">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              {(["all", "live", "useronly"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setModeFilter(mode)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    modeFilter === mode
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {mode === "all" ? "Todas" : mode === "live" ? "Live" : "User Only"}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Cargando conversaciones...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No hay conversaciones guardadas
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id ? "bg-gray-800" : ""
                  }`}
                  onClick={() => loadPreview(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          conversation.mode === "live" 
                            ? "bg-green-900/30 text-green-400" 
                            : "bg-orange-900/30 text-orange-400"
                        }`}>
                          {conversation.mode === "live" ? "Live" : "User Only"}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          {conversation.phase}
                        </span>
                      </div>
                      <div className="text-sm text-white font-medium mb-1">
                        {conversation.id}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(conversation.endedAt)} • {formatDuration(conversation.durationSec)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Preview y acciones */}
          {selectedConversation && previewMessages.length > 0 && (
            <div className="p-4 border-t border-gray-600 bg-gray-800/50">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-white mb-2">Preview (últimos 3 mensajes):</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {previewMessages.map((msg, index) => (
                    <div key={index} className="text-xs">
                      <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                        msg.role === "user" ? "bg-blue-900/30 text-blue-400" : "bg-purple-900/30 text-purple-400"
                      }`}>
                        {msg.role === "user" ? "U" : "IA"}
                      </span>
                      <span className="text-gray-300">
                        {msg.text.substring(0, 80)}{msg.text.length > 80 ? "..." : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleInjectContext}
                  disabled={injecting}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  {injecting ? "Inyectando..." : "Inyectar como contexto"}
                </button>
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    setPreviewMessages([]);
                  }}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                >
                  Ver completa
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};