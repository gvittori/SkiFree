/**
 * SkiFree Retro - Authentic 8-Bit Pixel HUD Bar
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Trophy, Pause, Play, Mountain } from 'lucide-react';
import { sound } from '../game/audio';

interface HUDProps {
  score: number;
  distance: number;
  speed: number;
  highScore: number;
  isPaused: boolean;
  isGameStarted?: boolean;
  onTogglePause: () => void;
  onOpenLeaderboard: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  distance,
  speed,
  highScore,
  isPaused,
  isGameStarted = true,
  onTogglePause,
  onOpenLeaderboard,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    sound.playClick();
  };

  return (
    <div
      id="game-hud-container"
      className="absolute top-0 inset-x-0 z-20 flex flex-col pointer-events-none select-none font-pixel"
    >
      {/* Windows 3.1 / Retro Arcade Status & Stat Ribbon */}
      <div
        id="retro-hud-ribbon"
        className="w-full bg-[#c0c0c0] border-b-3 border-black text-black px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-md pointer-events-auto"
      >
        {/* Left Stats: Distance & Speed */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Distance */}
          <div className="pixel-inset px-2 py-1 flex items-center gap-1.5 bg-white">
            <Mountain className="w-3 h-3 text-cyan-700 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 font-bold leading-none">DIST</span>
              <span className="text-[11px] font-bold text-black leading-tight">
                {distance}m
              </span>
            </div>
          </div>

          {/* Speed */}
          <div className="pixel-inset px-2 py-1 flex items-center gap-1 bg-white">
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 font-bold leading-none">SPD</span>
              <span className="text-[11px] font-bold text-amber-700 leading-tight">
                {Math.round(speed * 8)}
              </span>
            </div>
          </div>

          {/* Score */}
          <div className="pixel-inset px-2 py-1 flex items-center gap-1 bg-white">
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 font-bold leading-none">SCORE</span>
              <span className="text-[11px] font-bold text-blue-800 leading-tight">
                {score}
              </span>
            </div>
          </div>

          {/* High Score (shown on wider screens) */}
          <div className="hidden md:flex pixel-inset px-2 py-1 bg-white flex-col">
            <span className="text-[7px] text-amber-600 font-bold leading-none">HI-SCORE</span>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">
              {highScore}
            </span>
          </div>
        </div>

        {/* Right Controls: Retro Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Pause Button - Only visible during an active run */}
          {isGameStarted && (
            <button
              id="hud-btn-pause"
              type="button"
              onClick={() => {
                sound.playClick();
                onTogglePause();
              }}
              className={`pixel-btn px-2.5 py-1.5 text-[9px] font-bold flex items-center gap-1 ${
                isPaused ? 'bg-amber-300 text-black' : 'bg-[#d4d0c8]'
              }`}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <>
                  <Play className="w-3 h-3 fill-black text-black" />
                  <span>RESUME</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" />
                  <span className="hidden sm:inline">PAUSE</span>
                </>
              )}
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="hud-btn-sound"
            type="button"
            onClick={handleToggleSound}
            className="pixel-btn p-1.5 text-black hover:bg-slate-300"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5 text-blue-700" />}
          </button>

          {/* Leaderboard */}
          <button
            id="hud-btn-leaderboard"
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="pixel-btn p-1.5 bg-yellow-200 text-black hover:bg-yellow-300"
            title="High Scores"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-700" />
          </button>
        </div>
      </div>
    </div>
  );
};
