import React from "react";
import { cn } from "@/lib/utils";

export interface ChatBubbleProps { side: "me" | "peer"; type?: "text" | "photo"; text?: string; image?: string; }

export function ChatBubble({ side, type = "text", text, image }: ChatBubbleProps) {
  const me = side === "me";
  return (
    <div className={cn("flex max-w-[60%]", me ? "ml-auto justify-end" : "justify-start")}>
      {type === "photo" ? (
        <div
          className="w-[200px] h-[260px] rounded-card bg-bg-subtle"
          style={image ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
      ) : (
        <div
          className={cn(
            "px-4 py-3 rounded-card text-[14px] leading-[1.6]",
            me
              ? "bg-primary text-text-inverse rounded-br-xs"
              : "bg-bg-subtle text-text rounded-bl-xs"
          )}
        >
          {text}
        </div>
      )}
    </div>
  );
}

export default ChatBubble;
