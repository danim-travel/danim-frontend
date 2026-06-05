/**
 * 전역 토스트 메시지 스토어.
 * React 컴포넌트 밖에서도 호출 가능하도록 toast 헬퍼를 함께 제공한다.
 */
import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (item: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
}

export const DEFAULT_DURATION = 3000;

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (item) => {
    const id = genId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, duration: DEFAULT_DURATION, ...item },
      ],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

/**
 * React 트리 밖에서도 호출 가능한 토스트 헬퍼.
 * 반환된 id로 수동 제거 가능: useToastStore.getState().removeToast(id)
 */
export const toast = {
  default: (message: string) =>
    useToastStore.getState().addToast({ message, variant: "default" }),
  success: (message: string) =>
    useToastStore.getState().addToast({ message, variant: "success" }),
  error: (message: string) =>
    useToastStore.getState().addToast({ message, variant: "error" }),
};
