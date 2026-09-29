/**
 * SkiFree Retro - Skier Color Palettes & Presets
 */

import { SkierPalette } from '../types';

export const DEFAULT_PALETTE: SkierPalette = {
  id: 'classic',
  name: 'CLASSIC 1991',
  hatColor: '#FF0000',      // Crimson Red
  sweaterColor: '#FF00FF',  // Magenta Purple
  pantsColor: '#0000FF',    // Cobalt Blue
};

export const PRESET_PALETTES: SkierPalette[] = [
  DEFAULT_PALETTE,
  {
    id: 'neon80s',
    name: 'NEON 80s',
    hatColor: '#00FFFF',     // Electric Cyan
    sweaterColor: '#FF007F', // Hot Pink
    pantsColor: '#FFE600',   // Vivid Yellow
  },
  {
    id: 'blackdiamond',
    name: 'BLACK DIAMOND',
    hatColor: '#4A4A4A',     // Charcoal Hat
    sweaterColor: '#181818', // Stealth Obsidian
    pantsColor: '#606060',   // Granite Gray
  },
  {
    id: 'alpinemint',
    name: 'ALPINE MINT',
    hatColor: '#00FF88',     // Spring Mint
    sweaterColor: '#00AA66', // Mountain Pine
    pantsColor: '#053322',   // Deep Forest
  },
  {
    id: 'sunsetblaze',
    name: 'SUNSET BLAZE',
    hatColor: '#FF3300',     // Fiery Orange
    sweaterColor: '#FFAA00', // Amber Gold
    pantsColor: '#880000',   // Crimson Dark
  },
  {
    id: 'arcticfrost',
    name: 'ARCTIC FROST',
    hatColor: '#FFFFFF',     // Snow White
    sweaterColor: '#00C8FF', // Glacier Blue
    pantsColor: '#003399',   // Deep Navy
  },
  {
    id: 'cyberpunk',
    name: 'CYBERPUNK',
    hatColor: '#FFFF00',     // Neon Yellow
    sweaterColor: '#8800FF', // Neon Violet
    pantsColor: '#00F0FF',   // Cyber Blue
  },
  {
    id: 'emerald',
    name: 'EMERALD SPEED',
    hatColor: '#39FF14',     // Toxic Lime
    sweaterColor: '#00802B', // Racing Green
    pantsColor: '#002B0F',   // Hunter Green
  },
];

const STORAGE_KEY = 'skifree_custom_palette';

export function loadSavedPalette(): SkierPalette {
  if (typeof window === 'undefined') return DEFAULT_PALETTE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.hatColor && parsed.sweaterColor && parsed.pantsColor) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load saved palette:', err);
  }
  return DEFAULT_PALETTE;
}

export function savePalette(palette: SkierPalette): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palette));
  } catch (err) {
    console.error('Failed to save palette:', err);
  }
}
