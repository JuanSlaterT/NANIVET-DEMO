// Loading Manager - Module-level event system for loading states
// Used by api-client to trigger loading screen from server-compatible code

type Listener = (message: string) => void;

const listeners = new Set<Listener>();
let currentMessage = 'Cargando...';
let isLoading = false;

export const LoadingManager = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  emit(message: string) {
    currentMessage = message;
    listeners.forEach((l) => l(message));
  },

  getState() {
    return { isLoading, message: currentMessage };
  },
};

let _startLoading: ((msg?: string) => void) | null = null;
let _stopLoading: (() => void) | null = null;

export function registerLoadingCallbacks(
  start: (msg?: string) => void,
  stop: () => void
) {
  _startLoading = start;
  _stopLoading = stop;
}

export function startLoading(message: string = 'Cargando...') {
  currentMessage = message;
  isLoading = true;
  LoadingManager.emit(message);
  _startLoading?.(message);
}

export function stopLoading() {
  isLoading = false;
  _stopLoading?.();
}
