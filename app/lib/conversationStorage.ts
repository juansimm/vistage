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
