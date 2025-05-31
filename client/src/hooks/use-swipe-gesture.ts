import { useState, useRef, useCallback } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

export function useSwipeGesture(config: SwipeConfig) {
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const minSwipeDistance = config.minSwipeDistance || 50;
  const maxSwipeTime = config.maxSwipeTime || 500;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    };
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) {
      setIsSwiping(false);
      return;
    }

    const deltaX = touchStart.current.x - touchEnd.current.x;
    const deltaY = touchStart.current.y - touchEnd.current.y;
    const deltaTime = Date.now() - touchStart.current.time;

    if (deltaTime > maxSwipeTime) {
      setIsSwiping(false);
      return;
    }

    const isLeftSwipe = deltaX > minSwipeDistance;
    const isRightSwipe = deltaX < -minSwipeDistance;
    const isUpSwipe = deltaY > minSwipeDistance;
    const isDownSwipe = deltaY < -minSwipeDistance;

    if (isLeftSwipe && config.onSwipeLeft) {
      config.onSwipeLeft();
    } else if (isRightSwipe && config.onSwipeRight) {
      config.onSwipeRight();
    } else if (isUpSwipe && config.onSwipeUp) {
      config.onSwipeUp();
    } else if (isDownSwipe && config.onSwipeDown) {
      config.onSwipeDown();
    }

    setIsSwiping(false);
  }, [config, minSwipeDistance, maxSwipeTime]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isSwiping
  };
}