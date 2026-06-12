"use client"
import type { ReactNode } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SideDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** 위치·너비·z-index 등 레이아웃 전용 클래스 */
  className?: string
}

export function SideDrawer({ open, onClose, title, children, className }: SideDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="side-drawer"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          data-testid="side-drawer"
          className={cn(
            "absolute top-0 h-full bg-bg-card border-r border-border rounded-tr-modal rounded-br-modal shadow-overlay flex flex-col overflow-hidden",
            className
          )}
        >
          <div className="flex items-center justify-between px-8 py-7 shrink-0">
            <h2 className="text-page-title font-bold text-text tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
