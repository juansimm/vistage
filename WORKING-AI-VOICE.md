# WORKING AI VOICE SYSTEM - Implementation Guide

This document describes the complete working implementation of the AI voice conversation system. This system successfully handles real-time audio streaming, WebSocket communication, and conversation flow.

## 🏗️ System Architecture

### Core Components
- **WebSocketContext**: Central state management and WebSocket handling
- **AgentControls**: Microphone control and UI components
- **ConversationAgent**: Main conversation interface
- **Audio Processing**: Real-time audio capture and streaming

### Key Technologies
- **WebSocket**: Real-time bidirectional communication
- **Web Audio API**: Audio capture and processing
- **Deepgram**: Speech-to-text and text-to-speech services
- **React Context**: State management across components

## 🔧 WebSocketContext Implementation

### State Management
```typescript
// Core state variables
const [connection, setConnection] = useState(false);
const [voice, setVoice] = useState("aura-2-selena-es");
const [model, setModel] = useState("open_ai+gpt-4o-mini");
const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>(null);
const [microphoneOpen, setMicrophoneOpen] = useState(true);
const [chatMessages, setChatMessages] = useState<Message[]>([]);
const [apiKey, setApiKey] = useState<string | null>(null);
```

### Configuration Settings
```typescript
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
```

## 🎤 Audio Processing Pipeline

### Audio Capture Setup
```typescript
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
```

### Audio Playback
```typescript
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
```

## 📡 WebSocket Communication

### Connection Setup
```typescript
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
```

### Message Handling
```typescript
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
          setChatMessages((prev) => [
            ...prev,
            { ...msgObj, id: Date.now().toString() },
          ]);
        } else if (msgObj.content) {
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
                } as Message;
              }
              return updatedMessages;
            });
          } else {
            incomingMessage.current = {
              ...msgObj,
              voice,
              id: Date.now().toString(),
            };
          }
        }
        break;
      case "AgentAudioDone":
        console.log("Agent audio done");
        const ms = { ...incomingMessage.current };
        if (ms && Object.keys(ms).length) {
          setChatMessages((p) => [...p, ms as Message]);
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
    if (incomingMessage.current) {
      incomingMessage.current.audio = incomingMessage.current.audio
        ? concatArrayBuffers(incomingMessage.current.audio, event.data)
        : event.data;
    }
    playAudio(event.data);
  }
}
```

## 🔄 Conversation Flow

### 1. Initialization
- User clicks to start conversation
- `startStreaming()` is called
- Microphone access is requested
- Audio context is created
- WebSocket connection is established

### 2. Audio Streaming
- Audio is captured in real-time (16kHz, mono)
- Converted from float32 to int16 PCM
- Sent as binary data via WebSocket
- Server processes audio and responds

### 3. Message Processing
- **UserStartedSpeaking**: Sets speaker to "user", clears audio
- **AgentThinking**: Sets speaker to "model"
- **ConversationText**: Handles text responses
- **AgentAudioDone**: Finalizes agent message

### 4. Audio Playback
- Received audio is buffered
- Converted back to float32
- Scheduled for playback
- Manages timing to prevent overlap

## 🎯 Key Success Factors

### 1. Simple Audio Processing
- No complex connection checks
- Direct audio streaming
- Minimal processing overhead

### 2. Proper Message Flow
- Clear state management
- Sequential message handling
- Proper cleanup of resources

### 3. WebSocket Management
- Automatic reconnection
- Proper error handling
- Binary data support

### 4. Audio Context Management
- Single audio context per session
- Proper cleanup on stop
- Scheduled audio playback

## 🚫 What NOT to Change

### Critical Elements
1. **Audio processing logic** - Keep the simple float32 to int16 conversion
2. **Message handling switch** - Don't add default cases or extra logging
3. **Dependency arrays** - Keep them minimal and focused
4. **Audio context setup** - Maintain the 16kHz sample rate and mono channel
5. **WebSocket configuration** - Keep the simple retry and error handling

### Avoid Adding
- Complex connection state checks in audio processing
- Extra debugging that might interfere with message flow
- Unnecessary state dependencies
- Complex error handling that might break the flow

## 🔧 Troubleshooting

### Common Issues
1. **Audio not sending**: Check microphone permissions and WebSocket connection
2. **No responses**: Verify API key and server configuration
3. **Audio playback issues**: Check audio context state and timing
4. **Connection drops**: Verify network stability and reconnection logic

### Debug Steps
1. Check browser console for WebSocket connection logs
2. Verify microphone access permissions
3. Check network tab for WebSocket communication
4. Verify audio context state and sample rates

## 📝 Summary

The working system is characterized by:
- **Simplicity**: Minimal, focused code without unnecessary complexity
- **Reliability**: Robust WebSocket handling with automatic reconnection
- **Performance**: Efficient audio processing with minimal overhead
- **Stability**: Proper resource management and cleanup

When implementing changes, always test the core audio streaming and conversation flow to ensure the system remains functional.
