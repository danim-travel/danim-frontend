"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Toast } from "@/components/common/Toast/Toast";
import { useToastStore, DEFAULT_DURATION, type ToastItem } from "@/store/toastStore";

export type ToastPosition = "bottom-center" | "top-center" | "bottom-left" | "bottom-right";

const positionClasses: Record<ToastPosition, string> = {
  "bottom-center": "fixed bottom-6 left-1/2 -translate-x-1/2 items-center",
  "top-center":    "fixed top-6 left-1/2 -translate-x-1/2 items-center",
  "bottom-left":   "fixed bottom-6 left-6 items-start",
  "bottom-right":  "fixed bottom-6 right-6 items-end",
};

function ToastEntry({ item }: { item: ToastItem }) {
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    const id = setTimeout(() => {
      removeToast(item.id);
    }, item.duration ?? DEFAULT_DURATION);
    return () => clearTimeout(id);
  }, [item.id, item.duration, removeToast]);

  return <Toast variant={item.variant}>{item.message}</Toast>;
}

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
}

export function ToastProvider({ children, position = "bottom-center" }: ToastProviderProps) {
  const toasts = useToastStore((s) => s.toasts);
  const isMounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <>
      {children}
      {isMounted &&
        createPortal(
          <div className={`flex flex-col gap-2 z-[9999] ${positionClasses[position]}`}>
            {toasts.map((t) => (
              <ToastEntry key={t.id} item={t} />
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export default ToastProvider;
