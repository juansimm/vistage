import { Tooltip } from "@nextui-org/react";
import { useCallback } from "react";
import { MicrophoneIcon } from "./icons/MicrophoneIcon";
import { useWebSocketContext } from "../context/WebSocketContext";

export const AgentControls = () => {
  const { 
    startStreaming, 
    stopStreaming, 
    microphoneOpen
  } = useWebSocketContext();

  const microphoneToggle = useCallback(
    async (e: Event) => {
      e.preventDefault();
      console.log("toogle the control");
      if (!microphoneOpen) {
        startStreaming();
      } else {
        stopStreaming();
      }
    },
    [microphoneOpen, startStreaming, stopStreaming]
  );

  console.log("microphone control rendering");

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Microphone Control - Primary Action */}
      <div className="flex flex-col items-center gap-3">
        <h4 className="text-sm font-semibold text-white">🎙️ Control de Micrófono</h4>
        <div className="relative">
          <Tooltip showArrow content={microphoneOpen ? "Desactivar micrófono" : "Activar micrófono"}>
            <button
              onClick={(e: any) => microphoneToggle(e)}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 ${
                microphoneOpen
                  ? "bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30"
                  : "bg-gradient-to-r from-green-500 to-blue-500 shadow-lg shadow-green-500/30"
              }`}
            >
              {microphoneOpen && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-red-600 animate-pulse opacity-75"></div>
              )}
              <div className="relative z-10 bg-gray-900/80 w-16 h-16 rounded-full flex items-center justify-center">
                <MicrophoneIcon
                  micOpen={microphoneOpen}
                  className={`h-8 w-8 ${microphoneOpen ? 'text-red-400' : 'text-green-400'}`}
                />
              </div>
            </button>
          </Tooltip>
        </div>
        <div className="text-center">
          <p className={`text-sm font-medium ${microphoneOpen ? 'text-red-400' : 'text-gray-400'}`}>
            {microphoneOpen ? "🔴 Grabando" : "⚫ Inactivo"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {microphoneOpen ? "Haz clic para detener" : "Haz clic para comenzar"}
          </p>
        </div>
      </div>
    </div>
  );
};
