"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ConversationMeta, ConversationFile } from "../lib/types";
import { listConversations, loadConversation, buildExecutiveSummary } from "../lib/conversationStorage";
import { useWebSocketContext } from "../context/WebSocketContext";

interface ConversationPickerProps {
  className?: string;
}

export const ConversationPicker: React.FC<ConversationPickerProps> = ({ className = "" }) => {
  const { injectContext } = useWebSocketContext();
  
  // State
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationMeta[]>([]);
  const [selectedMode, setSelectedMode] = useState<"live" | "useronly" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationMeta | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ConversationFile | null>(null);

  // Cargar conversaciones
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listConversations(selectedMode);
      setConversations(data);
      setFilteredConversations(data);
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMode]);

  // Filtrar conversaciones por búsqueda
  const filterConversations = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    const filtered = conversations.filter(conv => 
      conv.id.toLowerCase().includes(query.toLowerCase()) ||
      conv.phase.toLowerCase().includes(query.toLowerCase()) ||
      conv.startedAt.includes(query)
    );
    setFilteredConversations(filtered);
  }, [conversations]);

  // Cargar preview de conversación
  const loadPreview = useCallback(async (conversation: ConversationMeta) => {
    try {
      const data = await loadConversation(conversation.id);
      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      console.error("Error al cargar preview:", error);
    }
  }, []);

  // Inyectar contexto
  const handleInjectContext = useCallback(async (conversation: ConversationMeta) => {
    try {
      const data = await loadConversation(conversation.id);
      const summary = buildExecutiveSummary(data.messages);
      
      await injectContext(summary, data.meta);
      
      // Toast de confirmación (se puede implementar con un contexto de toast)
      alert("Contexto inyectado exitosamente");
      
      // Resetear selección
      setSelectedConversation(null);
      setShowPreview(false);
      setPreviewData(null);
    } catch (error) {
      console.error("Error al inyectar contexto:", error);
      alert("Error al inyectar contexto");
    }
  }, [injectContext]);

  // Effects
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    filterConversations(searchQuery);
  }, [searchQuery, filterConversations]);

  if (isLoading) {
    return (
      <div className={`bg-gray-800/30 rounded-lg border border-gray-600 p-4 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          Cargando conversaciones...
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/30 rounded-lg border border-gray-600 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">
        Conversaciones Guardadas
      </h3>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Búsqueda */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por fecha, fase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro de modo */}
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value as "live" | "useronly" | "all")}
          className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas</option>
          <option value="live">Live</option>
          <option value="useronly">User Only</option>
        </select>
      </div>

      {/* Lista de conversaciones */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            No se encontraron conversaciones
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                selectedConversation?.id === conversation.id
                  ? "bg-blue-900/30 border-blue-500"
                  : "bg-gray-700/30 border-gray-600 hover:bg-gray-700/50"
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      conversation.mode === "useronly" 
                        ? "bg-red-900/50 text-red-400 border border-red-500"
                        : "bg-green-900/50 text-green-400 border border-green-500"
                    }`}>
                      {conversation.mode === "useronly" ? "User Only" : "Live"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(conversation.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-white font-medium">
                    {conversation.phase}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(conversation.durationSec / 60)} min
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadPreview(conversation);
                    }}
                    className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                  >
                    👁️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInjectContext(conversation);
                    }}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                  >
                    💉
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Preview: {previewData.meta.id}
              </h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Metadatos */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Modo:</span>
                  <span className="text-white ml-2">{previewData.meta.mode}</span>
                </div>
                <div>
                  <span className="text-gray-400">Fase:</span>
                  <span className="text-white ml-2">{previewData.meta.phase}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duración:</span>
                  <span className="text-white ml-2">{Math.round(previewData.meta.durationSec / 60)} min</span>
                </div>
                <div>
                  <span className="text-gray-400">Mensajes:</span>
                  <span className="text-white ml-2">{previewData.messages.length}</span>
                </div>
              </div>
            </div>

            {/* Últimos 3 mensajes */}
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-white">Últimos mensajes:</h4>
              {previewData.messages.slice(-3).map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-900/30 border-l-4 border-blue-500"
                      : "bg-purple-900/30 border-l-4 border-purple-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-purple-600 text-white"
                    }`}>
                      {message.role === "user" ? "U" : "IA"}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">
                        {new Date(message.ts).toLocaleTimeString()}
                      </div>
                      <p className="text-white text-sm leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleInjectContext(previewData.meta)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                💉 Inyectar como Contexto
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
