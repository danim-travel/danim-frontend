import React from "react";

/**
 * ChatBubble — DM 메시지 버블
 * side: me | peer · type: text | photo
 * tokens: --color-primary, --color-background-subtle, --radius-*, --text-body
 */
export interface ChatBubbleProps {
  side: "me" | "peer";
  type?: "text" | "photo";
  text?: string;
  image?: string;
  time?: string;
}

export function ChatBubble({ side, type = "text", text, image, time }: ChatBubbleProps) {
  const me = side === "me";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: me ? "flex-end" : "flex-start",
        gap: "var(--space-2)",
        maxWidth: "60%",
        marginLeft: me ? "auto" : 0,
      }}
    >
      {type === "photo" ? (
        <div
          style={{
            width: 200,
            height: 260,
            borderRadius: "var(--radius-card-comp)",
            background: image ? `center/cover url(${image})` : "var(--color-background-subtle)",
          }}
        />
      ) : (
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-card-comp)",
            background: me ? "var(--color-primary)" : "var(--color-background-subtle)",
            color: me ? "var(--color-text-inverse)" : "var(--color-text-primary)",
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--text-body-line)",
            borderBottomRightRadius: me ? "var(--radius-xs)" : undefined,
            borderBottomLeftRadius: me ? undefined : "var(--radius-xs)",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

export default ChatBubble;
