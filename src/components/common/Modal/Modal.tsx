import React from "react";

/**
 * Modal — 중앙 다이얼로그 (계정삭제 · 비번변경)
 * BottomSheet과 variant로 통합: placement = center | bottom
 * part: overlay · surface
 * tokens: --modal-surface-*, --sheet-surface-*, --radius-modal/sheet, --shadow-modal/sheet
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  placement?: "center" | "bottom";
  width?: number;
  children?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  footer,
  placement = "center",
  width = 560,
  children,
}: ModalProps) {
  if (!open) return null;
  const bottom = placement === "bottom";
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: bottom ? "flex-end" : "center",
        justifyContent: "center",
        background: "rgba(15,23,32,0.45)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: bottom ? "100%" : width,
          maxWidth: "100%",
          background: bottom ? "var(--sheet-surface-bg)" : "var(--modal-surface-bg)",
          boxShadow: bottom ? "var(--sheet-surface-shadow)" : "var(--modal-surface-shadow)",
          borderRadius: bottom
            ? "var(--radius-bottom-sheet) var(--radius-bottom-sheet) 0 0"
            : "var(--radius-modal-comp)",
          padding: bottom ? "var(--bottomsheet-padding)" : "var(--modal-padding)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
        }}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2
              style={{
                fontSize: "var(--text-section-title-size)",
                fontWeight: "var(--text-section-title-weight)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-primary)",
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="닫기"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && (
          <div style={{ display: "flex", gap: "var(--space-3)" }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

export default Modal;
