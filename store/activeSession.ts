import { create } from 'zustand';

interface ActiveSessionState {
  activeSessionId: string | null;
  hydrated: boolean;
  setActiveSession: (id: string | null) => void;
  clearActiveSession: () => void;
  setHydrated: (value: boolean) => void;
}

export const useActiveSessionStore = create<ActiveSessionState>()((set) => ({
  activeSessionId: null,
  hydrated: false,
  setActiveSession: (id) => set({ activeSessionId: id }),
  clearActiveSession: () => set({ activeSessionId: null }),
  setHydrated: (value) => set({ hydrated: value }),
}));
