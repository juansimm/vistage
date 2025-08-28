import { Tooltip } from "@nextui-org/react";
import { useCallback } from "react";
import { MicrophoneIcon } from "./icons/MicrophoneIcon";
import { useWebSocketContext } from "../context/WebSocketContext";

export const AgentControls = () => {
  const { startStreaming, stopStreaming, microphoneOpen } =
    useWebSocketContext();

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
  );
};
