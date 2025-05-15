import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseLoadingResult {
  isLoading: (key?: string) => boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  withLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>;
}

export const useLoading = (defaultKey: string = 'default'): UseLoadingResult => {
  const [loadingState, setLoadingState] = useState<LoadingState>({});

  const isLoading = useCallback(
    (key: string = defaultKey) => !!loadingState[key],
    [loadingState, defaultKey]
  );

  const startLoading = useCallback(
    (key: string = defaultKey) => {
      setLoadingState((prev) => ({ ...prev, [key]: true }));
    },
    [defaultKey]
  );

  const stopLoading = useCallback(
    (key: string = defaultKey) => {
      setLoadingState((prev) => ({ ...prev, [key]: false }));
    },
    [defaultKey]
  );

  const withLoading = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
      try {
        startLoading(key);
        return await fn();
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}; 