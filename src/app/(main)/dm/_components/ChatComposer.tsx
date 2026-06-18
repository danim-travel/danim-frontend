"use client"

import { useState, useRef, type ChangeEvent, type KeyboardEvent } from "react"
import { Send, ImagePlus, Smile } from "lucide-react"
import { IconButton } from "@/components/common"

interface Props {
  onSend: (content: string) => void
  onSendImage: (file: File) => Promise<void>
  disabled?: boolean
}

const EMOJIS = ["😀", "😂", "😍", "🥹", "👍", "🙏", "🎉", "✨", "🌊", "🏝️", "☕", "🍜", "📍", "✈️", "❤️", "🔥"]

export function ChatComposer({ onSend, onSendImage, disabled }: Props) {
  const [value, setValue] = useState("")
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDisabled = disabled || isUploading

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isDisabled) return
    onSend(trimmed)
    setValue("")
    setEmojiOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // isComposing=true: 한글 IME 조합 중 Enter → 글자 확정만 하고 전송하지 않음
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    if (isDisabled) return
    const input = inputRef.current
    const start = input?.selectionStart ?? value.length
    const end = input?.selectionEnd ?? value.length
    const next = `${value.slice(0, start)}${emoji}${value.slice(end)}`
    setValue(next)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      const cursor = start + emoji.length
      inputRef.current?.setSelectionRange(cursor, cursor)
    })
  }

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || isDisabled) return

    setEmojiOpen(false)
    setIsUploading(true)
    try {
      await onSendImage(file)
    } finally {
      setIsUploading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="relative flex items-center gap-1 px-3 h-14 border-t border-border shrink-0">
      <div className="relative">
        <IconButton
          icon={<Smile size={20} />}
          aria-label="이모지"
          size="sm"
          onClick={() => !isDisabled && setEmojiOpen(open => !open)}
          disabled={isDisabled}
        />
        {emojiOpen && (
          <div className="absolute bottom-11 left-0 z-10 grid w-52 grid-cols-8 gap-1 rounded-card border border-border bg-bg-card p-2 shadow-modal">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="grid h-6 w-6 place-items-center rounded-control text-body-md hover:bg-bg-subtle"
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지 입력..."
        disabled={isDisabled}
        className="flex-1 bg-transparent outline-none text-body-sm text-text placeholder:text-text-placeholder disabled:cursor-not-allowed"
      />
      {!value.trim() && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <IconButton
            icon={<ImagePlus size={20} />}
            aria-label="이미지 전송"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
          />
        </>
      )}
      <IconButton
        icon={<Send size={18} />}
        aria-label="전송"
        size="sm"
        onClick={handleSend}
        disabled={!value.trim() || isDisabled}
        className={value.trim() ? "text-primary" : "text-text-disabled"}
      />
    </div>
  )
}
