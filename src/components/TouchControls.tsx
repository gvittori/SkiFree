/**
 * SkiFree Retro - Authentic 8-Bit Pixel Mobile Touch Controls
 */

import React, { useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Sparkles, Zap } from 'lucide-react';

interface TouchControlsProps {
  isAirborne: boolean;
  isDown?: boolean;
  isSprinting?: boolean;
  onSteerLeft: () => void;
  onSteerRight: () => void;
  onJumpOrTrick: () => void;
  onToggleSprint: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  isAirborne,
  isDown = false,
  isSprinting = false,
  onSteerLeft,
  onSteerRight,
  onJumpOrTrick,
  onToggleSprint,
}) => {
  const leftHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const leftHoldInterval = useRef<NodeJS.Timeout | null>(null);
  const rightHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const rightHoldInterval = useRef<NodeJS.Timeout | null>(null);

  const holdIntervalMs = isSprinting ? 220 : 130;
  const initialDelayMs = isSprinting ? 220 : 180;

  const startSteerLeft = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    stopSteerLeft();
    onSteerLeft();
    // After an initial hold threshold, repeat steering
    leftHoldTimeout.current = setTimeout(() => {
      leftHoldInterval.current = setInterval(() => {
        onSteerLeft();
      }, holdIntervalMs);
    }, initialDelayMs);
  };

  const stopSteerLeft = () => {
    if (leftHoldTimeout.current) {
      clearTimeout(leftHoldTimeout.current);
      leftHoldTimeout.current = null;
    }
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
    stopSteerRight();
    onSteerRight();
    // After an initial hold threshold, repeat steering
    rightHoldTimeout.current = setTimeout(() => {
      rightHoldInterval.current = setInterval(() => {
        onSteerRight();
      }, holdIntervalMs);
    }, initialDelayMs);
  };

  const stopSteerRight = () => {
    if (rightHoldTimeout.current) {
      clearTimeout(rightHoldTimeout.current);
      rightHoldTimeout.current = null;
    }
    if (rightHoldInterval.current) {
      clearInterval(rightHoldInterval.current);
      rightHoldInterval.current = null;
    }
  };

  const lastActionTime = useRef<number>(0);
  const handleAction = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastActionTime.current < 250) {
      return;
    }
    lastActionTime.current = now;
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
      className="absolute bottom-3 inset-x-0 px-3 sm:px-4 flex items-end justify-between pointer-events-none z-30 select-none font-pixel"
    >
      {/* Left Column: Sprint Toggle above Steer Left */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        {/* Sprint Button Toggle (above Left button) */}
        <button
          id="btn-sprint-toggle"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSprint();
          }}
          className={`w-16 h-13 sm:w-18 sm:h-14 border-3 border-black flex flex-col items-center justify-center gap-0.5 shadow-lg active:translate-y-0.5 touch-none transition-all ${
            isSprinting
              ? 'bg-amber-400 text-black ring-2 ring-yellow-300 font-black animate-pulse pixel-btn-yellow shadow-amber-500/50'
              : 'bg-[#c0c0c0]/90 text-black hover:bg-[#d4d4d4] pixel-btn'
          }`}
          aria-label="Toggle Sprint"
        >
          <Zap className={`w-5 h-5 ${isSprinting ? 'text-black fill-current animate-bounce' : 'text-amber-600'}`} />
          <span className="text-[8px] font-bold tracking-tight">
            {isSprinting ? 'SPRINT ON' : 'SPRINT'}
          </span>
          <span className={`text-[7px] font-bold ${isSprinting ? 'text-red-950 font-black' : 'text-slate-600'}`}>
            {isSprinting ? '150 km/h' : 'TOGGLE'}
          </span>
        </button>

        {/* Steer Left Button */}
        <button
          id="btn-steer-left"
          type="button"
          onTouchStart={startSteerLeft}
          onTouchEnd={stopSteerLeft}
          onTouchCancel={stopSteerLeft}
          onMouseDown={startSteerLeft}
          onMouseUp={stopSteerLeft}
          onMouseLeave={stopSteerLeft}
          className="w-16 h-16 sm:w-18 sm:h-18 pixel-btn bg-[#c0c0c0]/90 active:bg-blue-300 flex flex-col items-center justify-center gap-1 shadow-lg touch-none"
          aria-label="Steer Left"
        >
          <ArrowLeft className="w-6 h-6 text-black stroke-[3]" />
          <span className="text-[9px] font-bold text-black">LEFT</span>
        </button>
      </div>

      {/* Right Column: Jump / Trick above Steer Right */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        {/* Jump / Trick / Get Up Button (above Right button) */}
        <button
          id="btn-jump-trick"
          type="button"
          onTouchStart={handleAction}
          onMouseDown={handleAction}
          className={`w-16 h-13 sm:w-18 sm:h-14 border-3 border-black flex flex-col items-center justify-center gap-0.5 shadow-lg active:translate-y-0.5 touch-none ${
            isAirborne
              ? 'pixel-btn-yellow text-black animate-pulse ring-2 ring-yellow-400'
              : isDown
              ? 'pixel-btn-red text-white ring-2 ring-yellow-300'
              : 'pixel-btn-action text-white'
          }`}
          aria-label={isAirborne ? 'Perform Trick' : isDown ? 'Get Up' : 'Jump'}
        >
          {isAirborne ? (
            <>
              <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
              <span className="text-[8px] font-bold text-black">TRICK!</span>
            </>
          ) : isDown ? (
            <>
              <ArrowUp className="w-5 h-5 text-white stroke-[3]" />
              <span className="text-[8px] font-bold text-white">GET UP</span>
            </>
          ) : (
            <>
              <ArrowUp className="w-5 h-5 text-white stroke-[3]" />
              <span className="text-[9px] font-bold text-white">JUMP</span>
            </>
          )}
        </button>

        {/* Steer Right Button */}
        <button
          id="btn-steer-right"
          type="button"
          onTouchStart={startSteerRight}
          onTouchEnd={stopSteerRight}
          onTouchCancel={stopSteerRight}
          onMouseDown={startSteerRight}
          onMouseUp={stopSteerRight}
          onMouseLeave={stopSteerRight}
          className="w-16 h-16 sm:w-18 sm:h-18 pixel-btn bg-[#c0c0c0]/90 active:bg-blue-300 flex flex-col items-center justify-center gap-1 shadow-lg touch-none"
          aria-label="Steer Right"
        >
          <ArrowRight className="w-6 h-6 text-black stroke-[3]" />
          <span className="text-[9px] font-bold text-black">RIGHT</span>
        </button>
      </div>
    </div>
  );
};
