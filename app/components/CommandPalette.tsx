"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ConversationMeta } from "@/app/lib/types";
import { listConversations } from "@/app/lib/conversationStorage";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectContext: (conversation: ConversationMeta) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onInjectContext
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Cargar conversaciones cuando se abre
  useEffect(() => {
    if (isOpen) {
      listConversations().then(setConversations).catch(console.error);
    }
  }, [isOpen]);

  // Filtrar conversaciones
  const filteredConversations = conversations.filter(conv =>
    conv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.phase.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar teclas
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredConversations.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredConversations[selectedIndex]) {
          onInjectContext(filteredConversations[selectedIndex]);
          onClose();
        }
        break;
    }
  }, [isOpen, selectedIndex, filteredConversations, onClose, onInjectContext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset cuando se abre
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-stone-900 border border-stone-600 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-stone-600">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚡</span>
            <input
              type="text"
              placeholder="Buscar conversaciones o comandos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-stone-400 focus:outline-none"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs bg-stone-700 text-stone-300 rounded">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-stone-400">
              {searchTerm ? "No se encontraron conversaciones" : "Escribe para buscar conversaciones"}
            </div>
          ) : (
            <div className="py-2">
              {filteredConversations.map((conversation, index) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    onInjectContext(conversation);
                    onClose();
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-stone-800 transition-colors ${
                    index === selectedIndex ? "bg-stone-800" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">
                        {conversation.id}
                      </div>
                      <div className="text-sm text-stone-400">
                        {conversation.phase} • {new Date(conversation.endedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        conversation.mode === "live" 
                          ? "bg-green-900/30 text-green-400" 
                          : "bg-orange-900/30 text-orange-400"
                      }`}>
                        {conversation.mode === "live" ? "Live" : "User Only"}
                      </span>
                      <span className="text-xs text-stone-500">
                        Inyectar
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-600 text-xs text-stone-400">
          <div className="flex items-center justify-between">
            <span>↑↓ para navegar • Enter para seleccionar</span>
            <span>Cmd+K para abrir</span>
          </div>
        </div>
      </div>
    </div>
  );
};