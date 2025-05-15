import { useState, useCallback } from 'react';

interface ErrorState {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

interface UseErrorResult {
  error: ErrorState | null;
  setError: (error: ErrorState | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

export const useError = (): UseErrorResult => {
  const [error, setError] = useState<ErrorState | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError({
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
      });
    } else if (typeof error === 'string') {
      setError({ message: error });
    } else {
      setError({
        message: 'An unexpected error occurred',
        details: error as Record<string, any>,
      });
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError,
  };
}; 