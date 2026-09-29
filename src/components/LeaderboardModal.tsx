/**
 * SkiFree Retro - Offline Leaderboard Modal (Authentic Retro Pixel Style)
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, RotateCcw, Mountain, Flame, Sparkles } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard, saveScore, resetLeaderboard, getLastPlayerName } from '../game/leaderboard';
import { sound } from '../game/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingScore?: {
    score: number;
    distance: number;
    maxSpeed: number;
    tricks: number;
  } | null;
  onScoreSaved?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  pendingScore,
  onScoreSaved,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState(getLastPlayerName());
  const [hasSavedPending, setHasSavedPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEntries(getLeaderboard());
      setHasSavedPending(false);
      setPlayerName(getLastPlayerName());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingScore || hasSavedPending || !playerName.trim()) return;

    sound.playClick();
    saveScore({
      name: playerName.trim().toUpperCase().slice(0, 10),
      score: pendingScore.score,
      distance: pendingScore.distance,
      maxSpeed: pendingScore.maxSpeed,
      tricksCount: pendingScore.tricks,
    });
    setEntries(getLeaderboard());
    setHasSavedPending(true);
    sound.playHighscore();
    if (onScoreSaved) onScoreSaved();
  };

  const handleReset = () => {
    if (window.confirm('Reset offline leaderboard to default scores?')) {
      sound.playClick();
      const resetList = resetLeaderboard();
      setEntries(resetList);
    }
  };

  return (
    <div
      id="leaderboard-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs select-none font-pixel"
    >
      <div
        id="leaderboard-dialog"
        className="pixel-panel w-full max-w-md flex flex-col text-black text-xs max-h-[90vh]"
      >
        {/* Retro Titlebar */}
        <div className="pixel-titlebar flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-white text-[10px]">HALL OF FAME - HIGH SCORES</span>
          </div>
          <button
            id="btn-close-leaderboard"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="pixel-btn px-1.5 py-0.5 text-black hover:bg-red-500 hover:text-white text-[10px]"
          >
            ✕
          </button>
        </div>

        {/* Pending Score Submission Form */}
        {pendingScore && !hasSavedPending && (
          <form
            onSubmit={handleSaveScore}
            className="p-3 bg-amber-100 border-b-2 border-black flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1 uppercase">
                <Sparkles className="w-3 h-3 text-amber-600" /> NEW RECORD!
              </span>
              <span className="text-xs font-bold text-blue-900">
                {pendingScore.score} PTS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-[8px] pixel-inset p-1.5 bg-white">
              <div>
                <span className="text-slate-500 block">DIST</span>
                <span className="font-bold text-black">{pendingScore.distance}m</span>
              </div>
              <div>
                <span className="text-slate-500 block">SPD</span>
                <span className="font-bold text-amber-700">{pendingScore.maxSpeed}km/h</span>
              </div>
              <div>
                <span className="text-slate-500 block">TRICKS</span>
                <span className="font-bold text-emerald-800">{pendingScore.tricks}</span>
              </div>
            </div>

            <div className="flex gap-1.5">
              <input
                id="input-player-name"
                type="text"
                value={playerName}
                maxLength={10}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="NAME"
                className="flex-1 pixel-inset px-2 py-1.5 text-[10px] uppercase font-pixel bg-white"
              />
              <button
                id="btn-save-score"
                type="submit"
                className="pixel-btn-action px-3 py-1.5 text-[10px] font-bold text-white"
              >
                SAVE
              </button>
            </div>
          </form>
        )}

        {/* Entries Table */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-100">
          {entries.map((entry, index) => {
            const isTop3 = index < 3;
            const medalColor =
              index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-slate-500';

            return (
              <div
                key={entry.id}
                className={`pixel-inset p-2 flex items-center justify-between gap-2 bg-white ${
                  index === 0 ? 'bg-amber-50 ring-1 ring-amber-400' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 text-center">
                    {isTop3 ? (
                      <Medal className={`w-4 h-4 mx-auto ${medalColor}`} />
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500">#{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-[10px] text-black block truncate max-w-[120px]">
                      {entry.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[8px] text-slate-500">
                      <span className="flex items-center gap-0.5">
                        <Mountain className="w-2 h-2 text-cyan-600" /> {entry.distance}m
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-2 h-2 text-amber-600" /> {entry.maxSpeed}k
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-[11px] text-blue-900 block">
                    {entry.score}
                  </span>
                  <span className="text-[8px] text-slate-500">
                    {entry.tricksCount} TRICKS
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-[#c0c0c0] p-2 border-t-2 border-black flex items-center justify-between text-[8px]">
          <button
            id="btn-reset-leaderboard"
            type="button"
            onClick={handleReset}
            className="pixel-btn px-2 py-1 text-black flex items-center gap-1 hover:bg-slate-300"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>RESET</span>
          </button>

          <span className="text-slate-600 text-[8px]">LOCAL STORAGE (OFFLINE)</span>
        </div>
      </div>
    </div>
  );
};
