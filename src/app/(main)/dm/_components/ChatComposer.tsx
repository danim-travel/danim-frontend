"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Send, ImagePlus, Smile } from "lucide-react"
import { IconButton } from "@/components/common"

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatComposer({ onSend, disabled }: Props) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // isComposing=true: 한글 IME 조합 중 Enter → 글자 확정만 하고 전송하지 않음
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-center gap-1 px-3 h-14 border-t border-border shrink-0">
      <IconButton
        icon={<Smile size={20} />}
        aria-label="이모지"
        size="sm"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지 입력..."
        disabled={disabled}
        className="flex-1 bg-transparent outline-none text-body-sm text-text placeholder:text-text-placeholder disabled:cursor-not-allowed"
      />
      {!value.trim() && (
        <IconButton
          icon={<ImagePlus size={20} />}
          aria-label="이미지 전송"
          size="sm"
        />
      )}
      <IconButton
        icon={<Send size={18} />}
        aria-label="전송"
        size="sm"
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className={value.trim() ? "text-primary" : "text-text-disabled"}
      />
    </div>
  )
}
