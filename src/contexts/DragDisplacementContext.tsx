import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

interface DisplacementState {
  magnitude: number;
  rotation: { x: number; y: number; z: number };
}

interface DisplacementContextValue {
  subscribe: (callback: () => void) => () => void;
  getState: () => DisplacementState;
  setState: (state: Partial<DisplacementState>) => void;
}

const DragDisplacementContext = createContext<DisplacementContextValue | null>(null);

interface DragDisplacementProviderProps {
  children: ReactNode;
}

export const DragDisplacementProvider = ({ children }: DragDisplacementProviderProps) => {
  const stateRef = useRef<DisplacementState>({
    magnitude: 0,
    rotation: { x: 0, y: 0, z: 0 },
  });

  const listenersRef = useRef<Set<() => void>>(new Set());

  const subscribe = useCallback((callback: () => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  const setState = useCallback((partial: Partial<DisplacementState>) => {
    stateRef.current = { ...stateRef.current, ...partial };
    listenersRef.current.forEach((listener) => listener());
  }, []);

  return (
    <DragDisplacementContext.Provider value={{ subscribe, getState, setState }}>
      {children}
    </DragDisplacementContext.Provider>
  );
};

export const useDragDisplacementStore = (): DisplacementContextValue => {
  const context = useContext(DragDisplacementContext);
  if (!context) {
    throw new Error('useDragDisplacementStore must be used within DragDisplacementProvider');
  }
  return context;
};

export const useDisplacementMagnitude = (): number => {
  const store = useDragDisplacementStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getState().magnitude,
    () => 0
  );
};
