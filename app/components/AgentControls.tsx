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
    <div className="flex flex-col items-center gap-6">
      {/* Microphone Control - Primary Action */}
      <div className="flex flex-col items-center gap-4">
        <h4 className="text-sm font-medium text-stone-300 tracking-wide">Control de Micrófono</h4>
        <div className="relative group">
          <Tooltip showArrow content={microphoneOpen ? "Desactivar micrófono" : "Activar micrófono"}>
            <button
              onClick={(e: any) => microphoneToggle(e)}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ease-out transform hover:scale-110 hover:-translate-y-1 ${
                microphoneOpen
                  ? "mic-inactive animate-pulse"
                  : "mic-active animate-float"
              } border border-stone-600/30`}
            >
              <div className="relative z-10 bg-stone-900/60 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center border border-stone-700/40">
                <MicrophoneIcon
                  micOpen={microphoneOpen}
                  className={`h-7 w-7 transition-all duration-300 ${
                    microphoneOpen ? 'text-red-400 drop-shadow-glowRed' : 'text-green-400 drop-shadow-glowGreen'
                  }`}
                />
              </div>
            </button>
          </Tooltip>
          {/* Ambient glow effect */}
          <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
            microphoneOpen 
              ? 'bg-red-500/20 animate-ping' 
              : 'bg-green-500/10'
          }`}></div>
        </div>
        <div className="text-center space-y-1">
          <p className={`text-sm font-medium transition-colors duration-300 ${
            microphoneOpen ? 'text-red-400' : 'text-green-400'
          }`}>
            {microphoneOpen ? "Grabando" : "Inactivo"}
          </p>
          <p className="text-xs text-stone-400 opacity-80">
            {microphoneOpen ? "Clic para detener" : "Clic para comenzar"}
          </p>
        </div>
      </div>
    </div>
  );
};
