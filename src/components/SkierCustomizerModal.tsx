import React, { useState, useEffect, useRef } from 'react';
import { SkierPalette } from '../types';
import { DEFAULT_PALETTE, PRESET_PALETTES, savePalette } from '../game/palettes';
import { spriteStore } from '../game/spriteLoader';
import { sound } from '../game/audio';
import { Check, RotateCcw, X, Palette, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPalette: SkierPalette;
  onPaletteChange: (palette: SkierPalette) => void;
}

const COLOR_SWATCHES = [
  '#FF0000', // Red
  '#FF007F', // Hot Pink
  '#FF00FF', // Magenta
  '#8800FF', // Purple
  '#0000FF', // Blue
  '#00C8FF', // Cyan
  '#00FF88', // Mint
  '#00AA00', // Green
  '#FFAA00', // Orange
  '#FFFF00', // Yellow
  '#FFFFFF', // White
  '#505050', // Gray
  '#151515', // Black
];

export const SkierCustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentPalette,
  onPaletteChange,
}) => {
  const [palette, setPalette] = useState<SkierPalette>(currentPalette);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stanceIndex, setStanceIndex] = useState(0);

  const previewStances = ['skier_down', 'skier_left_down', 'skier_right_down', 'skier_jump_down'];

  useEffect(() => {
    setPalette(currentPalette);
  }, [currentPalette, isOpen]);

  // Cycle preview stances for animation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setStanceIndex(prev => (prev + 1) % previewStances.length);
    }, 700);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Render skier preview whenever palette or stance changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set pixelated rendering
    ctx.imageSmoothingEnabled = false;

    // Clear background to clean snow color
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw retro checkered snow grid
    ctx.fillStyle = '#F0F4F8';
    for (let py = 0; py < canvas.height; py += 12) {
      for (let px = 0; px < canvas.width; px += 12) {
        if ((px / 12 + py / 12) % 2 === 0) {
          ctx.fillRect(px, py, 12, 12);
        }
      }
    }

    // Ground shadow
    ctx.fillStyle = 'rgba(128, 184, 232, 0.7)';
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height / 2 + 32, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Temporarily apply current selected palette to spriteStore for live preview
    spriteStore.applyPalette(palette);

    const spriteName = previewStances[stanceIndex];
    spriteStore.draw(
      ctx,
      spriteName,
      canvas.width / 2,
      canvas.height / 2 + 24,
      3.2, // Big pixelated preview
      0.5,
      0.9
    );
  }, [isOpen, palette, stanceIndex]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: SkierPalette) => {
    sound.playClick();
    setPalette(preset);
  };

  const handleColorChange = (part: 'hatColor' | 'sweaterColor' | 'pantsColor', color: string) => {
    sound.playClick();
    setPalette(prev => ({
      ...prev,
      id: 'custom',
      name: 'CUSTOM SUIT',
      [part]: color,
    }));
  };

  const handleSave = () => {
    sound.playHighscore();
    savePalette(palette);
    spriteStore.applyPalette(palette);
    onPaletteChange(palette);
    onClose();
  };

  const handleReset = () => {
    sound.playClick();
    setPalette(DEFAULT_PALETTE);
  };

  return (
    <div
      id="skier-customizer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none"
    >
      <div className="pixel-panel w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-black font-pixel text-xs">
        {/* Retro Titlebar */}
        <div className="pixel-titlebar flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-yellow-300" />
            <span className="truncate">CUSTOMIZE SKIER OUTFIT</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              // Revert to original active palette if cancelled without saving
              spriteStore.applyPalette(currentPalette);
              onClose();
            }}
            className="pixel-btn px-1.5 py-0.5 text-black hover:bg-red-500 hover:text-white font-pixel text-[10px]"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 overflow-y-auto space-y-4 max-h-[calc(92vh-80px)]">
          {/* Live Preview Box */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pixel-inset p-2.5 bg-slate-100">
            <div className="relative border-2 border-black bg-white shadow-inner shrink-0">
              <canvas
                ref={canvasRef}
                width={130}
                height={130}
                className="block"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute bottom-1 right-1 px-1 bg-black/70 text-white text-[8px]">
                3.2X ZOOM
              </div>
            </div>

            <div className="flex-1 w-full space-y-1.5 text-center sm:text-left">
              <div className="text-[10px] text-slate-500">CURRENT SUIT</div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {palette.name}
              </div>
              <p className="text-[9px] text-slate-600 leading-normal">
                Color changes swap original 16-color pixel tones for authentic 1991 gameplay.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[9px]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 border border-black" style={{ backgroundColor: palette.hatColor }} /> Hat
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 border border-black" style={{ backgroundColor: palette.sweaterColor }} /> Sweater
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 border border-black" style={{ backgroundColor: palette.pantsColor }} /> Pants
                </span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-slate-800">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>RETRO PRESETS:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PRESET_PALETTES.map(p => {
                const isSelected =
                  palette.hatColor === p.hatColor &&
                  palette.sweaterColor === p.sweaterColor &&
                  palette.pantsColor === p.pantsColor;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`pixel-btn p-1.5 text-[9px] flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-amber-200 border-black font-bold ring-2 ring-amber-500'
                        : 'bg-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex gap-0.5 border border-black p-0.5 bg-white">
                      <span className="w-2.5 h-2.5" style={{ backgroundColor: p.hatColor }} />
                      <span className="w-2.5 h-2.5" style={{ backgroundColor: p.sweaterColor }} />
                      <span className="w-2.5 h-2.5" style={{ backgroundColor: p.pantsColor }} />
                    </div>
                    <span className="truncate w-full text-center">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual Color Pickers */}
          <div className="space-y-3 pixel-inset p-3 bg-white">
            {/* Hat / Cap Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[10px]">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-3 h-3 border border-black inline-block" style={{ backgroundColor: palette.hatColor }} />
                  HAT & POM-POM:
                </span>
                <input
                  type="color"
                  value={palette.hatColor}
                  onChange={e => handleColorChange('hatColor', e.target.value)}
                  className="w-5 h-5 border border-black cursor-pointer bg-transparent"
                  title="Pick exact custom color"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {COLOR_SWATCHES.map(color => (
                  <button
                    key={'hat-' + color}
                    onClick={() => handleColorChange('hatColor', color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 border-2 ${
                      palette.hatColor.toUpperCase() === color.toUpperCase()
                        ? 'border-black ring-2 ring-yellow-400 scale-110'
                        : 'border-slate-800 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Sweater & Arms Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[10px]">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-3 h-3 border border-black inline-block" style={{ backgroundColor: palette.sweaterColor }} />
                  SWEATER & ARMS:
                </span>
                <input
                  type="color"
                  value={palette.sweaterColor}
                  onChange={e => handleColorChange('sweaterColor', e.target.value)}
                  className="w-5 h-5 border border-black cursor-pointer bg-transparent"
                  title="Pick exact custom color"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {COLOR_SWATCHES.map(color => (
                  <button
                    key={'sweater-' + color}
                    onClick={() => handleColorChange('sweaterColor', color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 border-2 ${
                      palette.sweaterColor.toUpperCase() === color.toUpperCase()
                        ? 'border-black ring-2 ring-yellow-400 scale-110'
                        : 'border-slate-800 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Pants Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[10px]">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-3 h-3 border border-black inline-block" style={{ backgroundColor: palette.pantsColor }} />
                  PANTS:
                </span>
                <input
                  type="color"
                  value={palette.pantsColor}
                  onChange={e => handleColorChange('pantsColor', e.target.value)}
                  className="w-5 h-5 border border-black cursor-pointer bg-transparent"
                  title="Pick exact custom color"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {COLOR_SWATCHES.map(color => (
                  <button
                    key={'pants-' + color}
                    onClick={() => handleColorChange('pantsColor', color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 border-2 ${
                      palette.pantsColor.toUpperCase() === color.toUpperCase()
                        ? 'border-black ring-2 ring-yellow-400 scale-110'
                        : 'border-slate-800 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-2.5 bg-slate-200 border-t-2 border-black flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleReset}
            className="pixel-btn px-3 py-1.5 text-[9px] flex items-center gap-1 hover:bg-slate-300"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET CLASSIC</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                spriteStore.applyPalette(currentPalette);
                onClose();
              }}
              className="pixel-btn px-3 py-1.5 text-[9px] hover:bg-slate-300"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="pixel-btn-action px-4 py-1.5 text-[10px] font-bold flex items-center gap-1.5 text-white"
            >
              <Check className="w-3.5 h-3.5" />
              <span>EQUIP OUTFIT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
