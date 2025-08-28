import { Tooltip } from "@nextui-org/react";
import { useCallback } from "react";
import { MicrophoneIcon } from "./icons/MicrophoneIcon";
import { useWebSocketContext } from "../context/WebSocketContext";

export const AgentControls = () => {
  const { 
    startStreaming, 
    stopStreaming, 
    microphoneOpen, 
    userTalkOnly, 
    toggleUserTalkOnly 
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
    <div className="space-y-4">
      {/* User Talk Only Toggle */}
      <div className="flex items-center justify-center">
        <Tooltip showArrow content="Solo escucha y transcribe; el agente no habla">
          <button
            onClick={toggleUserTalkOnly}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              userTalkOnly
                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
          >
            <span className="text-lg">🎙️</span>
            <span className="text-sm">
              {userTalkOnly ? "User Talk Only ON" : "User Talk Only"}
            </span>
            {userTalkOnly && (
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            )}
          </button>
        </Tooltip>
      </div>

      {/* Microphone Control */}
      <div className="relative">
        <div className="flex bg-[#101014] rounded-full justify-center">
          <span
            className={`rounded-full p-0.5 ${microphoneOpen
              ? "bg-gradient-to-r bg-gradient to-[#13EF93]/50 from-red-500"
              : "bg-gradient-to-r bg-gradient to-[#13EF93]/50 from-[#149AFB]/80"
              }`}
          >
            <Tooltip showArrow content="Toggle microphone on/off.">
              <a
                href="#"
                onClick={(e: any) => microphoneToggle(e)}
                className={`rounded-full w-16 md:w-20 sm:w-24 py-2 md:py-4 px-2 h-full sm:px-8 font-bold bg-[#101014] text-light-900 text-sm sm:text-base flex items-center justify-center group`}
              >
                {microphoneOpen && (
                  <div className="w-auto items-center justify-center hidden sm:flex absolute shrink-0">
                    <MicrophoneIcon
                      micOpen={microphoneOpen}
                      className="h-5 md:h-6 animate-ping-infinite"
                    />
                  </div>
                )}
                <div className="w-auto flex items-center justify-center shrink-0">
                  <MicrophoneIcon
                    micOpen={microphoneOpen}
                    className="h-5 md:h-6 "
                  />
                </div>
              </a>
            </Tooltip>
          </span>
        </div>
      </div>
    </div>
  );
};
