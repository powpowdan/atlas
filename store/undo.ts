import { create } from 'zustand';

export type UndoRestore = () => void | Promise<void>;

interface UndoState {
  label: string | null;
  restore: UndoRestore | null;
  dismiss: () => void;
  performUndo: () => Promise<void>;
}

const DISMISS_AFTER_MS = 5000;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

function clearDismissTimer() {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

export const useUndoStore = create<UndoState>()((set, get) => ({
  label: null,
  restore: null,
  dismiss: () => {
    clearDismissTimer();
    set({ label: null, restore: null });
  },
  performUndo: async () => {
    const { restore } = get();
    clearDismissTimer();
    set({ label: null, restore: null });
    try {
      await restore?.();
    } catch {}
  },
}));

export function showUndoToast(label: string, restore?: UndoRestore): void {
  clearDismissTimer();
  useUndoStore.setState({ label, restore: restore ?? null });
  dismissTimer = setTimeout(() => {
    dismissTimer = null;
    useUndoStore.getState().dismiss();
  }, DISMISS_AFTER_MS);
}
