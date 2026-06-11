import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsRowProps {
  title: string
  description: string
  onClick: () => void
  variant?: "default" | "danger"
}

export function SettingsRow({ title, description, onClick, variant = "default" }: SettingsRowProps) {
  const isDanger = variant === "danger"
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-5 py-4 rounded-input border transition-colors text-left",
        isDanger
          ? "bg-(--color-error-bg) border-(--color-border-error) hover:opacity-90"
          : "bg-(--input-bg) border-border hover:bg-bg",
      )}
    >
      <div className="flex flex-col gap-1">
        <span className={cn("text-body-sm font-bold", isDanger ? "text-(--color-error)" : "text-text")}>
          {title}
        </span>
        <span className={cn("text-caption", isDanger ? "text-(--color-error)" : "text-text-muted")}>
          {description}
        </span>
      </div>
      <ChevronRight size={18} className={cn("shrink-0", isDanger ? "text-(--color-error)" : "text-text-muted")} />
    </button>
  )
}
