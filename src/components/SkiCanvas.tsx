/**
 * SkiFree Retro - Canvas Renderer & Game Loop
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { GameEngine } from '../game/gameEngine';
import { drawSkier, drawObstacle, drawYeti } from '../game/sprites';

interface SkiCanvasProps {
  engine: GameEngine;
  isGameStarted: boolean;
  onStateUpdate: () => void;
  onTogglePause?: () => void;
}

export const SkiCanvas: React.FC<SkiCanvasProps> = ({
  engine,
  isGameStarted,
  onStateUpdate,
  onTogglePause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Handle ResizeObserver for responsive canvas sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      if (!canvasRef.current || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvasRef.current.width = Math.floor(rect.width * dpr);
      canvasRef.current.height = Math.floor(rect.height * dpr);
      engine.updateDimensions(rect.width, rect.height);
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [engine]);

  // Main Render Routine
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewWidth = canvas.width / dpr;
    const viewHeight = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Disable image smoothing for sharp retro 90s pixels
    ctx.imageSmoothingEnabled = false;

    // 1. Clear background with retro crisp snow
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Subtle slope texture / snow powder flecks
    ctx.fillStyle = '#E8F4FC';
    const cameraY = engine.state.skierY;
    const snowPatternStep = 80;
    const startY = Math.floor((cameraY - 200) / snowPatternStep) * snowPatternStep;
    for (let sy = startY; sy < cameraY + viewHeight + 100; sy += snowPatternStep) {
      const px1 = ((sy * 37) % 360) - 180;
      const px2 = ((sy * 73) % 400) - 200;
      const screenY1 = sy - cameraY + viewHeight * 0.35;
      const screenY2 = (sy + 40) - cameraY + viewHeight * 0.35;
      ctx.fillRect(viewWidth / 2 + px1, screenY1, 3, 2);
      ctx.fillRect(viewWidth / 2 + px2, screenY2, 4, 2);
    }

    // Camera offset: center horizontal, place skier ~35% down from top
    const screenCenterX = viewWidth / 2;
    const screenSkierY = viewHeight * 0.35;

    // 2. Draw Ski Tracks on Snow
    ctx.fillStyle = 'rgba(176, 216, 248, 0.7)';
    for (const track of engine.state.tracks) {
      const tx = screenCenterX + (track.x - engine.state.skierX);
      const ty = screenSkierY + (track.y - engine.state.skierY);

      if (ty >= -20 && ty <= viewHeight + 20 && tx >= -20 && tx <= viewWidth + 20) {
        ctx.fillRect(tx - 4, ty, 2, 3);
        ctx.fillRect(tx + 2, ty, 2, 3);
      }
    }

    // 3. Collect and sort all visible entities by Y for correct isometric depth
    const renderList: Array<{
      type: 'SKIER' | 'OBSTACLE' | 'YETI';
      y: number;
      data?: any;
    }> = [];

    // Skier
    if (engine.state.stance !== 'EATEN') {
      renderList.push({
        type: 'SKIER',
        y: engine.state.skierY,
      });
    }

    // Obstacles
    for (const obs of engine.state.obstacles) {
      const relY = screenSkierY + (obs.y - engine.state.skierY);
      if (relY > -80 && relY < viewHeight + 80) {
        renderList.push({
          type: 'OBSTACLE',
          y: obs.y,
          data: obs,
        });
      }
    }

    // Yeti
    if (engine.state.yeti.active && engine.state.yeti.state !== 'SLEEPING') {
      renderList.push({
        type: 'YETI',
        y: engine.state.yeti.y,
      });
    }

    // Sort ascending by Y so lower entities appear in front
    renderList.sort((a, b) => a.y - b.y);

    // 4. Draw Sorted Entities
    for (const item of renderList) {
      if (item.type === 'SKIER') {
        const sx = screenCenterX;
        const sy = screenSkierY;
        drawSkier(
          ctx,
          sx,
          sy,
          engine.state.skierZ,
          engine.state.stance,
          engine.state.isImmune,
          performance.now() / 16
        );
      } else if (item.type === 'OBSTACLE') {
        const obs = item.data;
        const ox = screenCenterX + (obs.x - engine.state.skierX);
        const oy = screenSkierY + (obs.y - engine.state.skierY);
        drawObstacle(ctx, {
          ...obs,
          x: ox,
          y: oy,
        });
      } else if (item.type === 'YETI') {
        const yx = screenCenterX + (engine.state.yeti.x - engine.state.skierX);
        const yy = screenSkierY + (engine.state.yeti.y - engine.state.skierY);
        drawYeti(
          ctx,
          yx,
          yy,
          engine.state.yeti.state,
          engine.state.yeti.frame,
          engine.state.yeti.eatStep,
          engine.state.yeti.vx
        );
      }
    }

    // 5. Draw Particles (Snow spray, stars, crash pieces)
    for (const p of engine.state.particles) {
      const px = screenCenterX + (p.x - engine.state.skierX);
      const py = screenSkierY + (p.y - engine.state.skierY);

      if (px >= 0 && px <= viewWidth && py >= 0 && py <= viewHeight) {
        ctx.fillStyle = p.color;
        if (p.shape === 'star') {
          // Retro 4-point star
          ctx.fillRect(px - p.size / 2, py - 1, p.size, 2);
          ctx.fillRect(px - 1, py - p.size / 2, 2, p.size);
        } else {
          ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
        }
      }
    }

    // 6. Draw Floating Texts (Tricks, "HOP!", "OUCH!")
    ctx.textAlign = 'center';
    for (const ft of engine.state.floatingTexts) {
      const fx = screenCenterX + (ft.x - engine.state.skierX);
      const fy = screenSkierY + (ft.y - engine.state.skierY);

      if (fx >= 0 && fx <= viewWidth && fy >= 0 && fy <= viewHeight) {
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#000000';
        ctx.fillText(ft.text, fx + 1, fy + 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, fx, fy);
      }
    }

    ctx.restore();
  }, [engine]);

  // Main Animation Loop
  useEffect(() => {
    let active = true;

    const loop = (time: number) => {
      if (!active) return;
      const dt = Math.min(time - lastTimeRef.current, 100);
      lastTimeRef.current = time;

      if (isGameStarted && engine.state.isRunning && !engine.state.isPaused) {
        engine.update(dt);
        onStateUpdate();
      }
      render();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [engine, isGameStarted, render, onStateUpdate]);

  // Keyboard controls for desktop convenience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameStarted || !engine.state.isRunning) return;

      // Pause toggle with 'p', 'P', or 'Escape'
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        onTogglePause?.();
        return;
      }

      // Block skiing actions while paused
      if (engine.state.isPaused) return;

      if (e.repeat && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          engine.steerLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          engine.steerRight();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          engine.steerDown();
          break;
        case ' ': // Spacebar
        case 'ArrowUp':
        case 'w':
        case 'W':
          engine.actionJumpOrTrick();
          break;
        case 'f':
        case 'F':
          engine.throwSnowball();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, isGameStarted, onTogglePause]);

  return (
    <div
      ref={containerRef}
      id="ski-game-canvas-wrapper"
      className="relative w-full h-full overflow-hidden select-none touch-none bg-white cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        id="ski-game-canvas"
        className="block w-full h-full"
      />
    </div>
  );
};
