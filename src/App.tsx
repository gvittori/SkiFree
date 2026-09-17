/**
 * SkiFree Retro - Main Application Entry
 * Authentic 1991 SkiFree clone with retro pixel art graphics,
 * responsive mobile touch controls, skier wardrobe & color customization,
 * pause screen with "Back to Main Menu", and offline leaderboard.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { SkiCanvas } from './components/SkiCanvas';
import { TouchControls } from './components/TouchControls';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SkierCustomizerModal } from './components/SkierCustomizerModal';
import { AndroidFrame } from './components/AndroidFrame';
import { getHighScore } from './game/leaderboard';
import { sound } from './game/audio';
import { loadSavedPalette } from './game/palettes';
import { spriteStore } from './game/spriteLoader';
import { SkierPalette } from './types';
import { Play, Palette, Trophy, Home, Sparkles } from 'lucide-react';

export default function App() {
  const engineRef = useRef<GameEngine>(new GameEngine());
  const engine = engineRef.current;

  // React state synchronized from game loop
  const [, setTick] = useState(0);
  const [highScore, setHighScore] = useState(getHighScore());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPalette, setCurrentPalette] = useState<SkierPalette>(loadSavedPalette());
  const [pendingRunScore, setPendingRunScore] = useState<{
    score: number;
    distance: number;
    maxSpeed: number;
    tricks: number;
  } | null>(null);

  // Apply saved palette on initial mount
  useEffect(() => {
    const saved = loadSavedPalette();
    setCurrentPalette(saved);
    spriteStore.applyPalette(saved);
  }, []);

  // Sync state from engine tick
  const handleEngineStateUpdate = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  // Set up game over callback from Yeti catch
  useEffect(() => {
    engine.setGameOverCallback((finalScore, distance, maxSpeed, tricks) => {
      setIsPaused(false);
      setPendingRunScore({
        score: finalScore,
        distance,
        maxSpeed,
        tricks,
      });
      setShowGameOver(true);
      const currentHigh = getHighScore();
      if (finalScore > currentHigh) {
        setHighScore(finalScore);
      }
    });
  }, [engine]);

  const handleStartGame = () => {
    sound.playClick();
    engine.reset(true);
    setIsPaused(false);
    setIsGameStarted(true);
  };

  const handleRestart = () => {
    setShowGameOver(false);
    setPendingRunScore(null);
    engine.reset(true);
    setIsPaused(false);
    setIsGameStarted(true);
    sound.playJump();
  };

  const handleTogglePause = () => {
    if (!isGameStarted || showGameOver) return;
    setIsPaused((prev) => {
      const next = !prev;
      engine.state.isPaused = next;
      return next;
    });
  };

  const handleResumePlay = () => {
    sound.playClick();
    engine.state.isPaused = false;
    setIsPaused(false);
  };

  const handleBackToMainMenu = () => {
    sound.playClick();
    engine.stop();
    engine.state.isPaused = false;
    setIsPaused(false);
    engine.reset(false);
    setIsGameStarted(false);
    setShowGameOver(false);
  };

  const handleOpenLeaderboard = () => {
    sound.playClick();
    if (isGameStarted) {
      engine.state.isPaused = true;
      setIsPaused(true);
    }
    setShowLeaderboard(true);
  };

  const handleOpenCustomizer = () => {
    sound.playClick();
    if (isGameStarted) {
      engine.state.isPaused = true;
      setIsPaused(true);
    }
    setShowCustomizer(true);
  };

  const handlePaletteChange = (newPalette: SkierPalette) => {
    setCurrentPalette(newPalette);
    spriteStore.applyPalette(newPalette);
  };

  return (
    <AndroidFrame>
      <div id="game-viewport" className="relative w-full h-full flex flex-col overflow-hidden bg-white select-none">
        {/* Authentic Heads Up Display (HUD) */}
        <HUD
          score={engine.state.score}
          distance={engine.state.distance}
          speed={engine.state.speed}
          highScore={highScore}
          isPaused={isPaused}
          isGameStarted={isGameStarted}
          onTogglePause={handleTogglePause}
          onOpenLeaderboard={handleOpenLeaderboard}
        />

        {/* 60fps Retro Pixel Canvas */}
        <SkiCanvas
          engine={engine}
          isGameStarted={isGameStarted}
          onStateUpdate={handleEngineStateUpdate}
          onTogglePause={handleTogglePause}
        />

        {/* Mobile Pixel Touch Controls - only active when playing */}
        {isGameStarted && !isPaused && (
          <TouchControls
            isAirborne={engine.state.isAirborne}
            onSteerLeft={() => engine.steerLeft()}
            onSteerRight={() => engine.steerRight()}
            onJumpOrTrick={() => engine.actionJumpOrTrick()}
          />
        )}

        {/* Start Game Main Menu Overlay */}
        {!isGameStarted && (
          <div
            id="start-screen-overlay"
            className="absolute inset-0 z-30 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs font-pixel"
          >
            <div className="pixel-panel w-full max-w-sm flex flex-col text-black">
              {/* Titlebar */}
              <div className="pixel-titlebar flex items-center justify-between">
                <span className="text-[10px] tracking-tight">SKIFREE 1991 - ARCADE</span>
                <span className="text-yellow-300 text-[9px]">v1.2</span>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col items-center text-center gap-3">
                {/* Pixel Skier Badge */}
                <div className="pixel-inset p-3 bg-white flex flex-col items-center gap-1.5 w-full">
                  <div className="text-3xl">⛷️</div>
                  <h1 className="text-sm font-bold text-blue-900 tracking-wider">
                    SKIFREE RETRO
                  </h1>
                  <p className="text-[8px] text-slate-600">
                    WINDOWS ENTERTAINMENT PACK 1991
                  </p>
                </div>

                {/* Outfit Status Bar */}
                <div className="w-full pixel-inset p-2 bg-slate-50 flex items-center justify-between text-[9px]">
                  <span className="text-slate-600 font-bold">CURRENT SUIT:</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5 border border-black p-0.5 bg-white">
                      <span className="w-2.5 h-2.5" style={{ backgroundColor: currentPalette.hatColor }} />
                      <span className="w-2.5 h-2.5" style={{ backgroundColor: currentPalette.sweaterColor }} />
                      <span className="w-2.5 h-2.5" style={{ backgroundColor: currentPalette.pantsColor }} />
                    </div>
                    <span className="font-bold text-black truncate max-w-[110px]">{currentPalette.name}</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="w-full pixel-inset p-2.5 bg-white text-left text-[8px] text-slate-700 space-y-1.5 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-600 font-bold">►</span>
                    <span>Use <b>LEFT & RIGHT</b> buttons to carve down</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">►</span>
                    <span>Tap <b>JUMP</b> or hit snow bumps to go airborne</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">►</span>
                    <span>Tap <b>TRICK</b> mid-air for bonus points</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">►</span>
                    <span>Watch out for trees, snowboarders & the <b>YETI</b>!</span>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="w-full flex flex-col gap-2 mt-1">
                  {/* Start Run */}
                  <button
                    id="btn-start-run"
                    type="button"
                    onClick={handleStartGame}
                    className="pixel-btn-action w-full py-2.5 text-[11px] font-bold text-white flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>START DOWNHILL RUN</span>
                  </button>

                  {/* Customize Skier */}
                  <button
                    id="btn-customize-skier"
                    type="button"
                    onClick={handleOpenCustomizer}
                    className="pixel-btn-yellow w-full py-2 text-[10px] font-bold text-black flex items-center justify-center gap-2"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-900" />
                    <span>CUSTOMIZE SKIER</span>
                  </button>

                  {/* High Scores */}
                  <button
                    id="btn-open-start-leaderboard"
                    type="button"
                    onClick={handleOpenLeaderboard}
                    className="pixel-btn w-full py-1.5 text-[9px] text-slate-800 hover:bg-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <Trophy className="w-3 h-3 text-amber-600" />
                    <span>HIGH SCORES LEADERBOARD</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pause Overlay with "Back to Play" and "Main Menu" */}
        {isPaused && isGameStarted && (
          <div
            id="pause-overlay"
            className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-pixel select-none animate-in fade-in duration-100"
          >
            <div className="pixel-panel w-full max-w-xs flex flex-col text-black text-center shadow-2xl">
              {/* Titlebar */}
              <div className="pixel-titlebar flex items-center justify-between">
                <span className="text-[10px] text-white">SKIFREE - PAUSED</span>
                <button
                  type="button"
                  onClick={handleResumePlay}
                  className="w-4 h-4 bg-[#c0c0c0] border border-black text-black text-[9px] font-bold flex items-center justify-center hover:bg-slate-300"
                  title="Close / Back to Play"
                >
                  ✕
                </button>
              </div>

              {/* Pause Menu Body */}
              <div className="p-4 flex flex-col items-center gap-3">
                <div className="pixel-inset p-3 bg-white w-full">
                  <div className="text-2xl mb-1">🏔️</div>
                  <h3 className="text-xs font-bold text-blue-900 uppercase">
                    GAME PAUSED
                  </h3>

                  {/* Slope run progress */}
                  <div className="mt-2.5 flex items-center justify-around text-[9px] text-slate-800 bg-slate-100 py-1.5 px-2 border border-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[7px]">DISTANCE</span>
                      <span className="font-bold text-blue-900">{Math.floor(engine.state.distance)}m</span>
                    </div>
                    <div className="h-4 w-px bg-slate-300" />
                    <div>
                      <span className="text-slate-500 block text-[7px]">SCORE</span>
                      <span className="font-bold text-emerald-700">{engine.state.score}</span>
                    </div>
                  </div>

                  <p className="text-[8px] text-slate-500 mt-2">
                    Catch your breath before facing the Yeti!
                  </p>
                </div>

                <div className="w-full flex flex-col gap-2.5 mt-1">
                  {/* Back to Play */}
                  <button
                    id="btn-back-to-play"
                    type="button"
                    onClick={handleResumePlay}
                    className="pixel-btn-action w-full py-2.5 text-[10px] font-bold text-white flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>BACK TO PLAY</span>
                  </button>

                  {/* Main Menu */}
                  <button
                    id="btn-pause-main-menu"
                    type="button"
                    onClick={handleBackToMainMenu}
                    className="pixel-btn w-full py-2 text-[9px] font-bold text-slate-900 hover:bg-slate-200 flex items-center justify-center gap-2"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-700" />
                    <span>MAIN MENU</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skier Wardrobe / Color Customizer Modal */}
        <SkierCustomizerModal
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          currentPalette={currentPalette}
          onPaletteChange={handlePaletteChange}
        />

        {/* Game Over Modal (When Yeti Catches Skier) */}
        <GameOverModal
          isOpen={showGameOver}
          score={engine.state.score}
          distance={engine.state.distance}
          maxSpeed={engine.state.maxSpeedAchieved}
          tricks={engine.state.tricksLanded}
          onRestart={handleRestart}
          onOpenLeaderboard={() => {
            setShowGameOver(false);
            setShowLeaderboard(true);
          }}
          onMainMenu={handleBackToMainMenu}
        />

        {/* Offline High Scores Leaderboard Modal */}
        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          pendingScore={pendingRunScore}
          onScoreSaved={() => {
            setHighScore(getHighScore());
          }}
        />
      </div>
    </AndroidFrame>
  );
}
