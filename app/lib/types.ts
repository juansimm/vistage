import { Message } from "ai";

export interface MessageMetadata extends Partial<Message> {
  start?: number;
  response?: number;
  end?: number;
  ttsModel?: string;
}

// Vistage AI Types
export interface CoachingPhase {
  id: string;
  name: string;
  description: string;
  objective: string;
  duration: number; // in minutes
  color: string;
  icon: string;
}

export interface SessionState {
  isActive: boolean;
  currentPhase: string | null;
  startTime: Date | null;
  endTime: Date | null;
  isPaused: boolean;
  totalDuration: number; // in seconds
}

export interface AudioVisualizerData {
  frequency: number;
  amplitude: number;
  timestamp: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  phase: string;
  isCustom: boolean;
}

// Nuevos tipos para conversaciones
export interface ConvMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  ts: string; // ISO
  audio?: ArrayBuffer;
  voice?: string;
}

export interface ConversationMeta {
  id: string; // mismo basename del archivo
  mode: "live" | "useronly";
  startedAt: string; // ISO
  endedAt: string;   // ISO
  phase: "descubrimiento" | "exploracion" | "plan_accion";
  durationSec: number;
  language?: "es" | "en" | "mix";
  participants?: string[];
}

export interface ConversationFile {
  meta: ConversationMeta;
  messages: ConvMessage[];
}

export interface InjectedContextState {
  conversationId: string;
  injectedAt: string;
  summaryTokens: number;
}
