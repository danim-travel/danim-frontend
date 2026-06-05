"use client";
import React, { useEffect, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";

export type ModalFooterAlign = "start" | "end" | "stretch";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  footerAlign?: ModalFooterAlign;
  placement?: "center" | "bottom";
  children?: React.ReactNode;
}

const footerAlignClasses: Record<ModalFooterAlign, string> = {
  start: "justify-start",
  end: "justify-end",
  stretch: "[&>*]:flex-1",
};

export function Modal({
  open,
  onClose,
  title,
  footer,
  footerAlign = "end",
  placement = "center",
  children,
}: ModalProps) {
  const bottom = placement === "bottom";
  const titleId = useId();

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={cn(
            "fixed inset-0 z-modal bg-overlay flex justify-center",
            bottom ? "items-end" : "items-center"
          )}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex flex-col gap-6 max-w-full w-full",
              bottom
                ? "bg-(--sheet-bg) shadow-(--sheet-shadow) rounded-t-sheet p-6"
                : "max-w-(--modal-max-width) bg-(--modal-bg) shadow-modal rounded-modal p-8"
            )}
            initial={bottom ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={bottom ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={bottom ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            {title && (
              <div className="flex items-center justify-between">
                <h2 id={titleId} className="text-section-title font-bold text-text">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="닫기"
                  className="bg-transparent border-none cursor-pointer text-text-muted"
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
            <div>{children}</div>
            {footer && (
              <div className={cn("flex gap-3", footerAlignClasses[footerAlign])}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
