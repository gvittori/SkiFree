/**
 * SkiFree Retro - Type Definitions
 */

export type SkierStance =
  | 'STAND_LEFT'
  | 'STAND_RIGHT'
  | 'SKI_LEFT'
  | 'SKI_RIGHT'
  | 'SKI_FAST_LEFT'
  | 'SKI_FAST_RIGHT'
  | 'SKI_DOWN'
  | 'SKI_DOWN_FAST'
  | 'JUMP_NORMAL'
  | 'JUMP_SPREAD'
  | 'JUMP_FLIP'
  | 'JUMP_DAFFY'
  | 'JUMP_IRON_CROSS'
  | 'CRASH'
  | 'EATEN';

export type TrickType =
  | 'SPREAD_EAGLE'
  | 'BACKFLIP'
  | 'DAFFY'
  | 'IRON_CROSS'
  | 'TWISTER'
  | 'SPIN_360';

export interface TrickDef {
  type: TrickType;
  name: string;
  points: number;
  stance: SkierStance;
}

export type ObstacleType =
  | 'TREE_SMALL'
  | 'TREE_LARGE'
  | 'TREE_BARE'
  | 'TREE_STUMP'
  | 'ROCK'
  | 'SNOW_BUMP'
  | 'SNOWBOARDER'
  | 'NOVICE_SKIER'
  | 'DOG';

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  // Dynamic NPC properties
  vx?: number;
  vy?: number;
  stance?: string;
  frame?: number;
  stateTimer?: number;
  barkTimer?: number;
  isAirborne?: boolean;
}

export type YetiState =
  | 'SLEEPING'
  | 'SPAWNING'
  | 'CHASING'
  | 'POUNCING'
  | 'GRABBING'
  | 'EATING'
  | 'CHEWING'
  | 'SATISFIED'
  | 'STUNNED';

export interface Yeti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: YetiState;
  frame: number;
  stateTimer: number;
  eatStep: number;
  active: boolean;
}

export interface SkiTrack {
  x: number;
  y: number;
  angle: number;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape?: 'pixel' | 'star' | 'circle';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  distance: number;
  tricksCount: number;
  maxSpeed: number;
  date: string;
}

export interface SkierPalette {
  id: string;
  name: string;
  hatColor: string;
  sweaterColor: string;
  pantsColor: string;
}

export interface GameState {
  // Skier
  skierX: number;
  skierY: number;
  skierZ: number; // Jump height (0 = ground)
  vz: number; // Vertical jump velocity
  stance: SkierStance;
  directionX: number; // -1 (left) to 1 (right)
  preJumpStance?: SkierStance;
  preJumpDirectionX?: number;
  speed: number;
  baseSpeed: number;
  
  // Game lifecycle
  isRunning: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isAirborne: boolean;
  isImmune: boolean;
  immunityTimer: number; // in milliseconds (2000 ms = 2 sec)
  crashTimer: number;
  
  // Stats
  distance: number; // in meters
  score: number;
  trickPoints: number;
  tricksLanded: number;
  maxSpeedAchieved: number;
  currentTrick: TrickDef | null;
  trickSuccess: boolean;
  
  // Entities
  yeti: Yeti;
  obstacles: Obstacle[];
  tracks: SkiTrack[];
  particles: Particle[];
  floatingTexts: FloatingText[];
}
