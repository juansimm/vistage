import { Message } from "ai/react";
import { TextContent } from "./TextContext";
import { UserAvatar } from "./UserAvatar";

export const RightBubble = ({
  message,
  text,
}: {
  message?: Message;
  text?: string;
}) => {
  return (
    <>
      <div className="col-start-1 col-end-13 md:p-3">
        <div className="flex flex-row justify-end">
          <div className="flex justify-end md:justify-start gap-2 flex-col md:flex-row-reverse">
            <div className="self-end md:self-start h-6 w-6 text-white shrink-0 pt-1 mt-1 rounded-full bg-stone-900 border border-yellow-400/30 overflow-hidden">
              <UserAvatar />
            </div>
            <div className="glass relative text-sm py-3 px-4 shadow-lg rounded-s-xl rounded-ee-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-md">
              <div className="text-sm font-normal text-stone-100 markdown word-break leading-relaxed">
                <TextContent text={message?.content ?? text ?? ""} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
