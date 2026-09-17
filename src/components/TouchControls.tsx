/**
 * SkiFree Retro - Authentic 8-Bit Pixel Mobile Touch Controls
 */

import React, { useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Sparkles } from 'lucide-react';

interface TouchControlsProps {
  isAirborne: boolean;
  onSteerLeft: () => void;
  onSteerRight: () => void;
  onJumpOrTrick: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  isAirborne,
  onSteerLeft,
  onSteerRight,
  onJumpOrTrick,
}) => {
  const leftHoldInterval = useRef<NodeJS.Timeout | null>(null);
  const rightHoldInterval = useRef<NodeJS.Timeout | null>(null);

  const startSteerLeft = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSteerLeft();
    if (leftHoldInterval.current) clearInterval(leftHoldInterval.current);
    leftHoldInterval.current = setInterval(() => {
      onSteerLeft();
    }, 120);
  };

  const stopSteerLeft = () => {
    if (leftHoldInterval.current) {
      clearInterval(leftHoldInterval.current);
      leftHoldInterval.current = null;
    }
  };

  const startSteerRight = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSteerRight();
    if (rightHoldInterval.current) clearInterval(rightHoldInterval.current);
    rightHoldInterval.current = setInterval(() => {
      onSteerRight();
    }, 120);
  };

  const stopSteerRight = () => {
    if (rightHoldInterval.current) {
      clearInterval(rightHoldInterval.current);
      rightHoldInterval.current = null;
    }
  };

  const handleAction = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onJumpOrTrick();
  };

  useEffect(() => {
    return () => {
      stopSteerLeft();
      stopSteerRight();
    };
  }, []);

  return (
    <div
      id="mobile-touch-controls-container"
      className="absolute bottom-3 inset-x-0 px-3 flex items-end justify-between pointer-events-none z-30 select-none font-pixel"
    >
      {/* Bottom Left: Retro D-Pad Left Button */}
      <button
        id="btn-steer-left"
        type="button"
        onTouchStart={startSteerLeft}
        onTouchEnd={stopSteerLeft}
        onTouchCancel={stopSteerLeft}
        onMouseDown={startSteerLeft}
        onMouseUp={stopSteerLeft}
        onMouseLeave={stopSteerLeft}
        className="pointer-events-auto w-16 h-16 sm:w-18 sm:h-18 pixel-btn bg-[#c0c0c0]/90 active:bg-blue-300 flex flex-col items-center justify-center gap-1 shadow-lg touch-none"
        aria-label="Steer Left"
      >
        <ArrowLeft className="w-6 h-6 text-black stroke-[3]" />
        <span className="text-[9px] font-bold text-black">LEFT</span>
      </button>

      {/* Bottom Center: Retro Jump / Trick Button */}
      <button
        id="btn-jump-trick"
        type="button"
        onTouchStart={handleAction}
        onMouseDown={handleAction}
        className={`pointer-events-auto px-4 h-16 sm:h-18 border-3 border-black flex flex-col items-center justify-center gap-1 shadow-xl active:translate-y-0.5 touch-none min-w-[100px] ${
          isAirborne
            ? 'pixel-btn-yellow text-black animate-pulse ring-2 ring-yellow-400'
            : 'pixel-btn-action text-white'
        }`}
        aria-label={isAirborne ? 'Perform Trick' : 'Jump'}
      >
        {isAirborne ? (
          <>
            <Sparkles className="w-6 h-6 text-black stroke-[2.5]" />
            <span className="text-[9px] font-bold text-black">★ TRICK! ★</span>
          </>
        ) : (
          <>
            <ArrowUp className="w-6 h-6 text-white stroke-[3]" />
            <span className="text-[10px] font-bold text-white">JUMP</span>
          </>
        )}
      </button>

      {/* Bottom Right: Retro D-Pad Right Button */}
      <button
        id="btn-steer-right"
        type="button"
        onTouchStart={startSteerRight}
        onTouchEnd={stopSteerRight}
        onTouchCancel={stopSteerRight}
        onMouseDown={startSteerRight}
        onMouseUp={stopSteerRight}
        onMouseLeave={stopSteerRight}
        className="pointer-events-auto w-16 h-16 sm:w-18 sm:h-18 pixel-btn bg-[#c0c0c0]/90 active:bg-blue-300 flex flex-col items-center justify-center gap-1 shadow-lg touch-none"
        aria-label="Steer Right"
      >
        <ArrowRight className="w-6 h-6 text-black stroke-[3]" />
        <span className="text-[9px] font-bold text-black">RIGHT</span>
      </button>
    </div>
  );
};
