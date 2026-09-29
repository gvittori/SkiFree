/**
 * SkiFree Retro - Canvas Renderer with Phaser 3 CDN Game Loop Integration
 */

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/gameEngine';
import { drawSkier, drawObstacle, drawYeti } from '../game/sprites';

declare global {
  interface Window {
    Phaser?: any;
  }
}

interface SkiCanvasProps {
  engine: GameEngine;
  isGameStarted: boolean;
  onStateUpdate: () => void;
  onTogglePause?: () => void;
}

export const SkiCanvas: React.FC<SkiCanvasProps> = ({
  engine,
  onStateUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameInstanceRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let isDisposed = false;

    const updateSize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width || container.clientWidth || window.innerWidth));
      const h = Math.max(300, Math.floor(rect.height || container.clientHeight || window.innerHeight));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        engine.updateDimensions(w, h);
        if (gameInstanceRef.current?.scale) {
          gameInstanceRef.current.scale.resize(w, h);
        }
      }
    };

    updateSize();

    // Primary drawing routine for all game entities and retro pixel art
    const renderFrame = (time: number = 0) => {
      if (isDisposed || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // 1. Pristine white snow background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Snow powder flecks
      ctx.fillStyle = '#e8f4fc';
      const cameraY = engine.state.skierY;
      const snowPatternStep = 80;
      const startY = Math.floor((cameraY - 200) / snowPatternStep) * snowPatternStep;
      for (let sy = startY; sy < cameraY + height + 100; sy += snowPatternStep) {
        const px1 = ((sy * 37) % 360) - 180;
        const px2 = ((sy * 73) % 400) - 200;
        const screenY1 = sy - cameraY + height * 0.35;
        const screenY2 = (sy + 40) - cameraY + height * 0.35;
        ctx.fillRect(Math.floor(width / 2 + px1), Math.floor(screenY1), 3, 2);
        ctx.fillRect(Math.floor(width / 2 + px2), Math.floor(screenY2), 4, 2);
      }

      const screenCenterX = width / 2;
      const screenSkierY = height * 0.35;

      // 2. Authentic twin ski tracks on snow
      ctx.fillStyle = 'rgba(176, 216, 248, 0.75)';
      for (const track of engine.state.tracks) {
        const tx = screenCenterX + (track.x - engine.state.skierX);
        const ty = screenSkierY + (track.y - engine.state.skierY);
        if (ty >= -20 && ty <= height + 20 && tx >= -20 && tx <= width + 20) {
          ctx.fillRect(Math.floor(tx - 4), Math.floor(ty), 2, 3);
          ctx.fillRect(Math.floor(tx + 2), Math.floor(ty), 2, 3);
        }
      }

      // 2b. Blood splatter stains painting the snow red until they leave the screen
      if (engine.state.bloodStains && engine.state.bloodStains.length > 0) {
        for (const stain of engine.state.bloodStains) {
          const bx = screenCenterX + (stain.x - engine.state.skierX);
          const by = screenSkierY + (stain.y - engine.state.skierY);
          if (by >= -30 && by <= height + 30 && bx >= -30 && bx <= width + 30) {
            ctx.fillStyle = stain.color;
            const sz = stain.size;
            ctx.fillRect(Math.floor(bx), Math.floor(by), sz, sz);
            if (sz >= 3) {
              ctx.fillRect(Math.floor(bx) - 1, Math.floor(by), 1, sz - 1);
              ctx.fillRect(Math.floor(bx) + sz, Math.floor(by) + 1, 1, sz - 1);
              ctx.fillRect(Math.floor(bx) + 1, Math.floor(by) + sz, sz - 1, 1);
            }
            if (sz >= 5) {
              ctx.fillStyle = '#480000';
              ctx.fillRect(Math.floor(bx) + 1, Math.floor(by) + 1, sz - 2, sz - 2);
            }
          }
        }
      }

      // 3. Render list with authentic Y-depth sorting
      const renderList: Array<{ type: 'SKIER' | 'OBSTACLE' | 'YETI'; y: number; data?: any }> = [];

      if (engine.state.stance !== 'EATEN') {
        renderList.push({ type: 'SKIER', y: engine.state.skierY });
      }

      for (const obs of engine.state.obstacles) {
        const relY = screenSkierY + (obs.y - engine.state.skierY);
        if (relY > -80 && relY < height + 80) {
          renderList.push({ type: 'OBSTACLE', y: obs.y, data: obs });
        }
      }

      if (engine.state.yeti.active && engine.state.yeti.state !== 'SLEEPING') {
        renderList.push({ type: 'YETI', y: engine.state.yeti.y });
      }

      renderList.sort((a, b) => a.y - b.y);

      // 4. Draw sprites (skier, trees, obstacles, Yeti)
      for (const item of renderList) {
        try {
          if (item.type === 'SKIER') {
            drawSkier(
              ctx,
              screenCenterX,
              screenSkierY,
              engine.state.skierZ,
              engine.state.stance,
              engine.state.isImmune,
              Math.floor(time / 16)
            );
          } else if (item.type === 'OBSTACLE') {
            const obs = item.data;
            const ox = screenCenterX + (obs.x - engine.state.skierX);
            const oy = screenSkierY + (obs.y - engine.state.skierY);
            drawObstacle(ctx, { ...obs, x: ox, y: oy });
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
        } catch (err) {
          // Keep drawing rest of scene if any single sprite encounters an issue
          console.warn('Render sprite error:', item.type, err);
        }
      }

      // 5. Active particles (flying blood droplets, cap, skis, impact stars, snow carve)
      for (const p of engine.state.particles) {
        const px = screenCenterX + (p.x - engine.state.skierX);
        const py = screenSkierY + (p.y - engine.state.skierY);
        if (py >= -40 && py <= height + 40 && px >= -40 && px <= width + 40) {
          const progress = p.life / p.maxLife;
          const alpha = Math.max(0.1, 1 - progress * 0.7);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;

          if (p.shape === 'star') {
            const s = p.size;
            ctx.fillRect(px - s, py, s * 2 + 1, 1);
            ctx.fillRect(px, py - s, 1, s * 2 + 1);
            ctx.fillRect(px - 1, py - 1, 3, 3);
          } else if (p.shape === 'blood_drop') {
            const s = p.size;
            ctx.fillRect(Math.floor(px), Math.floor(py), s, s);
            if (s >= 3) {
              ctx.fillStyle = '#480000';
              ctx.fillRect(Math.floor(px) + 1, Math.floor(py) + 1, s - 2, s - 2);
            }
          } else {
            ctx.fillRect(Math.floor(px), Math.floor(py), p.size, p.size);
          }
          ctx.restore();
        }
      }

      // 6. Floating texts (scores, roars, gore splatters)
      for (const text of engine.state.floatingTexts) {
        const tx = screenCenterX + (text.x - engine.state.skierX);
        const ty = screenSkierY + (text.y - engine.state.skierY);
        if (ty >= -50 && ty <= height + 50 && tx >= -120 && tx <= width + 120) {
          const progress = text.life / text.maxLife;
          ctx.save();
          ctx.globalAlpha = Math.max(0.1, 1 - progress);
          ctx.font = 'bold 11px monospace, "Courier New", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#000000';
          ctx.fillText(text.text, tx - 1, ty - 1);
          ctx.fillText(text.text, tx + 1, ty - 1);
          ctx.fillText(text.text, tx - 1, ty + 1);
          ctx.fillText(text.text, tx + 1, ty + 1);
          ctx.fillStyle = text.color;
          ctx.fillText(text.text, tx, ty);
          ctx.restore();
        }
      }

      ctx.restore();
    };

    // Draw initial static frame immediately so there is never a blank screen
    renderFrame(0);

    // Initializer for Phaser 3 via CDN running in HEADLESS mode (no canvas clearing/wiping)
    const initPhaser = () => {
      if (isDisposed || gameInstanceRef.current || !window.Phaser) return;

      const Phaser = window.Phaser;

      class SkiPhaserScene extends Phaser.Scene {
        constructor() {
          super('SkiPhaserScene');
        }

        update(time: number, delta: number) {
          engine.update(delta);
          onStateUpdate();
          renderFrame(time);
        }
      }

      const config = {
        type: Phaser.HEADLESS,
        width: canvas.width,
        height: canvas.height,
        scene: SkiPhaserScene,
        banner: false,
      };

      try {
        const game = new Phaser.Game(config);
        gameInstanceRef.current = game;
      } catch (err) {
        console.warn('Phaser 3 headless initialization fallback:', err);
      }
    };

    // Poll for Phaser 3 script readiness from CDN
    let pollInterval: NodeJS.Timeout | null = null;
    if (window.Phaser) {
      initPhaser();
    } else {
      pollInterval = setInterval(() => {
        if (window.Phaser) {
          if (pollInterval) clearInterval(pollInterval);
          initPhaser();
        }
      }, 50);
    }

    // High-performance continuous animation loop: runs independently to guarantee immediate visibility
    let animId: number;
    let lastTime = performance.now();
    const renderLoop = (now: number) => {
      if (isDisposed) return;
      const dt = Math.min(32, Math.max(1, now - lastTime));
      lastTime = now;

      // When Phaser is not active or during initialization, drive engine here
      if (!gameInstanceRef.current) {
        engine.update(dt);
        onStateUpdate();
      }

      renderFrame(now);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    // Resize observer to maintain crisp resolution on all device screens
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      renderFrame(performance.now());
    });

    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      if (pollInterval) clearInterval(pollInterval);
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (gameInstanceRef.current) {
        try {
          gameInstanceRef.current.destroy(true);
        } catch {
          // Ignore destroy errors on unmount
        }
        gameInstanceRef.current = null;
      }
    };
  }, [engine, onStateUpdate]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full overflow-hidden cursor-crosshair bg-white touch-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair select-none touch-none"
      />
    </div>
  );
};
