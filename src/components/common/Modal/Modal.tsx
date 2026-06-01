import React from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  placement?: "center" | "bottom";
  width?: number;
  children?: React.ReactNode;
}

export function Modal({ open, onClose, title, footer, placement = "center", width = 560, children }: ModalProps) {
  if (!open) return null;
  const bottom = placement === "bottom";
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn("fixed inset-0 z-[100] flex justify-center", bottom ? "items-end" : "items-center")}
      style={{ background: "rgba(15,23,32,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex flex-col gap-6 max-w-full",
          bottom
            ? "w-full bg-[var(--sheet-bg)] shadow-[var(--sheet-shadow)] rounded-t-sheet p-6"
            : "bg-[var(--modal-bg)] shadow-modal rounded-modal p-8"
        )}
        style={bottom ? undefined : { width }}
      >
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-bold text-text">{title}</h2>
            <button onClick={onClose} aria-label="닫기" className="bg-transparent border-none cursor-pointer text-text-muted">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="flex gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
