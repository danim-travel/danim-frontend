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
  // variant 교체(dedup) 시 ToastProvider의 useEffect deps로 타이머를 리셋하기 위한 타임스탬프
  updatedAt: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (item: Omit<ToastItem, "id" | "updatedAt">) => string;
  removeToast: (id: string) => void;
}

export const DEFAULT_DURATION = 3000;

// 동일 메시지 중복 시 더 높은 우선순위 variant로 교체
const VARIANT_PRIORITY: Record<ToastVariant, number> = {
  error: 2,  // 에러 1순위
  default: 1,  //  디폴드 2순위
  success: 0,  // 성공 3순위
};

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (item) => {
    const existing = get().toasts.find((t) => t.message === item.message);

    if (existing) {
      // 더 높은 우선순위면 기존 토스트 variant 교체 + 타이머 리셋, 아니면 무시
      if (VARIANT_PRIORITY[item.variant] > VARIANT_PRIORITY[existing.variant]) {
        set((state) => ({
          toasts: state.toasts.map((t) =>
            t.id === existing.id ? { ...t, variant: item.variant, updatedAt: Date.now() } : t
          ),
        }));
      }
      return existing.id;
    }

    const id = genId();
    set((state) => ({
      toasts: [...state.toasts, { duration: DEFAULT_DURATION, ...item, id, updatedAt: Date.now() }],
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
