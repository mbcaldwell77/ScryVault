import { useState, useRef, useCallback } from 'react';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh(config: PullToRefreshConfig) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const touchStart = useRef<number | null>(null);
  const threshold = config.threshold || 80;
  const resistance = config.resistance || 2.5;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStart.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart.current === null || window.scrollY > 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStart.current;

    if (distance > 0) {
      e.preventDefault();
      const pullValue = Math.min(distance / resistance, threshold * 1.5);
      setPullDistance(pullValue);
      setIsPulling(true);
    }
  }, [resistance, threshold, isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await config.onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setIsPulling(false);
    touchStart.current = null;
  }, [isPulling, isRefreshing, pullDistance, threshold, config]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isPulling,
    isRefreshing,
    pullDistance,
    threshold
  };
}