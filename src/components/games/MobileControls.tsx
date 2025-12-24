import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCw, Circle } from 'lucide-react';

interface DirectionalControlsProps {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  showRotate?: boolean;
  onRotate?: () => void;
}

export function MobileControls({
  onUp,
  onDown,
  onLeft,
  onRight,
  onAction,
  actionLabel = 'Action',
  showRotate = false,
  onRotate,
}: DirectionalControlsProps) {
  return (
    <div className="flex items-center gap-8 md:hidden mt-4">
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-1">
        <div />
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl active:scale-95 transition-transform"
          onTouchStart={(e) => {
            e.preventDefault();
            onUp?.();
          }}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl active:scale-95 transition-transform"
          onTouchStart={(e) => {
            e.preventDefault();
            onLeft?.();
          }}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl active:scale-95 transition-transform"
          onTouchStart={(e) => {
            e.preventDefault();
            onDown?.();
          }}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl active:scale-95 transition-transform"
          onTouchStart={(e) => {
            e.preventDefault();
            onRight?.();
          }}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 items-center">
        {showRotate && onRotate && (
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full active:scale-95 transition-transform"
            onTouchStart={(e) => {
              e.preventDefault();
              onRotate();
            }}
          >
            <RotateCw className="h-6 w-6" />
          </Button>
        )}
        {onAction && (
          <Button
            variant="default"
            size="icon"
            className="h-16 w-16 rounded-full active:scale-95 transition-transform"
            onTouchStart={(e) => {
              e.preventDefault();
              onAction();
            }}
          >
            <Circle className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface HorizontalControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onAction?: () => void;
}

export function HorizontalControls({ onLeft, onRight, onAction }: HorizontalControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 md:hidden mt-4">
      <Button
        variant="outline"
        size="icon"
        className="h-16 w-16 rounded-full active:scale-95 transition-transform"
        onTouchStart={(e) => {
          e.preventDefault();
          onLeft();
        }}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      
      {onAction && (
        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full active:scale-95 transition-transform"
          onTouchStart={(e) => {
            e.preventDefault();
            onAction();
          }}
        >
          <Circle className="h-6 w-6" />
        </Button>
      )}
      
      <Button
        variant="outline"
        size="icon"
        className="h-16 w-16 rounded-full active:scale-95 transition-transform"
        onTouchStart={(e) => {
          e.preventDefault();
          onRight();
        }}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>
    </div>
  );
}
