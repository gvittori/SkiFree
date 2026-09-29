/**
 * SkiFree Retro - Sprite Rendering Engine
 * Faithful recreation of the original Windows SkiFree 16-color pixel art sprites.
 */

import { SkierStance, ObstacleType, YetiState } from '../types';
import { spriteStore } from './spriteLoader';

// Palette constants matching the original SkiFree sheet
export const PALETTE = {
  WHITE: '#FFFFFF',
  SNOW_SHADOW: '#A8D8F8',
  SNOW_CONTOUR: '#80B8E8',
  BLACK: '#000000',
  RED: '#E01820',
  DARK_RED: '#980810',
  PURPLE: '#B820A0',
  BLUE_PANTS: '#1840C8',
  YELLOW_SKI: '#F8D800',
  ORANGE_SKI: '#E09800',
  SKIN: '#F8C8A0',
  PINE_DARK: '#105820',
  PINE_LIGHT: '#288838',
  TRUNK: '#784820',
  YETI_GRAY: '#B0B0B8',
  YETI_DARK: '#707078',
  YETI_LIGHT: '#E0E0E8',
  YETI_MOUTH: '#901018',
  BOARDER_GREEN: '#10B838',
  BOARDER_BOARD: '#1848B8',
  NOVICE_PINK: '#E83088',
  NOVICE_CYAN: '#00C8D8',
  DOG_BROWN: '#784820',
  DOG_DARK: '#402010',
};

/**
 * Helper to draw a pixel block
 */
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

/**
 * Draw Skier in various stances
 */
export function drawSkier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  stance: SkierStance,
  isImmune: boolean,
  animTick: number = 0
) {
  // Blinking immunity effect: toggle visibility every ~60ms
  if (isImmune && Math.floor(animTick / 4) % 2 === 0) {
    return;
  }

  if (stance === 'EATEN') {
    return;
  }

  // Shadow when airborne
  if (z > 2) {
    const shadowScale = Math.max(0.4, 1 - z / 80);
    ctx.fillStyle = 'rgba(128, 184, 232, 0.6)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 10 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const drawY = y - z;
  const spriteScale = 1.35;

  // Determine authentic sprite key from the original SkiFree sheet (Rows 1 & 2)
  let spriteKey = 'skier_down';
  switch (stance) {
    case 'STAND_LEFT':
      spriteKey = 'skier_left';
      break;
    case 'STAND_RIGHT':
      spriteKey = 'skier_right';
      break;
    case 'SKI_LEFT':
      spriteKey = 'skier_down_left';
      break;
    case 'SKI_RIGHT':
      spriteKey = 'skier_down_right';
      break;
    case 'SKI_FAST_LEFT':
      spriteKey = 'skier_left_down';
      break;
    case 'SKI_FAST_RIGHT':
      spriteKey = 'skier_right_down';
      break;
    case 'SKI_DOWN':
    case 'SKI_DOWN_FAST':
      spriteKey = 'skier_down';
      break;
    case 'JUMP_NORMAL':
      spriteKey = 'skier_jump_down';
      break;
    case 'JUMP_SPREAD':
      spriteKey = 'skier_trick1_left';
      break;
    case 'JUMP_FLIP':
      spriteKey = 'skier_upside_down1';
      break;
    case 'JUMP_DAFFY':
      spriteKey = 'skier_trick2';
      break;
    case 'JUMP_IRON_CROSS':
      spriteKey = 'skier_upside_down2';
      break;
    case 'CRASH':
      spriteKey = 'skier_ouch';
      break;
    default:
      spriteKey = 'skier_down';
  }

  // Draw authentic sprite image if ready
  if (spriteStore.draw(ctx, spriteKey, x, drawY, spriteScale, 0.5, 0.88)) {
    return;
  }

  // Pixel art procedural fallback
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(drawY));

  const s = 1.25;
  ctx.scale(s, s);

  switch (stance) {
    case 'STAND_LEFT':
    case 'STAND_RIGHT':
      drawSkierStanding(ctx, stance === 'STAND_LEFT' ? -1 : 1);
      break;

    case 'SKI_LEFT':
    case 'SKI_RIGHT':
      drawSkierSlaloming(ctx, stance === 'SKI_LEFT' ? -1 : 1, true);
      break;

    case 'SKI_FAST_LEFT':
    case 'SKI_FAST_RIGHT':
      drawSkierSlaloming(ctx, stance === 'SKI_FAST_LEFT' ? -1 : 1, false);
      break;

    case 'SKI_DOWN':
      drawSkierDownhill(ctx, false);
      break;

    case 'SKI_DOWN_FAST':
      drawSkierDownhill(ctx, true);
      break;

    case 'JUMP_NORMAL':
      drawSkierJumpNormal(ctx);
      break;

    case 'JUMP_SPREAD':
      drawSkierSpreadEagle(ctx);
      break;

    case 'JUMP_FLIP':
      drawSkierFlip(ctx);
      break;

    case 'JUMP_DAFFY':
      drawSkierDaffy(ctx);
      break;

    case 'JUMP_IRON_CROSS':
      drawSkierIronCross(ctx);
      break;

    case 'CRASH':
      drawSkierCrash(ctx);
      break;

    default:
      drawSkierDownhill(ctx, false);
  }

  ctx.restore();
}

/**
 * Standing Skier (left/right)
 */
function drawSkierStanding(ctx: CanvasRenderingContext2D, dir: number) {
  ctx.scale(dir, 1);
  // Red cap
  px(ctx, -2, -14, 5, 3, PALETTE.RED);
  px(ctx, -4, -13, 2, 2, PALETTE.RED); // Pom-pom
  px(ctx, -2, -11, 6, 1, PALETTE.DARK_RED);

  // Face & goggles
  px(ctx, 0, -11, 4, 3, PALETTE.SKIN);
  px(ctx, 2, -11, 2, 2, PALETTE.BLACK);

  // Purple body
  px(ctx, -3, -8, 7, 6, PALETTE.PURPLE);
  px(ctx, 2, -7, 2, 4, PALETTE.PURPLE); // arm

  // Blue pants
  px(ctx, -3, -2, 6, 6, PALETTE.BLUE_PANTS);

  // Yellow ski
  px(ctx, -10, 4, 18, 2, PALETTE.YELLOW_SKI);
  px(ctx, 8, 3, 2, 1, PALETTE.BLACK); // tip

  // Pole
  px(ctx, 1, -5, 1, 10, PALETTE.BLACK);
  px(ctx, 0, 4, 3, 1, PALETTE.BLACK);
}

/**
 * Slaloming / Carving Skier
 */
function drawSkierSlaloming(ctx: CanvasRenderingContext2D, dir: number, isFast: boolean) {
  ctx.scale(dir, 1);

  if (isFast) {
    // Sharp angle carve
    // Skis diagonal
    px(ctx, -12, 1, 18, 2, PALETTE.YELLOW_SKI);
    px(ctx, -10, 5, 18, 2, PALETTE.YELLOW_SKI);
    px(ctx, 6, 0, 2, 1, PALETTE.BLACK);
    px(ctx, 8, 4, 2, 1, PALETTE.BLACK);

    // Body leaning
    px(ctx, -4, -9, 8, 6, PALETTE.PURPLE);
    px(ctx, -3, -3, 6, 5, PALETTE.BLUE_PANTS);

    // Head
    px(ctx, -1, -12, 4, 3, PALETTE.SKIN);
    px(ctx, 1, -12, 2, 2, PALETTE.BLACK);
    px(ctx, -3, -15, 6, 3, PALETTE.RED);
    px(ctx, -5, -14, 2, 2, PALETTE.RED);

    // Poles trailing behind
    px(ctx, -8, -5, 6, 8, PALETTE.BLACK);
  } else {
    // Gentle diagonal
    px(ctx, -10, 2, 16, 2, PALETTE.YELLOW_SKI);
    px(ctx, -8, 5, 16, 2, PALETTE.YELLOW_SKI);
    px(ctx, 6, 1, 2, 1, PALETTE.BLACK);
    px(ctx, 8, 4, 2, 1, PALETTE.BLACK);

    // Body
    px(ctx, -3, -8, 7, 6, PALETTE.PURPLE);
    px(ctx, -2, -2, 6, 5, PALETTE.BLUE_PANTS);

    // Head
    px(ctx, 0, -11, 4, 3, PALETTE.SKIN);
    px(ctx, 2, -11, 2, 2, PALETTE.BLACK);
    px(ctx, -2, -14, 6, 3, PALETTE.RED);
    px(ctx, -4, -13, 2, 2, PALETTE.RED);

    // Poles
    px(ctx, 3, -6, 1, 10, PALETTE.BLACK);
    px(ctx, -5, -4, 1, 9, PALETTE.BLACK);
  }
}

/**
 * Downhill Skier (Facing front / straight down)
 */
function drawSkierDownhill(ctx: CanvasRenderingContext2D, isFast: boolean) {
  if (isFast) {
    // Tucked / back view speeding
    // Skis straight down
    px(ctx, -4, -4, 2, 14, PALETTE.YELLOW_SKI);
    px(ctx, 2, -4, 2, 14, PALETTE.YELLOW_SKI);
    px(ctx, -4, 10, 2, 1, PALETTE.BLACK);
    px(ctx, 2, 10, 2, 1, PALETTE.BLACK);

    // Body tucked low
    px(ctx, -4, -10, 8, 6, PALETTE.PURPLE);
    px(ctx, -3, -4, 6, 4, PALETTE.BLUE_PANTS);

    // Head looking down / red cap prominent
    px(ctx, -3, -15, 6, 5, PALETTE.RED);
    px(ctx, -1, -17, 2, 2, PALETTE.RED);

    // Poles held back
    px(ctx, -7, -8, 1, 11, PALETTE.BLACK);
    px(ctx, 6, -8, 1, 11, PALETTE.BLACK);
  } else {
    // Standard front view
    // Skis straight down
    px(ctx, -5, -3, 2, 13, PALETTE.YELLOW_SKI);
    px(ctx, 3, -3, 2, 13, PALETTE.YELLOW_SKI);
    px(ctx, -5, 10, 2, 1, PALETTE.BLACK);
    px(ctx, 3, 10, 2, 1, PALETTE.BLACK);

    // Blue pants
    px(ctx, -4, -3, 8, 5, PALETTE.BLUE_PANTS);

    // Purple jacket
    px(ctx, -5, -9, 10, 6, PALETTE.PURPLE);

    // Face & goggles
    px(ctx, -3, -12, 6, 3, PALETTE.SKIN);
    px(ctx, -2, -12, 4, 2, PALETTE.BLACK);

    // Red cap
    px(ctx, -4, -15, 8, 3, PALETTE.RED);
    px(ctx, 3, -14, 2, 2, PALETTE.RED); // pom-pom to side

    // Poles
    px(ctx, -7, -7, 1, 11, PALETTE.BLACK);
    px(ctx, 6, -7, 1, 11, PALETTE.BLACK);
  }
}

/**
 * Jump - Normal
 */
function drawSkierJumpNormal(ctx: CanvasRenderingContext2D) {
  // Angled skis in air
  px(ctx, -6, 2, 12, 2, PALETTE.YELLOW_SKI);
  px(ctx, -6, 5, 12, 2, PALETTE.YELLOW_SKI);

  // Body
  px(ctx, -4, -6, 8, 6, PALETTE.PURPLE);
  px(ctx, -3, 0, 6, 4, PALETTE.BLUE_PANTS);

  // Head
  px(ctx, -2, -9, 5, 3, PALETTE.SKIN);
  px(ctx, -3, -12, 7, 3, PALETTE.RED);

  // Arms out with poles
  px(ctx, -8, -5, 3, 2, PALETTE.PURPLE);
  px(ctx, 5, -5, 3, 2, PALETTE.PURPLE);
  px(ctx, -8, -4, 1, 8, PALETTE.BLACK);
  px(ctx, 7, -4, 1, 8, PALETTE.BLACK);
}

/**
 * Trick 1: Spread Eagle / Split Jump
 */
function drawSkierSpreadEagle(ctx: CanvasRenderingContext2D) {
  // Skis spread in a V
  // Left ski angled left
  px(ctx, -12, 3, 7, 2, PALETTE.YELLOW_SKI);
  px(ctx, -14, 1, 3, 2, PALETTE.YELLOW_SKI);
  px(ctx, -15, 0, 2, 1, PALETTE.BLACK);

  // Right ski angled right
  px(ctx, 5, 3, 7, 2, PALETTE.YELLOW_SKI);
  px(ctx, 11, 1, 3, 2, PALETTE.YELLOW_SKI);
  px(ctx, 13, 0, 2, 1, PALETTE.BLACK);

  // Legs spread wide
  px(ctx, -7, 0, 4, 4, PALETTE.BLUE_PANTS);
  px(ctx, 3, 0, 4, 4, PALETTE.BLUE_PANTS);

  // Body
  px(ctx, -4, -6, 8, 6, PALETTE.PURPLE);

  // Arms wide up
  px(ctx, -8, -10, 4, 4, PALETTE.PURPLE);
  px(ctx, 4, -10, 4, 4, PALETTE.PURPLE);

  // Poles sticking high
  px(ctx, -10, -14, 1, 8, PALETTE.BLACK);
  px(ctx, 9, -14, 1, 8, PALETTE.BLACK);

  // Head
  px(ctx, -2, -10, 5, 3, PALETTE.SKIN);
  px(ctx, -3, -13, 6, 3, PALETTE.RED);
}

/**
 * Trick 2: Inverted Somersault / Flip
 */
function drawSkierFlip(ctx: CanvasRenderingContext2D) {
  // Upside down! Skis pointing straight UP in the sky!
  px(ctx, -3, -16, 2, 14, PALETTE.YELLOW_SKI);
  px(ctx, 1, -16, 2, 14, PALETTE.YELLOW_SKI);
  px(ctx, -3, -17, 2, 1, PALETTE.BLACK);
  px(ctx, 1, -17, 2, 1, PALETTE.BLACK);

  // Legs upside down
  px(ctx, -4, -4, 8, 5, PALETTE.BLUE_PANTS);

  // Torso
  px(ctx, -4, 1, 8, 6, PALETTE.PURPLE);

  // Head near bottom
  px(ctx, -2, 7, 5, 3, PALETTE.SKIN);
  px(ctx, -3, 10, 6, 4, PALETTE.RED);
  px(ctx, -1, 14, 2, 2, PALETTE.RED); // Pom pom hanging down

  // Arms out to side
  px(ctx, -8, 2, 4, 2, PALETTE.PURPLE);
  px(ctx, 4, 2, 4, 2, PALETTE.PURPLE);
}

/**
 * Trick 3: Daffy (One ski forward, one ski back)
 */
function drawSkierDaffy(ctx: CanvasRenderingContext2D) {
  // Left ski vertical pointing UP
  px(ctx, -6, -12, 2, 14, PALETTE.YELLOW_SKI);
  px(ctx, -6, -13, 2, 1, PALETTE.BLACK);

  // Right ski horizontal pointing DOWN / BACK
  px(ctx, 3, 2, 2, 12, PALETTE.YELLOW_SKI);
  px(ctx, 3, 14, 2, 1, PALETTE.BLACK);

  // Scissor legs
  px(ctx, -5, -2, 4, 5, PALETTE.BLUE_PANTS);
  px(ctx, 1, 1, 4, 5, PALETTE.BLUE_PANTS);

  // Torso
  px(ctx, -4, -6, 8, 6, PALETTE.PURPLE);

  // Head
  px(ctx, -2, -10, 5, 3, PALETTE.SKIN);
  px(ctx, -3, -13, 6, 3, PALETTE.RED);

  // Arms
  px(ctx, -7, -7, 3, 2, PALETTE.PURPLE);
  px(ctx, 4, -5, 3, 2, PALETTE.PURPLE);
}

/**
 * Trick 4: Iron Cross (Skis crossed in an X behind)
 */
function drawSkierIronCross(ctx: CanvasRenderingContext2D) {
  // Crossed skis forming an X
  // Diag 1
  px(ctx, -7, -4, 14, 2, PALETTE.YELLOW_SKI);
  // Diag 2
  px(ctx, -7, 4, 14, 2, PALETTE.YELLOW_SKI);

  // Center legs
  px(ctx, -3, -2, 6, 4, PALETTE.BLUE_PANTS);

  // Torso
  px(ctx, -4, -8, 8, 6, PALETTE.PURPLE);

  // Head
  px(ctx, -2, -11, 5, 3, PALETTE.SKIN);
  px(ctx, -3, -14, 6, 3, PALETTE.RED);

  // Arms out
  px(ctx, -8, -8, 4, 2, PALETTE.PURPLE);
  px(ctx, 4, -8, 4, 2, PALETTE.PURPLE);
}

/**
 * Skier Crash (Wipeout)
 * Red hat flung, skis crossed, star dust, and retro "OUCH!"
 */
function drawSkierCrash(ctx: CanvasRenderingContext2D) {
  // Fallen body face in snow
  px(ctx, -5, 0, 8, 4, PALETTE.PURPLE);
  px(ctx, -8, 1, 4, 3, PALETTE.BLUE_PANTS);

  // Crossed disconnected yellow skis in air
  // Ski 1
  px(ctx, 2, -10, 2, 12, PALETTE.YELLOW_SKI);
  px(ctx, 2, -11, 2, 1, PALETTE.BLACK);

  // Ski 2 angled
  px(ctx, 7, -8, 10, 2, PALETTE.YELLOW_SKI);
  px(ctx, 17, -8, 1, 2, PALETTE.BLACK);

  // Poles tossed
  px(ctx, -12, -4, 8, 1, PALETTE.BLACK);
  px(ctx, -3, -9, 1, 8, PALETTE.BLACK);

  // Red cap flung to the left
  px(ctx, -11, -8, 5, 4, PALETTE.RED);
  px(ctx, -13, -7, 2, 2, PALETTE.RED);

  // Stars / impact particles
  px(ctx, 0, -14, 2, 2, PALETTE.YELLOW_SKI);
  px(ctx, 8, -14, 2, 2, PALETTE.YELLOW_SKI);
  px(ctx, -4, -13, 2, 2, PALETTE.YELLOW_SKI);

  // "OUCH!" text bubble
  ctx.fillStyle = PALETTE.BLACK;
  ctx.font = 'bold 7px monospace';
  ctx.fillText('OUCH!', 4, -15);
}

/**
 * Yeti Rendering (Abominable Snow Monster - Rows 3 & 4)
 */
export function drawYeti(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: YetiState,
  frame: number,
  eatStep: number,
  vx: number = 0
) {
  if (state === 'SLEEPING') return;

  const yetiScale = 1.45;
  let spriteKey = 'yeti1';

  if (state === 'SPAWNING') {
    spriteKey = Math.floor(frame / 6) % 2 === 0 ? 'yeti1' : 'yeti2';
  } else if (state === 'CHASING' || state === 'POUNCING') {
    const cycle = (Math.floor(frame / 5) % 3) + 1; // 1, 2, 3
    if (vx < -0.4) {
      spriteKey = `yeti_run_left${cycle}`;
    } else if (vx > 0.4) {
      spriteKey = `yeti_run_right${cycle}`;
    } else {
      spriteKey = Math.floor(frame / 8) % 2 === 0 ? `yeti_run_left${cycle}` : `yeti_run_right${cycle}`;
    }
  } else if (state === 'GRABBING') {
    spriteKey = 'yeti_eat1';
  } else if (state === 'EATING') {
    if (eatStep === 0) spriteKey = 'yeti_eat1';
    else if (eatStep === 1) spriteKey = 'yeti_eat2';
    else if (eatStep === 2) spriteKey = 'yeti_eat3';
    else spriteKey = 'yeti_eat4';
  } else if (state === 'CHEWING' || state === 'SATISFIED') {
    spriteKey = 'yeti_eat5'; // Toothpick tooth-picking pose
  } else if (state === 'STUNNED') {
    spriteKey = 'yeti1';
  }

  // Draw authentic Yeti sprite if loaded
  if (spriteStore.draw(ctx, spriteKey, x, y, yetiScale, 0.5, 0.9)) {
    return;
  }

  // Fallback procedural pixel art
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  const s = 1.3;
  ctx.scale(s, s);

  switch (state) {
    case 'CHASING':
    case 'POUNCING':
      drawYetiRunning(ctx, frame);
      break;

    case 'GRABBING':
      drawYetiGrab(ctx);
      break;

    case 'EATING':
      drawYetiEat(ctx, eatStep);
      break;

    case 'CHEWING':
    case 'SATISFIED':
      drawYetiSatisfied(ctx, frame);
      break;

    case 'STUNNED':
      drawYetiStunned(ctx, frame);
      break;

    default:
      drawYetiRunning(ctx, frame);
  }

  ctx.restore();
}

/**
 * Yeti stunned by tree crash or snowball
 */
function drawYetiStunned(ctx: CanvasRenderingContext2D, frame: number) {
  // Body
  px(ctx, -10, -18, 20, 22, PALETTE.YETI_GRAY);
  px(ctx, -8, -16, 16, 18, PALETTE.YETI_LIGHT);
  px(ctx, -8, -26, 16, 9, PALETTE.YETI_GRAY);
  // Dizzy X eyes
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(-5, -23, 3, 3);
  ctx.fillRect(2, -23, 3, 3);

  // Floating dizzy stars
  const angle = (frame * 0.15) % (Math.PI * 2);
  const sx = Math.cos(angle) * 10;
  const sy = -30 + Math.sin(angle * 2) * 3;
  ctx.fillStyle = '#FFFF00';
  ctx.fillRect(Math.floor(sx), Math.floor(sy), 4, 4);
}

/**
 * Yeti running animation
 */
function drawYetiRunning(ctx: CanvasRenderingContext2D, frame: number) {
  const isLeftLeg = (frame % 2) === 0;

  // Furry Body
  px(ctx, -10, -18, 20, 22, PALETTE.YETI_GRAY);
  px(ctx, -8, -16, 16, 18, PALETTE.YETI_LIGHT);

  // Head & Brow
  px(ctx, -8, -26, 16, 9, PALETTE.YETI_GRAY);
  px(ctx, -6, -24, 12, 6, PALETTE.YETI_LIGHT);

  // Eyes
  px(ctx, -5, -23, 2, 2, PALETTE.BLACK);
  px(ctx, 3, -23, 2, 2, PALETTE.BLACK);

  // Mouth & sharp teeth
  px(ctx, -6, -19, 12, 4, PALETTE.YETI_MOUTH);
  px(ctx, -5, -19, 2, 1, PALETTE.WHITE);
  px(ctx, -1, -19, 2, 1, PALETTE.WHITE);
  px(ctx, 3, -19, 2, 1, PALETTE.WHITE);
  px(ctx, -4, -16, 2, 1, PALETTE.WHITE);
  px(ctx, 2, -16, 2, 1, PALETTE.WHITE);

  // Arms swinging
  if (isLeftLeg) {
    // Left arm raised, right arm down
    px(ctx, -16, -20, 6, 8, PALETTE.YETI_GRAY);
    px(ctx, -18, -14, 3, 4, PALETTE.YETI_DARK); // claws
    px(ctx, 10, -12, 6, 8, PALETTE.YETI_GRAY);
    px(ctx, 14, -6, 3, 4, PALETTE.YETI_DARK);
    // Legs
    px(ctx, -8, 4, 5, 8, PALETTE.YETI_GRAY);
    px(ctx, -11, 10, 8, 3, PALETTE.YETI_DARK); // left foot forward
    px(ctx, 3, 4, 5, 6, PALETTE.YETI_GRAY);
  } else {
    // Right arm raised, left arm down
    px(ctx, -16, -12, 6, 8, PALETTE.YETI_GRAY);
    px(ctx, -18, -6, 3, 4, PALETTE.YETI_DARK);
    px(ctx, 10, -20, 6, 8, PALETTE.YETI_GRAY);
    px(ctx, 14, -14, 3, 4, PALETTE.YETI_DARK);
    // Legs
    px(ctx, -8, 4, 5, 6, PALETTE.YETI_GRAY);
    px(ctx, 3, 4, 5, 8, PALETTE.YETI_GRAY);
    px(ctx, 3, 10, 8, 3, PALETTE.YETI_DARK); // right foot forward
  }
}

/**
 * Yeti holding skier upside down
 */
function drawYetiGrab(ctx: CanvasRenderingContext2D) {
  // Standing yeti
  px(ctx, -10, -18, 20, 22, PALETTE.YETI_GRAY);
  px(ctx, -8, -16, 16, 18, PALETTE.YETI_LIGHT);
  px(ctx, -8, -26, 16, 9, PALETTE.YETI_GRAY);
  px(ctx, -5, -23, 2, 2, PALETTE.BLACK);
  px(ctx, 3, -23, 2, 2, PALETTE.BLACK);
  px(ctx, -5, -18, 10, 3, PALETTE.YETI_MOUTH);

  // Claws holding skier
  px(ctx, -16, -14, 8, 6, PALETTE.YETI_GRAY);
  px(ctx, 8, -14, 8, 6, PALETTE.YETI_GRAY);

  // Skier held dangling
  px(ctx, -4, -6, 8, 14, PALETTE.PURPLE);
  px(ctx, -3, 8, 6, 6, PALETTE.BLUE_PANTS);
  px(ctx, -10, 14, 20, 2, PALETTE.YELLOW_SKI);
}

/**
 * Yeti eating skier (animated steps)
 */
function drawYetiEat(ctx: CanvasRenderingContext2D, step: number) {
  // Body
  px(ctx, -10, -18, 20, 22, PALETTE.YETI_GRAY);
  px(ctx, -8, -16, 16, 18, PALETTE.YETI_LIGHT);
  px(ctx, -8, -26, 16, 9, PALETTE.YETI_GRAY);

  // Wide mouth eating
  px(ctx, -7, -20, 14, 8, PALETTE.YETI_MOUTH);

  if (step === 0) {
    // Stuffing skier in mouth
    px(ctx, -4, -18, 8, 10, PALETTE.PURPLE);
    px(ctx, -3, -8, 6, 8, PALETTE.BLUE_PANTS);
    px(ctx, -8, 0, 16, 2, PALETTE.YELLOW_SKI);
  } else if (step === 1) {
    // Only legs and skis kicking out of mouth
    px(ctx, -3, -16, 6, 8, PALETTE.BLUE_PANTS);
    px(ctx, -8, -8, 16, 2, PALETTE.YELLOW_SKI);
  } else {
    // Only yellow skis sticking out
    px(ctx, -4, -16, 8, 4, PALETTE.YELLOW_SKI);
  }

  // Claws holding food
  px(ctx, -14, -14, 6, 8, PALETTE.YETI_GRAY);
  px(ctx, 8, -14, 6, 8, PALETTE.YETI_GRAY);

  // Feet
  px(ctx, -8, 4, 6, 8, PALETTE.YETI_GRAY);
  px(ctx, 2, 4, 6, 8, PALETTE.YETI_GRAY);
}

/**
 * Yeti satisfied / picking teeth with a ski pole
 */
function drawYetiSatisfied(ctx: CanvasRenderingContext2D, frame: number) {
  // Belly bulging
  px(ctx, -12, -18, 24, 22, PALETTE.YETI_GRAY);
  px(ctx, -10, -16, 20, 18, PALETTE.YETI_LIGHT);
  px(ctx, -8, -26, 16, 9, PALETTE.YETI_GRAY);

  // Content smirk
  px(ctx, -4, -20, 8, 2, PALETTE.BLACK);
  px(ctx, -5, -23, 2, 2, PALETTE.BLACK);
  px(ctx, 3, -23, 2, 2, PALETTE.BLACK);

  // Left hand patting big belly
  px(ctx, -14, -12, 6, 10, PALETTE.YETI_GRAY);
  px(ctx, -8, -4, 6, 4, PALETTE.YETI_DARK);

  // Right hand holding toothpick / ski pole
  px(ctx, 8, -16, 6, 6, PALETTE.YETI_GRAY);
  px(ctx, 1, -21, 10, 1, PALETTE.BLACK); // Toothpick

  // Sparkle on tooth every few ticks
  if (Math.floor(frame / 6) % 2 === 0) {
    px(ctx, -2, -23, 2, 2, PALETTE.YELLOW_SKI);
    px(ctx, -1, -24, 1, 4, PALETTE.WHITE);
    px(ctx, -3, -22, 4, 1, PALETTE.WHITE);
  }

  // Feet
  px(ctx, -8, 4, 6, 8, PALETTE.YETI_GRAY);
  px(ctx, 2, 4, 6, 8, PALETTE.YETI_GRAY);
}

/**
 * Draw Obstacles (using authentic SkiFree sprites with pixel fallback)
 */
export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obs: { type: ObstacleType; x: number; y: number; width: number; height: number; stance?: string; frame?: number; barkTimer?: number; vx?: number }
) {
  // Try authentic sprite render first
  switch (obs.type) {
    case 'SNOWBOARDER': {
      const isLeft = (obs.vx !== undefined && obs.vx < 0) || obs.stance === 'CARVE_LEFT';
      const isCrashed = obs.stance === 'CRASHED';
      const spriteKey = isCrashed
        ? 'snowboarder_crash'
        : isLeft
        ? 'snowboarder_left'
        : 'snowboarder_right';
      if (spriteStore.draw(ctx, spriteKey, obs.x, obs.y, 1.35, 0.5, 0.9)) {
        return;
      }
      break;
    }

    case 'TREE_SMALL':
      if (spriteStore.draw(ctx, 'tree_small', obs.x, obs.y, 1.35, 0.5, 0.9)) {
        return;
      }
      break;

    case 'TREE_LARGE':
      if (spriteStore.draw(ctx, 'tree_large', obs.x, obs.y, 1.35, 0.5, 0.9)) {
        return;
      }
      break;

    case 'TREE_BARE':
      if (spriteStore.draw(ctx, 'tree_bare', obs.x, obs.y, 1.35, 0.5, 0.9)) {
        return;
      }
      break;

    case 'TREE_STUMP':
      if (spriteStore.draw(ctx, 'stump', obs.x, obs.y, 1.35, 0.5, 0.85)) {
        return;
      }
      break;

    case 'ROCK':
      if (spriteStore.draw(ctx, 'rock', obs.x, obs.y, 1.35, 0.5, 0.85)) {
        return;
      }
      break;

    case 'SNOW_BUMP':
      if (spriteStore.draw(ctx, 'bump_small', obs.x, obs.y, 1.35, 0.5, 0.8)) {
        return;
      }
      break;

    case 'NOVICE_SKIER': {
      const frame = obs.frame || 0;
      const cycle = frame % 60;
      const noviceKey = cycle < 20 ? 'other_skier1' : cycle < 40 ? 'other_skier2' : 'other_skier3';
      if (spriteStore.draw(ctx, noviceKey, obs.x, obs.y, 1.35, 0.5, 0.9)) {
        return;
      }
      break;
    }

    case 'DOG': {
      const isBark = (obs.barkTimer || 0) > 0;
      const frame = obs.frame || 0;
      const dogKey = isBark
        ? (frame % 8 < 4 ? 'dog_woof1' : 'dog_woof2')
        : (frame % 8 < 4 ? 'dog1' : 'dog2');
      if (spriteStore.draw(ctx, dogKey, obs.x, obs.y, 1.35, 0.5, 0.85)) {
        return;
      }
      break;
    }
  }

  // Fallback procedural pixel art
  ctx.save();
  ctx.translate(Math.floor(obs.x), Math.floor(obs.y));
  const s = 1.25;
  ctx.scale(s, s);

  switch (obs.type) {
    case 'TREE_SMALL':
      drawSmallTree(ctx);
      break;

    case 'TREE_LARGE':
      drawLargeTree(ctx);
      break;

    case 'TREE_BARE':
      drawBareTree(ctx);
      break;

    case 'TREE_STUMP':
      drawTreeStump(ctx);
      break;

    case 'ROCK':
      drawRock(ctx);
      break;

    case 'SNOW_BUMP':
      drawSnowBump(ctx);
      break;

    case 'SNOWBOARDER':
      drawSnowboarder(ctx, obs.frame || 0, obs.stance || 'CARVE_RIGHT');
      break;

    case 'NOVICE_SKIER':
      drawNoviceSkier(ctx, obs.frame || 0);
      break;

    case 'DOG':
      drawDog(ctx, obs.frame || 0, obs.barkTimer || 0);
      break;
  }

  ctx.restore();
}

/**
 * Classic SkiFree Small Pine Tree
 */
function drawSmallTree(ctx: CanvasRenderingContext2D) {
  // Brown trunk
  px(ctx, -2, 6, 4, 6, PALETTE.TRUNK);

  // Bottom tier
  px(ctx, -9, 3, 18, 4, PALETTE.PINE_DARK);
  px(ctx, -8, 2, 16, 2, PALETTE.PINE_LIGHT);
  px(ctx, -6, 2, 4, 1, PALETTE.WHITE); // snow patch

  // Middle tier
  px(ctx, -7, -3, 14, 6, PALETTE.PINE_DARK);
  px(ctx, -6, -4, 12, 2, PALETTE.PINE_LIGHT);
  px(ctx, -4, -4, 3, 1, PALETTE.WHITE);

  // Top tier
  px(ctx, -4, -9, 8, 6, PALETTE.PINE_DARK);
  px(ctx, -3, -10, 6, 2, PALETTE.PINE_LIGHT);
  px(ctx, -1, -12, 2, 3, PALETTE.PINE_LIGHT);
  px(ctx, -1, -12, 2, 1, PALETTE.WHITE); // snow on peak
}

/**
 * Classic SkiFree Large Pine Tree
 */
function drawLargeTree(ctx: CanvasRenderingContext2D) {
  // Brown trunk
  px(ctx, -3, 10, 6, 8, PALETTE.TRUNK);

  // Tier 1 (lowest)
  px(ctx, -13, 6, 26, 5, PALETTE.PINE_DARK);
  px(ctx, -11, 4, 22, 3, PALETTE.PINE_LIGHT);
  px(ctx, -9, 4, 6, 1, PALETTE.WHITE);
  px(ctx, 3, 4, 5, 1, PALETTE.WHITE);

  // Tier 2
  px(ctx, -10, -1, 20, 6, PALETTE.PINE_DARK);
  px(ctx, -9, -3, 18, 3, PALETTE.PINE_LIGHT);
  px(ctx, -6, -3, 5, 1, PALETTE.WHITE);

  // Tier 3
  px(ctx, -7, -8, 14, 7, PALETTE.PINE_DARK);
  px(ctx, -6, -10, 12, 3, PALETTE.PINE_LIGHT);
  px(ctx, -3, -10, 4, 1, PALETTE.WHITE);

  // Top spire
  px(ctx, -4, -16, 8, 7, PALETTE.PINE_DARK);
  px(ctx, -2, -18, 4, 3, PALETTE.PINE_LIGHT);
  px(ctx, -1, -20, 2, 3, PALETTE.WHITE);
}

/**
 * Bare / Dead Tree
 */
function drawBareTree(ctx: CanvasRenderingContext2D) {
  // Trunk
  px(ctx, -2, -2, 4, 14, PALETTE.TRUNK);
  // Branches
  px(ctx, -7, -6, 6, 2, PALETTE.TRUNK);
  px(ctx, -9, -10, 3, 4, PALETTE.TRUNK);
  px(ctx, 2, -4, 7, 2, PALETTE.TRUNK);
  px(ctx, 8, -8, 2, 4, PALETTE.TRUNK);
  px(ctx, -4, -12, 3, 6, PALETTE.TRUNK);
  px(ctx, 1, -12, 3, 6, PALETTE.TRUNK);
}

/**
 * Tree Stump
 */
function drawTreeStump(ctx: CanvasRenderingContext2D) {
  px(ctx, -5, 0, 10, 6, PALETTE.TRUNK);
  px(ctx, -4, -2, 8, 3, '#986030'); // top wood
  px(ctx, -3, -1, 6, 1, PALETTE.WHITE); // snow dusting
}

/**
 * Rock / Boulder
 */
function drawRock(ctx: CanvasRenderingContext2D) {
  // Gray rock body
  px(ctx, -8, -1, 16, 8, '#707078');
  px(ctx, -6, -4, 12, 4, '#888890');
  // Snow cap
  px(ctx, -5, -6, 10, 3, PALETTE.WHITE);
  px(ctx, -6, -4, 3, 1, PALETTE.WHITE);
  px(ctx, 3, -4, 2, 1, PALETTE.WHITE);
}

/**
 * Snow Bump / Mogul
 */
function drawSnowBump(ctx: CanvasRenderingContext2D) {
  // Mound outline
  px(ctx, -10, 2, 20, 2, PALETTE.SNOW_CONTOUR);
  px(ctx, -8, 0, 16, 2, PALETTE.SNOW_SHADOW);
  px(ctx, -6, -2, 12, 2, PALETTE.WHITE);
  px(ctx, -3, -3, 6, 1, PALETTE.WHITE);
}

/**
 * NPC Snowboarder (Purple cap, green jacket, blue board)
 */
function drawSnowboarder(ctx: CanvasRenderingContext2D, frame: number, stance: string) {
  const isRight = stance.includes('RIGHT');
  ctx.scale(isRight ? 1 : -1, 1);

  // Blue snowboard
  px(ctx, -11, 6, 22, 3, PALETTE.BOARDER_BOARD);
  px(ctx, -13, 5, 3, 2, PALETTE.WHITE); // tip
  px(ctx, 10, 5, 3, 2, PALETTE.WHITE);

  // Green jacket & pants
  px(ctx, -4, 0, 8, 6, PALETTE.BOARDER_GREEN);
  px(ctx, -3, -6, 7, 7, PALETTE.BOARDER_GREEN);

  // Arms out for balance
  px(ctx, -8, -5, 4, 3, PALETTE.BOARDER_GREEN);
  px(ctx, 4, -5, 4, 3, PALETTE.BOARDER_GREEN);

  // Head & purple beanie
  px(ctx, -1, -9, 4, 3, PALETTE.SKIN);
  px(ctx, -3, -12, 7, 4, PALETTE.PURPLE);
  px(ctx, -4, -10, 2, 2, PALETTE.PURPLE);
}

/**
 * Novice / Beginner Skier (Pink suit, cyan pants)
 */
function drawNoviceSkier(ctx: CanvasRenderingContext2D, frame: number) {
  // Skis in pizza / wedge stance!
  px(ctx, -7, 4, 6, 2, PALETTE.YELLOW_SKI);
  px(ctx, 1, 4, 6, 2, PALETTE.YELLOW_SKI);

  // Cyan pants
  px(ctx, -4, -1, 8, 5, PALETTE.NOVICE_CYAN);

  // Pink coat
  px(ctx, -5, -7, 10, 6, PALETTE.NOVICE_PINK);

  // Head
  px(ctx, -2, -10, 4, 3, PALETTE.SKIN);
  px(ctx, -3, -13, 6, 3, PALETTE.NOVICE_PINK);

  // Poles
  px(ctx, -7, -4, 1, 9, PALETTE.BLACK);
  px(ctx, 6, -4, 1, 9, PALETTE.BLACK);
}

/**
 * Dog (running across slope, barking "WOOF!")
 */
function drawDog(ctx: CanvasRenderingContext2D, frame: number, barkTimer: number) {
  const legOffset = (frame % 2) === 0 ? 1 : -1;

  // Brown body
  px(ctx, -6, -2, 10, 5, PALETTE.DOG_BROWN);

  // Head
  px(ctx, 3, -6, 5, 5, PALETTE.DOG_BROWN);
  px(ctx, 6, -5, 2, 2, PALETTE.DOG_DARK); // snout
  px(ctx, 2, -7, 3, 2, PALETTE.DOG_DARK); // ears

  // Red collar
  px(ctx, 3, -2, 1, 3, PALETTE.RED);

  // Legs running
  px(ctx, -5, 3, 2, 3 + legOffset, PALETTE.DOG_DARK);
  px(ctx, -2, 3, 2, 3 - legOffset, PALETTE.DOG_DARK);
  px(ctx, 2, 3, 2, 3 + legOffset, PALETTE.DOG_DARK);

  // Tail wagging
  px(ctx, -8, -4, 2, 3, PALETTE.DOG_BROWN);

  // Barking speech bubble
  if (barkTimer > 0) {
    ctx.fillStyle = PALETTE.WHITE;
    ctx.fillRect(8, -16, 28, 9);
    ctx.strokeStyle = PALETTE.BLACK;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, -16, 28, 9);

    ctx.fillStyle = PALETTE.BLACK;
    ctx.font = 'bold 6px monospace';
    ctx.fillText('WOOF!', 10, -9);
  }
}
