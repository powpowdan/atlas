import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message?: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel?: string;
}

interface ConfirmState {
  request: ConfirmOptions | null;
  pendingResolve: ((value: boolean) => void) | null;
  submit: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  request: null,
  pendingResolve: null,
  submit: (value) => {
    const { pendingResolve } = get();
    set({ request: null, pendingResolve: null });
    pendingResolve?.(value);
  },
}));

export function confirm(options: ConfirmOptions): Promise<boolean> {
  const { pendingResolve } = useConfirmStore.getState();
  pendingResolve?.(false);
  return new Promise<boolean>((resolve) => {
    useConfirmStore.setState({ request: options, pendingResolve: resolve });
  });
}
