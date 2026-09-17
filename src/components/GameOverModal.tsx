/**
 * SkiFree Retro - Game Over Dialog (Authentic Retro Pixel Style)
 */

import React from 'react';
import { RotateCcw, Trophy, Mountain, Flame, Sparkles, Home } from 'lucide-react';
import { sound } from '../game/audio';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  distance: number;
  maxSpeed: number;
  tricks: number;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
  onMainMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  distance,
  maxSpeed,
  tricks,
  onRestart,
  onOpenLeaderboard,
  onMainMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="game-over-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs select-none font-pixel"
    >
      <div
        id="game-over-card"
        className="pixel-panel w-full max-w-sm flex flex-col text-black text-xs"
      >
        {/* Retro Titlebar */}
        <div className="pixel-titlebar bg-red-900 flex items-center justify-between">
          <span className="text-white text-[10px]">GAME OVER - YETI DINNER!</span>
          <span className="text-red-300 text-[10px]">💀</span>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col items-center text-center gap-3">
          {/* Pixel skull */}
          <div className="pixel-inset p-2 bg-red-100 border-2 border-black">
            <span className="text-3xl">🦴</span>
          </div>

          <div>
            <h2 className="text-sm font-bold text-red-700 tracking-wider">
              YOU WERE EATEN!
            </h2>
            <p className="text-[9px] text-slate-700 mt-1">
              The Abominable Snow Monster enjoyed a hearty snack.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="w-full pixel-inset p-2.5 bg-white grid grid-cols-2 gap-2 text-left">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase flex items-center gap-1">
                <Mountain className="w-2.5 h-2.5 text-cyan-700" /> DISTANCE
              </span>
              <span className="text-xs font-bold text-black">{distance}m</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-amber-700" /> MAX SPEED
              </span>
              <span className="text-xs font-bold text-amber-700">{maxSpeed} km/h</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-700" /> TRICKS
              </span>
              <span className="text-xs font-bold text-emerald-800">{tricks}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase">TOTAL SCORE</span>
              <span className="text-xs font-bold text-blue-900">{score}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2 mt-1">
            <button
              id="btn-play-again"
              type="button"
              onClick={() => {
                sound.playClick();
                onRestart();
              }}
              className="pixel-btn-action w-full py-2.5 text-[10px] font-bold text-white flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 stroke-[3]" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              id="btn-record-score"
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenLeaderboard();
              }}
              className="pixel-btn-yellow w-full py-2 text-[9px] font-bold text-black flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-3 h-3 text-amber-900" />
              <span>SAVE TO HIGH SCORES</span>
            </button>

            {onMainMenu && (
              <button
                id="btn-game-over-main-menu"
                type="button"
                onClick={() => {
                  sound.playClick();
                  onMainMenu();
                }}
                className="pixel-btn w-full py-2 text-[9px] font-bold text-black hover:bg-slate-300 flex items-center justify-center gap-1.5"
              >
                <Home className="w-3 h-3" />
                <span>BACK TO MAIN MENU</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
