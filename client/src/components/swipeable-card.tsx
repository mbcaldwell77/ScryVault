import { motion, useMotionValue, useTransform } from "framer-motion";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore dynamically require to avoid type errors if module is missing
const { useSwipeable } = require("react-swipeable") as typeof import("react-swipeable");
import type { BookMetadata } from "@/hooks/use-inventory";

interface SwipeableCardProps {
  isbn: string;
  metadata: BookMetadata;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export default function SwipeableCard({ isbn, metadata, onSwipeLeft, onSwipeRight }: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) {
      onSwipeRight();
    } else if (info.offset.x < -100) {
      onSwipeLeft();
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => onSwipeLeft(),
    onSwipedRight: () => onSwipeRight(),
    delta: 50,
    trackMouse: true,
  });

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-72 h-96 flex flex-col"
      style={{ x, rotate }}
      drag="x"
      onDragEnd={handleDragEnd}
      {...handlers}
    >
      <div className="flex-1 flex flex-col items-center text-center space-y-3">
        <img
          src={metadata.imageUrl || "/placeholder-book-dark.svg"}
          alt="Book cover"
          className="w-24 h-32 object-cover rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-book-dark.svg";
          }}
        />
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
            {metadata.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
            {metadata.author}
          </p>
          {metadata.format && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{metadata.format}</p>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{isbn}</p>
      </div>
    </motion.div>
  );
}
