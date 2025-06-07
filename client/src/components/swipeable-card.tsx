import { motion, useMotionValue, useTransform } from "framer-motion";
import { useSwipeable } from "react-swipeable";
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
    console.log('Drag ended with offset:', info.offset.x);
    if (info.offset.x > 100) {
      console.log('Swiped right via drag');
      onSwipeRight();
    } else if (info.offset.x < -100) {
      console.log('Swiped left via drag');
      onSwipeLeft();
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      console.log('Swiped left via touch');
      onSwipeLeft();
    },
    onSwipedRight: () => {
      console.log('Swiped right via touch');
      onSwipeRight();
    },
    delta: 50,
    trackMouse: true,
  });

  return (
    <motion.div
      className="rounded-xl shadow-2xl p-6 w-80 h-96 flex flex-col border-2"
      style={{ 
        x, 
        rotate,
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d4a3f 100%)',
        borderColor: 'var(--emerald-accent)',
        boxShadow: '0 8px 32px rgba(45, 74, 63, 0.4)'
      }}
      drag="x"
      onDragEnd={handleDragEnd}
      {...handlers}
    >
      <div className="flex-1 flex flex-col items-center text-center space-y-4">
        <img
          src={metadata.imageUrl || "/placeholder-book-dark.svg"}
          alt="Book cover"
          className="w-28 h-36 object-cover rounded-lg border-2"
          style={{ borderColor: 'var(--emerald-accent)' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-book-dark.svg";
          }}
        />
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white leading-tight">
            {metadata.title}
          </h3>
          <p className="text-sm font-medium" style={{ color: 'var(--emerald-accent)' }}>
            {metadata.author}
          </p>
          {metadata.format && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{metadata.format}</p>
          )}
        </div>
        <p className="text-xs font-mono px-3 py-1 rounded-full" 
           style={{ 
             backgroundColor: 'rgba(212, 175, 55, 0.1)', 
             color: 'var(--gold-accent)',
             border: '1px solid rgba(212, 175, 55, 0.3)'
           }}>
          {isbn}
        </p>
        
        {/* Swipe Instructions */}
        <div className="mt-4 space-y-1">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            ← Swipe left to discard
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Swipe right to purchase →
          </p>
        </div>
      </div>
    </motion.div>
  );
}
