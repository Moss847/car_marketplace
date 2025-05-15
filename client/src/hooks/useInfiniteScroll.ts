import { useEffect, useRef, useState } from 'react';

interface InfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

interface InfiniteScrollResult {
  containerRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  hasMore: boolean;
}

export const useInfiniteScroll = (
  onLoadMore: () => Promise<void>,
  hasMore: boolean,
  options: InfiniteScrollOptions = {}
): InfiniteScrollResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleIntersect = async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        setIsLoading(true);
        try {
          await onLoadMore();
        } finally {
          setIsLoading(false);
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '100px',
    });

    observerRef.current.observe(container);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, onLoadMore, options.threshold, options.rootMargin]);

  return {
    containerRef,
    isLoading,
    hasMore,
  };
}; 