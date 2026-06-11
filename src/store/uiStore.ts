/**
 * 전역 UI 상태 스토어 (게시글 모달, 사이드 드로어 패널 등).
 */
import { create } from 'zustand'

// 검색·알림 드로어가 동시에 열리지 않도록 단일 상태로 관리한다.
// (각각 boolean으로 두면 둘 다 true가 되는 케이스를 매번 방어해야 함)
type ActivePanel = 'search' | 'notification' | null

interface UIState {
  postModalId: string | null
  // undefined = 썸네일이 있는 spot을 모달 로드 후 자동 탐색, number = 해당 spot 바로 오픈
  postModalSpotIdx: number | undefined
  openPostModal: (postId: string, spotIdx?: number) => void
  closePostModal: () => void

  activePanel: ActivePanel
  setActivePanel: (panel: ActivePanel) => void
  closePanel: () => void
}

export const useUIStore = create<UIState>((set) => ({
  postModalId: null,
  postModalSpotIdx: undefined,
  openPostModal: (postId, spotIdx) => set({ postModalId: postId, postModalSpotIdx: spotIdx }),
  closePostModal: () => set({ postModalId: null, postModalSpotIdx: undefined }),

  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
  closePanel: () => set({ activePanel: null }),
}))
