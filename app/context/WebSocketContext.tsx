"use client";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { getToken } from "../lib/helpers";
import { useAuth } from "./Auth";
import { systemContent } from "../lib/constants";

// Types and Interfaces
type ChatMessage = {
  content: string;
  role: string;
  audio?: ArrayBuffer;
  voice?: string;
  id: number | string;
  timestamp?: string;
};

type Speaker = "user" | "user-waiting" | "model" | null;

interface WebSocketContextValue {
  lastMessage: MessageEvent<any> | null;
  readyState: ReadyState;
  connection: boolean;
  voice: string;
  model: string;
  currentSpeaker: Speaker;
  microphoneOpen: boolean;
  chatMessages: ChatMessage[];
  sendMessage: (message: ArrayBuffer | string) => void;
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
  setVoice: (v: string) => void;
  setModel: (v: string) => void;
  replayAudio: (audioData: ArrayBuffer) => (() => void) | undefined;
  injectContext: (summary: { bullets: string[], quotes: string[] }, meta: any) => void;
}

type WebSocketProviderProps = { children: ReactNode };

// Constants
const DEEPGRAM_SOCKET_URL = process.env
  .NEXT_PUBLIC_DEEPGRAM_SOCKET_URL as string;
const PING_INTERVAL = 8000; // 8s

// Context Creation
const WebSocketContext = createContext<WebSocketContextValue | undefined>(
  undefined
);

// Utility functions
const concatArrayBuffers = (buffer1: ArrayBuffer, buffer2: ArrayBuffer) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

// WebSocket Provider Component
export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { token } = useAuth();
  // State
  const [connection, setConnection] = useState(false);
  const [voice, setVoice] = useState("aura-2-selena-es");
  const [model, setModel] = useState("open_ai+gpt-4o-mini");
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>(null);
  const [microphoneOpen, setMicrophoneOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [socketURL, setSocketUrl] = useState(
    `${DEEPGRAM_SOCKET_URL}?t=${Date.now()}`
  );
  const [startTime, setStartTime] = useState(0);
  const [apiKey, setApiKey] = useState<string | null>(null);
  // Removed userTalkOnly functionality

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const incomingMessage = useRef<ChatMessage | null>(null);

  // Config settings
  const [configSettings, setConfigSettings] = useState({
    type: "Settings",
    audio: {
      input: { encoding: "linear16", sample_rate: 16000 },
      output: { encoding: "linear16", sample_rate: 24000, container: "none" }
    },
    agent: {
      language: "es",
      listen: {
        provider: {
          type: "deepgram",
          model: "nova-2"
        }
      },
      think: {
        provider: {
          type: model.split("+")[0],
          model: model.split("+")[1]
        },
        prompt: systemContent
      },
      speak: {
        provider: {
          type: "deepgram",
          model: voice
        }
      }
    }
  });

  // WebSocket setup
  const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(
    socketURL,
    {
      protocols: apiKey ? ["bearer", apiKey] : undefined,
      share: true,
      onOpen: () => {
        console.log("WebSocket connection opened");
        console.log("API Key:", apiKey);
        console.log("Socket URL:", socketURL);
        const socket = getWebSocket();
        if (socket instanceof WebSocket) {
          socket.binaryType = "arraybuffer";
        }
        setConnection(true);
        console.log("Sending initial settings:", configSettings);
        sendMessage(JSON.stringify(configSettings));
        startPingInterval();
      },
      onError: (error) => {
        console.error("WebSocket error:", error);
        console.log("Current API Key:", apiKey);
        console.log("Current Socket URL:", socketURL);
        stopPingInterval();
      },
      onClose: (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        stopPingInterval();
      },
      onMessage: handleWebSocketMessage,
      retryOnError: true,
    }
  );

  // WebSocket message handler
  function handleWebSocketMessage(event: MessageEvent) {
    if (typeof event.data === "string") {
      console.log("Received message:", event.data);
      const msgObj = JSON.parse(event.data);
      const { type: messageType } = msgObj;

      switch (messageType) {
        case "Welcome":
          console.log("Connected to Voice Agent v1", msgObj);
          break;
        case "SettingsApplied":
          console.log("Settings applied successfully", msgObj);
          break;
        case "UserStartedSpeaking":
          console.log("User started speaking");
          setCurrentSpeaker("user");
          clearScheduledAudio();
          incomingMessage.current = null;
          break;
        case "AgentThinking":
          console.log("Agent is thinking");
          setCurrentSpeaker("model");
          break;
        case "ConversationText":
          console.log("Received conversation text:", msgObj);
          if (msgObj.content && msgObj.role === "user") {
            // Always show user messages
            console.log("Adding user message to chat:", msgObj.content);
            const userMessage: ChatMessage = {
              ...msgObj,
              id: Date.now().toString(),
              timestamp: new Date().toISOString()
            };
            setChatMessages((prev) => [...prev, userMessage]);
          } else if (msgObj.content && msgObj.role === "assistant") {
            // Handle assistant messages
            let text = msgObj.content;
            if (incomingMessage.current) {
              incomingMessage.current = {
                ...incomingMessage.current,
                content: incomingMessage.current.content + " " + text,
              };
              setChatMessages((prev) => {
                const updatedMessages = [...prev];
                const index = updatedMessages.findIndex(
                  (item) => item.id === incomingMessage.current?.id
                );
                if (index !== -1) {
                  updatedMessages[index] = {
                    ...incomingMessage.current,
                  } as ChatMessage;
                }
                return updatedMessages;
              });
            } else {
              incomingMessage.current = {
                ...msgObj,
                voice,
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
              };
            }
          }
          break;
        case "AgentAudioDone":
          console.log("Agent audio done");
          const ms = { ...incomingMessage.current };
          if (ms && Object.keys(ms).length) {
            // Agregar mensaje del asistente completado
            setChatMessages((p) => [...p, ms as ChatMessage]);
          }
          setCurrentSpeaker("user-waiting");
          incomingMessage.current = null;
          break;
        case "Warning":
          console.warn("Voice Agent Warning:", msgObj.description);
          break;
        case "Error":
          console.error("Voice Agent Error:", msgObj.description, msgObj.code);
          break;
        case "PromptUpdated":
          console.log("Prompt updated successfully", msgObj);
          break;
        case "SpeakUpdated":
          console.log("Speak configuration updated successfully", msgObj);
          break;
      }
    } else if (event.data instanceof ArrayBuffer) {
      console.log("Received audio data of length:", event.data.byteLength);
      
      // Audio del agente se reproduce normalmente
      
      if (incomingMessage.current) {
        incomingMessage.current.audio = incomingMessage.current.audio
          ? concatArrayBuffers(incomingMessage.current.audio, event.data)
          : event.data;
      }
      playAudio(event.data);
    }
  }

  const playAudio = useCallback(
    (audioData: ArrayBuffer) => {
      if (!audioContextRef.current) return;

      const audioContext = audioContextRef.current;
      const audioDataView = new Int16Array(audioData);

      if (audioDataView.length === 0) {
        console.error("Received audio data is empty.");
        return;
      }

      const audioBuffer = audioContext.createBuffer(
        1,
        audioDataView.length,
        24000
      );
      const audioBufferChannel = audioBuffer.getChannelData(0);

      for (let i = 0; i < audioDataView.length; i++) {
        audioBufferChannel[i] = audioDataView[i] / 32768; // Convert linear16 PCM to float [-1, 1]
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      // Start audio playback
      const currentTime = audioContext.currentTime;
      if (startTime < currentTime) {
        setStartTime(currentTime);
      }
      source.start(startTime);

      // Update the start time for the next audio
      setStartTime((prevStartTime) => prevStartTime + audioBuffer.duration);
      scheduledAudioSourcesRef.current.push(source);
    },
    [startTime]
  );

  const replayAudio = useCallback((audioData: ArrayBuffer) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const audioDataView = new Int16Array(audioData);

    if (audioDataView.length === 0) {
      console.error("Received audio data is empty.");
      audioContext.close();
      return;
    }

    const audioBuffer = audioContext.createBuffer(
      1,
      audioDataView.length,
      48000
    );
    const audioBufferChannel = audioBuffer.getChannelData(0);

    for (let i = 0; i < audioDataView.length; i++) {
      audioBufferChannel[i] = audioDataView[i] / 32768; // Convert linear16 PCM to float [-1, 1]
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    source.onended = () => {
      source.disconnect();
      audioContext.close().catch((error) => {
        console.error("Error closing AudioContext:", error);
      });
    };

    source.start();

    // Return a function to stop playback if needed
    return () => {
      if (source.buffer) {
        source.stop();
        source.disconnect();
      }
      if (audioContext.state !== "closed") {
        audioContext.close().catch((error) => {
          console.error("Error closing AudioContext:", error);
        });
      }
    };
  }, []);

  const clearScheduledAudio = useCallback(() => {
    scheduledAudioSourcesRef.current.forEach((source) => {
      source.stop();
      source.onended = null;
    });
    scheduledAudioSourcesRef.current = [];

    const scheduledAudioMs = Math.round(
      1000 * (startTime - (audioContextRef.current?.currentTime || 0))
    );
    if (scheduledAudioMs > 0) {
      console.log(`Cleared ${scheduledAudioMs}ms of scheduled audio`);
    } else {
      console.log("No scheduled audio to clear.");
    }

    setStartTime(0);
  }, [startTime]);

  // Utility functions
  const startPingInterval = useCallback(() => {
    pingIntervalRef.current = setInterval(() => {
      sendMessage(JSON.stringify({ type: "KeepAlive" }));
    }, PING_INTERVAL);
  }, [sendMessage]);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Streaming functions
  const startStreaming = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported in this browser.");
      return;
    }

    setMicrophoneOpen(true);
    stopPingInterval();

    const audioContext = new AudioContext({
      sampleRate: 16000,
      latencyHint: 'interactive'
    });
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
        },
      });

      streamRef.current = stream;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;

      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        // Convert float32 to int16
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Convert float32 [-1, 1] to int16 [-32768, 32767]
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        console.log("Sending audio chunk of length:", pcmData.length);
        sendMessage(pcmData.buffer);
      };

      microphone.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setMicrophoneOpen(false);
    }
  }, [sendMessage, stopPingInterval]);

  const stopStreaming = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    startPingInterval();
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .catch((err) => console.error("Error closing audio context:", err));
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setConnection(false);
    setCurrentSpeaker(null);
    setMicrophoneOpen(false);
  }, [startPingInterval]);

  const updateVoice = useCallback(
    (newVoice: string) => {
      stopStreaming();
      setVoice(newVoice);
      setCurrentSpeaker(null);
    },
    [stopStreaming]
  );

  const updateModel = useCallback(
    (newModel: string) => {
      stopStreaming();
      setModel(newModel);
      setCurrentSpeaker(null);
    },
    [stopStreaming]
  );

  // toggleUserTalkOnly function removed

  const injectContext = useCallback((summary: { bullets: string[], quotes: string[] }, meta: any) => {
    if (getWebSocket()?.readyState === WebSocket.OPEN) {
      const systemPrompt = `
### Contexto previo (${meta.mode === "useronly" ? "UserOnly" : "Live"})
- Fecha: ${meta.endedAt}
- Fase: ${meta.phase}
- Resumen:
${summary.bullets.join("\n")}
- Citas clave:
${summary.quotes.map((q: string) => `> ${q}`).join("\n")}

Directrices:
- No repitas el resumen textualmente.
- Usá el contexto sólo para enriquecer respuestas y seguimiento.
      `.trim();

      sendMessage(JSON.stringify({
        type: "Prompt",
        system: systemPrompt
      }));
      
      console.log("Contexto inyectado exitosamente:", {
        conversationId: meta.id,
        mode: meta.mode,
        bullets: summary.bullets.length,
        quotes: summary.quotes.length
      });
    } else {
      console.error("No se puede inyectar contexto - WebSocket no está abierto");
    }
  }, [sendMessage, getWebSocket]);



  // Effects

  // Effect to fetch API key
  useEffect(() => {
    if (token) {
      const fetchApiKey = async () => {
        try {
          const apiKey = await getToken(token as string);
          setApiKey(apiKey);
          
          // Programar refresh del token cada 8 minutos (480s)
          const refreshTime = 8 * 60 * 1000; // 8 minutos
          setTimeout(() => {
            console.log("Refrescando token...");
            fetchApiKey();
          }, refreshTime);
        } catch (error) {
          console.error("Failed to fetch API key:", error);
        }
      };

      fetchApiKey();
    }
  }, [token]);

  // Effect to update socket URL when API key is available
  useEffect(() => {
    if (apiKey) {
      setSocketUrl(`${DEEPGRAM_SOCKET_URL}?t=${Date.now()}`);
    }
  }, [apiKey]);

  useEffect(() => {
    const [provider, modelName] = model.split("+");
    const newSettings = {
      ...configSettings,
      agent: {
        ...configSettings.agent,
        think: {
          ...configSettings.agent.think,
          provider: {
            type: provider,
            model: modelName
          },
        },
        speak: {
          provider: {
            type: "deepgram",
            model: voice
          }
        }
      },
    };

    if (JSON.stringify(newSettings) !== JSON.stringify(configSettings)) {
      setConfigSettings(newSettings);
      setSocketUrl(`${DEEPGRAM_SOCKET_URL}?t=${Date.now()}`);
    }
  }, [model, voice, configSettings]);

  useEffect(() => {
    return () => stopPingInterval();
  }, [stopPingInterval]);

  // Context value
  const value = useMemo(
    () => ({
      sendMessage,
      lastMessage,
      readyState,
      startStreaming,
      stopStreaming,
      connection,
      voice,
      model,
      currentSpeaker,
      microphoneOpen,
      chatMessages,
      setModel: updateModel,
      setVoice: updateVoice,
      replayAudio,
      injectContext,
    }),
    [
      sendMessage,
      lastMessage,
      readyState,
      startStreaming,
      stopStreaming,
      connection,
      voice,
      model,
      currentSpeaker,
      microphoneOpen,
      chatMessages,
      updateModel,
      updateVoice,
      replayAudio,
      injectContext,
    ]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook
export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};
