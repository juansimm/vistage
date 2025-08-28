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
