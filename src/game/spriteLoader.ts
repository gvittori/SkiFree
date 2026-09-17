/**
 * SkiFree Retro - Sprite Image Loader & Cache
 * Loads the authentic SkiFree PNG sprites and provides high-performance rendering.
 */

import { SkierPalette } from '../types';
import { DEFAULT_PALETTE, loadSavedPalette } from './palettes';

const SPRITE_NAMES = [
  'skier_down',
  'skier_down_left',
  'skier_down_right',
  'skier_falling',
  'skier_jump_down',
  'skier_jump_left',
  'skier_jump_right',
  'skier_left',
  'skier_left_down',
  'skier_ouch',
  'skier_right',
  'skier_right_down',
  'skier_sit',
  'skier_skate_left',
  'skier_skate_right',
  'skier_trick1_left',
  'skier_trick1_right',
  'skier_trick2',
  'skier_upside_down1',
  'skier_upside_down2',
  'yeti1',
  'yeti2',
  'yeti_run_left1',
  'yeti_run_left2',
  'yeti_run_left3',
  'yeti_run_right1',
  'yeti_run_right2',
  'yeti_run_right3',
  'yeti_eat1',
  'yeti_eat2',
  'yeti_eat3',
  'yeti_eat4',
  'yeti_eat5',
  'snowboarder_left',
  'snowboarder_right',
  'snowboarder_crash',
  'tree_small',
  'tree_large',
  'tree_bare',
  'stump',
  'rock',
  'bump_small',
  'bump_large',
  'other_skier1',
  'other_skier2',
  'other_skier3',
  'other_skier_crash',
  'dog1',
  'dog2',
  'dog_woof1',
  'dog_woof2',
] as const;

export type SpriteKey = typeof SPRITE_NAMES[number];

const SKIER_SPRITES = new Set<string>([
  'skier_down',
  'skier_down_left',
  'skier_down_right',
  'skier_falling',
  'skier_jump_down',
  'skier_jump_left',
  'skier_jump_right',
  'skier_left',
  'skier_left_down',
  'skier_ouch',
  'skier_right',
  'skier_right_down',
  'skier_sit',
  'skier_skate_left',
  'skier_skate_right',
  'skier_trick1_left',
  'skier_trick1_right',
  'skier_trick2',
  'skier_upside_down1',
  'skier_upside_down2',
]);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

class SpriteStore {
  private cache = new Map<string, HTMLImageElement>();
  private loadedMap = new Map<string, boolean>();
  private recoloredCanvases = new Map<string, HTMLCanvasElement>();
  private currentPalette: SkierPalette = DEFAULT_PALETTE;

  constructor() {
    this.preloadAll();
  }

  private preloadAll() {
    if (typeof window === 'undefined') return;

    this.currentPalette = loadSavedPalette();

    let loadedCount = 0;
    const total = SPRITE_NAMES.length;

    for (const name of SPRITE_NAMES) {
      const img = new Image();
      img.src = `/sprites/${name}.png`;
      img.onload = () => {
        this.loadedMap.set(name, true);
        loadedCount++;
        if (SKIER_SPRITES.has(name)) {
          this.recolorSingleSprite(name, img);
        }
        if (loadedCount === total) {
          this.applyPalette(this.currentPalette);
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${name}`);
      };
      this.cache.set(name, img);
    }
  }

  /**
   * Set custom palette for skier hat, sweater/arms, and pants
   */
  public applyPalette(palette: SkierPalette) {
    this.currentPalette = palette;
    this.recoloredCanvases.clear();

    const isDefault =
      palette.hatColor.toUpperCase() === DEFAULT_PALETTE.hatColor &&
      palette.sweaterColor.toUpperCase() === DEFAULT_PALETTE.sweaterColor &&
      palette.pantsColor.toUpperCase() === DEFAULT_PALETTE.pantsColor;

    if (isDefault) {
      // Use original authentic pixel colors
      return;
    }

    for (const name of SKIER_SPRITES) {
      const img = this.cache.get(name);
      if (img && img.complete && img.naturalWidth > 0) {
        this.recolorSingleSprite(name, img);
      }
    }
  }

  private recolorSingleSprite(name: string, img: HTMLImageElement) {
    const isDefault =
      this.currentPalette.hatColor.toUpperCase() === DEFAULT_PALETTE.hatColor &&
      this.currentPalette.sweaterColor.toUpperCase() === DEFAULT_PALETTE.sweaterColor &&
      this.currentPalette.pantsColor.toUpperCase() === DEFAULT_PALETTE.pantsColor;

    if (isDefault) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      const hat = hexToRgb(this.currentPalette.hatColor);
      const sweater = hexToRgb(this.currentPalette.sweaterColor);
      const pants = hexToRgb(this.currentPalette.pantsColor);

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const a = d[i + 3];

        if (a < 50) continue;

        // 1. Hat & Pom-pom: Red dominance (r > 150, g < 75, b < 75)
        if (r > 150 && g < 75 && b < 75) {
          const factor = r / 255;
          d[i] = Math.min(255, Math.round(hat.r * factor));
          d[i + 1] = Math.min(255, Math.round(hat.g * factor));
          d[i + 2] = Math.min(255, Math.round(hat.b * factor));
        }
        // 2. Sweater & Arms: Magenta / Purple dominance (r > 120, g < 75, b > 120)
        else if (r > 120 && g < 75 && b > 120) {
          const factor = Math.max(r, b) / 255;
          d[i] = Math.min(255, Math.round(sweater.r * factor));
          d[i + 1] = Math.min(255, Math.round(sweater.g * factor));
          d[i + 2] = Math.min(255, Math.round(sweater.b * factor));
        }
        // 3. Pants: Blue dominance (r < 65, g < 95, b > 130)
        else if (r < 65 && g < 95 && b > 130) {
          const factor = b / 255;
          d[i] = Math.min(255, Math.round(pants.r * factor));
          d[i + 1] = Math.min(255, Math.round(pants.g * factor));
          d[i + 2] = Math.min(255, Math.round(pants.b * factor));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      this.recoloredCanvases.set(name, canvas);
    } catch (err) {
      console.warn(`Failed to recolor sprite ${name}:`, err);
    }
  }

  public get(name: string): HTMLCanvasElement | HTMLImageElement | null {
    if (this.recoloredCanvases.has(name)) {
      return this.recoloredCanvases.get(name)!;
    }
    const img = this.cache.get(name);
    if (img && (img.complete || this.loadedMap.get(name))) {
      return img;
    }
    return null;
  }

  public isLoaded(name: string): boolean {
    const img = this.cache.get(name);
    return !!(img && img.complete && img.naturalWidth > 0);
  }

  public getCurrentPalette(): SkierPalette {
    return this.currentPalette;
  }

  /**
   * Draw sprite centered horizontally and anchored near bottom
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    scale: number = 1.35,
    anchorX: number = 0.5,
    anchorY: number = 0.9,
    flipX: boolean = false
  ): boolean {
    const drawable = this.get(name);
    if (!drawable) return false;

    const width = 'naturalWidth' in drawable ? drawable.naturalWidth : drawable.width;
    const height = 'naturalHeight' in drawable ? drawable.naturalHeight : drawable.height;

    if (width === 0 || height === 0) return false;

    const w = width * scale;
    const h = height * scale;

    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));

    if (flipX) {
      ctx.scale(-1, 1);
    }

    const dx = -Math.floor(w * anchorX);
    const dy = -Math.floor(h * anchorY);

    ctx.drawImage(drawable, dx, dy, Math.floor(w), Math.floor(h));
    ctx.restore();
    return true;
  }
}

export const spriteStore = new SpriteStore();
