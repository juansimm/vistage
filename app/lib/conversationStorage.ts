import { ConversationFile, ConversationMeta, ConvMessage } from './types';

export interface ConversationData {
  id: string;
  timestamp: string;
  phase: string;
  duration: number;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    audio?: ArrayBuffer;
    voice?: string;
  }>;
  sessionState: {
    isActive: boolean;
    currentPhase: string | null;
    startTime: string | null;
    endTime: string | null;
    totalDuration: number;
  };
  metadata: {
    llm: string;
    voice: string;
    version: string;
  };
}

export const saveConversation = async (conversationData: ConversationData): Promise<void> => {
  try {
    // Solo guardar en el servidor - sin descarga local
    const response = await fetch('/api/save-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversationData),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Conversación guardada exitosamente en servidor:', result.fileName);
    } else {
      const errorData = await response.json();
      throw new Error(`Error del servidor: ${errorData.message || 'Error desconocido'}`);
    }
    
  } catch (error) {
    console.error('Error al guardar la conversación:', error);
    throw error;
  }
};

export const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Nuevas funciones para el manejo de conversaciones
export const listConversations = async (mode?: "live" | "useronly" | "all"): Promise<ConversationMeta[]> => {
  try {
    const queryParams = mode && mode !== "all" ? `?mode=${mode}` : "";
    const response = await fetch(`/api/conversations/list${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al listar conversaciones:', error);
    throw error;
  }
};

export const loadConversation = async (id: string): Promise<ConversationFile> => {
  try {
    const response = await fetch(`/api/conversations/load?id=${id}`);
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al cargar conversación:', error);
    throw error;
  }
};

export const saveConversationWithMeta = async (
  meta: ConversationMeta, 
  messages: ConvMessage[]
): Promise<void> => {
  try {
    const conversationFile: ConversationFile = { meta, messages };
    const response = await fetch('/api/save-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversationFile),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error del servidor: ${errorData.message || 'Error desconocido'}`);
    }
    
    console.log('Conversación guardada exitosamente con metadatos');
  } catch (error) {
    console.error('Error al guardar la conversación con metadatos:', error);
    throw error;
  }
};

export const buildExecutiveSummary = (messages: ConvMessage[]): { bullets: string[], quotes: string[] } => {
  // Resumen simple en el cliente - se puede mejorar con LLM en el futuro
  const userMessages = messages.filter(m => m.role === "user");
  const assistantMessages = messages.filter(m => m.role === "assistant");
  
  const bullets = [
    `Total de mensajes: ${messages.length}`,
    `Mensajes del usuario: ${userMessages.length}`,
    `Mensajes del asistente: ${assistantMessages.length}`,
    `Duración estimada: ${Math.round(messages.length * 0.5)} minutos`,
    `Tema principal: ${userMessages[0]?.text?.substring(0, 100) || 'No disponible'}...`
  ];
  
  const quotes = messages
    .filter(m => m.text.length > 20)
    .slice(0, 3)
    .map(m => m.text.substring(0, 150) + (m.text.length > 150 ? '...' : ''));
  
  return { bullets, quotes };
};
