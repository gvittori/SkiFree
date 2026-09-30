/**
 * SkiFree Retro - Game Engine
 * Handles physics, procedural slope generation, collision detection,
 * tricks, Yeti AI, speed scaling, and animation loops.
 */

import {
  GameState,
  SkierStance,
  Obstacle,
  ObstacleType,
  TrickDef,
  SkiTrack,
  Particle,
  FloatingText,
} from '../types';
import { sound } from './audio';

export const TRICK_LIST: TrickDef[] = [
  { type: 'SPREAD_EAGLE', name: 'SPREAD EAGLE', points: 150, stance: 'JUMP_SPREAD' },
  { type: 'DAFFY', name: 'DAFFY', points: 200, stance: 'JUMP_DAFFY' },
  { type: 'IRON_CROSS', name: 'IRON CROSS', points: 250, stance: 'JUMP_IRON_CROSS' },
  { type: 'BACKFLIP', name: 'BACKFLIP', points: 350, stance: 'JUMP_FLIP' },
];

export class GameEngine {
  public state: GameState;
  private canvasWidth: number = 400;
  private canvasHeight: number = 700;
  private nextObstacleId: number = 1;
  private nextTextId: number = 1;
  private lastObstacleSpawnY: number = 0;
  private animTick: number = 0;
  private jumpCooldownTimer: number = 0;
  private turnCooldownTimer: number = 0;
  private onGameOverCallback?: (finalScore: number, distance: number, maxSpeed: number, tricks: number) => void;

  constructor(canvasWidth: number = 400, canvasHeight: number = 700) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.state = this.createInitialState();
    this.seedInitialObstacles();
  }

  public setGameOverCallback(cb: (finalScore: number, distance: number, maxSpeed: number, tricks: number) => void) {
    this.onGameOverCallback = cb;
  }

  public updateDimensions(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public createInitialState(): GameState {
    const prevBloodAmount = this.state?.bloodAmount ?? 5;
    return {
      skierX: 0,
      skierY: 100,
      skierZ: 0,
      vz: 0,
      stance: 'SKI_DOWN',
      directionX: 0,
      targetDirectionX: 0,
      speed: 0,
      baseSpeed: 4.5,
      isSprinting: false,

      isRunning: false,
      isPaused: false,
      isGameOver: false,
      isAirborne: false,
      isImmune: false,
      immunityTimer: 0,
      crashTimer: 0,

      distance: 0,
      score: 0,
      trickPoints: 0,
      tricksLanded: 0,
      maxSpeedAchieved: 0,
      currentTrick: null,
      trickSuccess: false,

      yeti: {
        x: 0,
        y: -300,
        vx: 0,
        vy: 0,
        state: 'SLEEPING',
        frame: 0,
        stateTimer: 0,
        eatStep: 0,
        active: false,
      },
      obstacles: [],
      tracks: [],
      bloodStains: [],
      particles: [],
      floatingTexts: [],
      bloodAmount: prevBloodAmount,
    };
  }

  public setBloodAmount(amount: number) {
    const clamped = Math.max(1, Math.min(10, Math.round(amount)));
    this.state.bloodAmount = clamped;
  }

  public getBloodAmount(): number {
    return this.state.bloodAmount;
  }

  public reset(autoStart: boolean = false) {
    this.state = this.createInitialState();
    this.jumpCooldownTimer = 0;
    this.turnCooldownTimer = 0;
    this.seedInitialObstacles();
    if (autoStart) {
      this.start();
    }
  }

  public toggleSprint(): boolean {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.stance === 'CRASH') {
      return false;
    }
    this.state.isSprinting = !this.state.isSprinting;
    sound.playSprint(this.state.isSprinting);
    if (this.state.isSprinting) {
      this.addFloatingText('⚡ SPRINT 150 km/h!', '#FFD700');
    }
    return this.state.isSprinting;
  }

  public setSprint(active: boolean) {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.stance === 'CRASH') {
      return;
    }
    if (this.state.isSprinting !== active) {
      this.state.isSprinting = active;
      sound.playSprint(active);
      if (active) {
        this.addFloatingText('⚡ SPRINT 150 km/h!', '#FFD700');
      }
    }
  }

  public start() {
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.speed = this.state.baseSpeed;
  }

  public stop() {
    this.state.isRunning = false;
    this.state.speed = 0;
  }

  private seedInitialObstacles() {
    this.state.obstacles = [];
    // Spawn initial obstacles down the slope with wider spacing
    for (let y = 300; y < 1500; y += 110) {
      this.spawnObstacleRow(y, 0);
    }
    this.lastObstacleSpawnY = 1500;
  }

  private spawnObstacleRow(y: number, centerX: number = this.state.skierX) {
    const spreadX = Math.max(650, this.canvasWidth * 1.5); // mountain width corridor centered on skier
    const count = 1 + Math.floor(Math.random() * 2); // 1 or 2 items per row

    for (let i = 0; i < count; i++) {
      // Pick random X position relative to current skier horizontal position
      const x = centerX + (Math.random() - 0.5) * spreadX * 2;

      // Prevent trees/obstacles from clustering or spawning right on top of each other
      const tooClose = this.state.obstacles.some(
        obs => Math.hypot(obs.x - x, obs.y - y) < 85
      );
      if (tooClose) continue;

      const rand = Math.random();

      let type: ObstacleType = 'TREE_SMALL';
      let w = 24;
      let h = 28;

      if (rand < 0.32) {
        type = 'TREE_SMALL';
        w = 26;
        h = 30;
      } else if (rand < 0.55) {
        type = 'TREE_LARGE';
        w = 34;
        h = 42;
      } else if (rand < 0.72) {
        type = 'SNOW_BUMP'; // Mogul/snow bump
        w = 32;
        h = 14;
      } else if (rand < 0.83) {
        type = 'ROCK';
        w = 26;
        h = 18;
      } else if (rand < 0.89) {
        type = 'TREE_BARE';
        w = 28;
        h = 32;
      } else if (rand < 0.94) {
        type = 'SNOWBOARDER'; // NPC Snowboarder
        w = 26;
        h = 30;
      } else if (rand < 0.97) {
        type = 'NOVICE_SKIER'; // NPC Beginner
        w = 24;
        h = 28;
      } else {
        type = 'DOG';
        w = 22;
        h = 16;
      }

      this.state.obstacles.push({
        id: this.nextObstacleId++,
        x,
        y,
        width: w,
        height: h,
        type,
        vx: type === 'SNOWBOARDER' ? (Math.random() > 0.5 ? 1.5 : -1.5) : type === 'DOG' ? 1.2 : 0,
        vy: type === 'SNOWBOARDER' ? 3.0 : type === 'NOVICE_SKIER' ? 2.0 : 0,
        stance: type === 'SNOWBOARDER' ? 'CARVE_RIGHT' : undefined,
        frame: 0,
        stateTimer: Math.random() * 100,
        barkTimer: 0,
      });
    }
  }

  /**
   * Steer left command - responsive discrete control
   */
  public steerLeft() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.stance === 'CRASH') return;

    if (this.state.isAirborne) {
      // Direct air drift
      this.state.skierX -= 15;
      return;
    }

    // Steering is slightly slower while sprint is active
    if (this.state.isSprinting && this.turnCooldownTimer > 0) {
      return;
    }
    if (this.state.isSprinting) {
      this.turnCooldownTimer = 140; // 140ms steering cooldown while sprinting
    }

    // When angled all the way left (STAND_LEFT), tapping left slightly moves him in that direction
    if (this.state.stance === 'STAND_LEFT') {
      this.state.skierX -= 14;
      this.state.directionX = -1.35;
      this.state.speed = 0;
      sound.playShuffle();
      this.addCarveParticles(-1);
      this.checkCollisions();
      return;
    }

    // Direct, responsive step turning
    switch (this.state.stance) {
      case 'STAND_RIGHT':
        // Turn back towards downhill
        this.state.stance = 'SKI_FAST_RIGHT';
        this.state.directionX = 1.1;
        break;
      case 'SKI_FAST_RIGHT':
        this.state.stance = 'SKI_RIGHT';
        this.state.directionX = 0.55;
        break;
      case 'SKI_RIGHT':
        this.state.stance = 'SKI_DOWN';
        this.state.directionX = 0;
        break;
      case 'SKI_DOWN':
      case 'SKI_DOWN_FAST':
        this.state.stance = 'SKI_LEFT';
        this.state.directionX = -0.7;
        break;
      case 'SKI_LEFT':
        this.state.stance = 'SKI_FAST_LEFT';
        this.state.directionX = -1.1;
        break;
      case 'SKI_FAST_LEFT':
        // Angled all the way left: stop moving at all!
        this.state.stance = 'STAND_LEFT';
        this.state.directionX = -1.35;
        this.state.speed = 0;
        break;
      default:
        this.state.stance = 'SKI_LEFT';
        this.state.directionX = -0.7;
    }
    this.state.targetDirectionX = this.state.directionX;
    this.addCarveParticles(-1);
  }

  /**
   * Steer right command - responsive discrete control
   */
  public steerRight() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.stance === 'CRASH') return;

    if (this.state.isAirborne) {
      // Direct air drift
      this.state.skierX += 15;
      return;
    }

    // Steering is slightly slower while sprint is active
    if (this.state.isSprinting && this.turnCooldownTimer > 0) {
      return;
    }
    if (this.state.isSprinting) {
      this.turnCooldownTimer = 140; // 140ms steering cooldown while sprinting
    }

    // When angled all the way right (STAND_RIGHT), tapping right slightly moves him in that direction
    if (this.state.stance === 'STAND_RIGHT') {
      this.state.skierX += 14;
      this.state.directionX = 1.35;
      this.state.speed = 0;
      sound.playShuffle();
      this.addCarveParticles(1);
      this.checkCollisions();
      return;
    }

    // Direct, responsive step turning
    switch (this.state.stance) {
      case 'STAND_LEFT':
        // Turn back towards downhill
        this.state.stance = 'SKI_FAST_LEFT';
        this.state.directionX = -1.1;
        break;
      case 'SKI_FAST_LEFT':
        this.state.stance = 'SKI_LEFT';
        this.state.directionX = -0.7;
        break;
      case 'SKI_LEFT':
        this.state.stance = 'SKI_DOWN';
        this.state.directionX = 0;
        break;
      case 'SKI_DOWN':
      case 'SKI_DOWN_FAST':
        this.state.stance = 'SKI_RIGHT';
        this.state.directionX = 0.7;
        break;
      case 'SKI_RIGHT':
        this.state.stance = 'SKI_FAST_RIGHT';
        this.state.directionX = 1.1;
        break;
      case 'SKI_FAST_RIGHT':
        // Angled all the way right: stop moving at all!
        this.state.stance = 'STAND_RIGHT';
        this.state.directionX = 1.35;
        this.state.speed = 0;
        break;
      default:
        this.state.stance = 'SKI_RIGHT';
        this.state.directionX = 0.7;
    }
    this.state.targetDirectionX = this.state.directionX;
    this.addCarveParticles(1);
  }

  /**
   * Straight downhill tuck / speed boost
   */
  public steerDown() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.stance === 'CRASH') return;
    if (this.state.isAirborne) return;

    this.state.directionX = 0;
    this.state.targetDirectionX = 0;
    this.state.stance = 'SKI_DOWN_FAST';
  }

  /**
   * Recover from crash and get back on skis (triggered by tapping Jump/Trick button)
   * The skier only stands back up and does NOT jump.
   */
  public recoverFromCrash() {
    if (this.state.stance !== 'CRASH') return;

    this.state.stance = 'SKI_DOWN';
    this.state.directionX = 0;
    this.state.targetDirectionX = 0;
    this.state.speed = this.state.baseSpeed;
    this.state.crashTimer = 0;
    this.state.isAirborne = false;
    this.state.skierZ = 0;
    this.state.vz = 0;
    // Set 500ms cooldown so the get up action never jumps
    this.jumpCooldownTimer = 500;

    // Activate 2-second immunity frame (2000 ms) so skier doesn't immediately re-crash
    this.state.isImmune = true;
    this.state.immunityTimer = 2000;

    sound.playStandUp();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Snow puff particles on getting back up
    for (let i = 0; i < 12; i++) {
      this.state.particles.push({
        x: this.state.skierX + (Math.random() - 0.5) * 16,
        y: this.state.skierY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2.5,
        color: '#FFFFFF',
        size: 3,
        life: 0,
        maxLife: 15,
        shape: 'pixel',
      });
    }
  }

  /**
   * Jump or Trick Action
   * (Bottom center button or Space/Up Arrow)
   */
  public actionJumpOrTrick() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;

    // When down the skier should only get up after tapping the jump/trick button
    if (this.state.stance === 'CRASH') {
      this.recoverFromCrash();
      return;
    }

    // Do not jump if in crash cooldown or immediately after recovering from a crash
    if (this.state.crashTimer > 0 || this.jumpCooldownTimer > 0) return;

    if (!this.state.isAirborne) {
      // Launch jump from ground!
      this.state.preJumpStance = this.state.stance;
      this.state.preJumpDirectionX = this.state.directionX;
      this.state.isAirborne = true;
      this.state.vz = 10.5; // Tuned for gentler launch and slower descent
      this.state.skierZ = 2;
      this.state.stance = 'JUMP_NORMAL';
      this.state.currentTrick = null;
      this.state.trickSuccess = false;
      sound.playJump();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    } else {
      // Cycle through tricks while in air!
      this.cycleNextTrick();
    }
  }

  /**
   * Throw a snowball to stun the Yeti!
   */
  public throwSnowball() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;
    const yeti = this.state.yeti;
    if (yeti.active && yeti.state === 'CHASING') {
      const dist = Math.hypot(yeti.x - this.state.skierX, yeti.y - this.state.skierY);
      if (dist < 450) {
        yeti.state = 'STUNNED';
        yeti.stateTimer = 0;
        sound.playJump();
        this.addFloatingText('❄️ SNOWBALL HIT! YETI STUNNED!', '#00BFFF');
        this.state.score += 250;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([60, 40, 60]);
        }
      } else {
        this.addFloatingText('TOO FAR!', '#AAAAAA');
      }
    } else {
      this.addFloatingText('NO YETI IN SIGHT!', '#AAAAAA');
    }
  }

  private cycleNextTrick() {
    const currentIndex = TRICK_LIST.findIndex(t => t.type === this.state.currentTrick?.type);
    const nextIndex = (currentIndex + 1) % TRICK_LIST.length;
    const trick = TRICK_LIST[nextIndex];

    this.state.currentTrick = trick;
    this.state.stance = trick.stance;
    sound.playTrick();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }

    // Award immediate trick points
    this.state.trickPoints += trick.points;
    this.state.score += trick.points;
    this.state.tricksLanded++;
    this.state.trickSuccess = true;

    // Show floating trick text
    this.addFloatingText(`+${trick.points} ${trick.name}!`, '#FFD700');
  }

  private addFloatingText(text: string, color: string) {
    this.state.floatingTexts.push({
      id: this.nextTextId++,
      x: this.state.skierX,
      y: this.state.skierY - this.state.skierZ - 20,
      text,
      color,
      life: 0,
      maxLife: 45,
    });
  }

  private addCarveParticles(dir: number) {
    for (let i = 0; i < 4; i++) {
      this.state.particles.push({
        x: this.state.skierX + (dir > 0 ? -12 : 12),
        y: this.state.skierY + 10,
        vx: (Math.random() - 0.5) * 2 - dir * 1.5,
        vy: -Math.random() * 2 - 1,
        color: '#FFFFFF',
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: 15,
        shape: 'pixel',
      });
    }
  }

  private addCrashParticles() {
    // Red cap particle
    this.state.particles.push({
      x: this.state.skierX,
      y: this.state.skierY,
      vx: -2.5,
      vy: -4,
      color: '#E01820',
      size: 6,
      life: 0,
      maxLife: 35,
      shape: 'pixel',
    });

    // Yellow ski 1
    this.state.particles.push({
      x: this.state.skierX + 5,
      y: this.state.skierY,
      vx: 3,
      vy: -5,
      color: '#F8D800',
      size: 5,
      life: 0,
      maxLife: 35,
      shape: 'pixel',
    });

    // Yellow ski 2
    this.state.particles.push({
      x: this.state.skierX - 5,
      y: this.state.skierY,
      vx: 1.5,
      vy: -6,
      color: '#F8D800',
      size: 5,
      life: 0,
      maxLife: 35,
      shape: 'pixel',
    });

    // Impact stars
    for (let i = 0; i < 6; i++) {
      this.state.particles.push({
        x: this.state.skierX + (Math.random() - 0.5) * 20,
        y: this.state.skierY - 10 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: '#FFD700',
        size: 4,
        life: 0,
        maxLife: 25,
        shape: 'star',
      });
    }
  }

  /**
   * Spawn visceral retro blood particles and snow splatters
   */
  public spawnBloodParticles(x: number, y: number, context: 'tree' | 'yeti_grab' | 'yeti_bite' | 'preview') {
    // Blood particle generation only triggers when skier is not down and also not in immune frames
    if (context === 'tree') {
      const isDown = this.state.stance === 'CRASH';
      const isImmune = this.state.isImmune || this.state.immunityTimer > 0;
      if (isDown || isImmune) {
        return;
      }
    }

    const bloodAmount = this.state.bloodAmount || 5;

    // Scale particle count dynamically from 1 to 10 (tripled: 3x volume for all levels)
    let count = 0;
    if (context === 'tree') {
      count = Math.round((8 + bloodAmount * 7) * 3); // 45 to 234 particles
    } else if (context === 'yeti_grab') {
      count = Math.round((6 + bloodAmount * 6) * 3); // 36 to 198 particles
    } else if (context === 'yeti_bite') {
      count = Math.round((14 + bloodAmount * 9) * 3); // 69 to 312 particles
    } else {
      count = Math.round((10 + bloodAmount * 7) * 3); // 51 to 240 particles
    }

    // Increasing the blood volume also increases particle size slightly
    const sizeBonus = Math.floor(bloodAmount * 0.45); // +0 at lvl 1 up to +4 at lvl 10

    const bloodPalette = [
      '#8B0000', // Deep arterial red
      '#B22222', // Firebrick red
      '#DC143C', // Crimson
      '#E01820', // Retro SkiFree red
      '#FF0033', // Vivid arterial spray
      '#580000', // Dark blood clot
      '#990000', // Pure crimson
    ];

    sound.playSplat();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (3.0 + bloodAmount * 0.45) + 1.2;
      const vx = Math.cos(angle) * speed;
      // Upward explosive fountain bias
      const vy = Math.sin(angle) * speed - (Math.random() * (2.6 + bloodAmount * 0.38) + 1.5);
      const color = bloodPalette[Math.floor(Math.random() * bloodPalette.length)];
      const baseSize = Math.random() < 0.3 ? 2 : Math.random() < 0.65 ? 3 : Math.random() < 0.85 ? 4 : Math.random() < 0.95 ? 5 : 6;
      const size = baseSize + sizeBonus;
      const maxLife = Math.floor(Math.random() * 28 + 25);

      this.state.particles.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 18,
        vx,
        vy,
        color,
        size,
        life: 0,
        maxLife,
        shape: 'blood_drop',
        gravity: 0.22,
        isBlood: true,
      });
    }

    // Paint immediate visceral splatter pools on the snow slope around the impact
    const stainCount = Math.min(36, Math.round(bloodAmount * 3.2));
    for (let i = 0; i < stainCount; i++) {
      const maxLife = 2000 + Math.random() * 500; // ~2.0 - 2.5s total lifetime before fading away
      this.state.bloodStains.push({
        x: x + (Math.random() - 0.5) * (36 + bloodAmount * 4),
        y: y + (Math.random() - 0.5) * (26 + bloodAmount * 3),
        size: Math.floor(Math.random() * 3 + 2) + Math.floor(sizeBonus * 0.6),
        color: bloodPalette[Math.floor(Math.random() * bloodPalette.length)],
        opacity: 0.95,
        life: 0,
        maxLife,
      });
    }
  }

  /**
   * Trigger crash with 2-second immunity frame (no message just blinking)
   * Spawns blood particles if colliding with a tree!
   */
  public triggerCrash(obsType?: ObstacleType) {
    if (
      !this.state.isRunning ||
      this.state.isPaused ||
      this.state.isGameOver ||
      this.state.isImmune ||
      this.state.immunityTimer > 0 ||
      this.state.stance === 'CRASH' ||
      this.state.crashTimer > 0
    ) {
      return;
    }

    // Check if player collided with a tree (small, large, bare, stump)
    const isTree = obsType && (
      obsType.includes('TREE') ||
      obsType.startsWith('TREE_')
    );

    // Spawn blood particles while skier is still upright (not down and not immune)
    if (isTree) {
      this.spawnBloodParticles(this.state.skierX, this.state.skierY, 'tree');
    }

    this.state.stance = 'CRASH';
    this.state.isSprinting = false;
    this.state.crashTimer = 10; // Brief cooldown before input registers
    this.state.isAirborne = false;
    this.state.skierZ = 0;
    this.state.vz = 0;
    this.state.directionX = 0;
    this.state.speed = 0;

    sound.playCrash();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
    this.addCrashParticles();
  }

  /**
   * Main Game Loop Update
   * @param dt Delta time in milliseconds
   */
  public update(dt: number = 16) {
    if (!this.state.isRunning) return;
    if (this.state.isPaused) {
      this.updateEffects(dt);
      return;
    }

    this.animTick++;

    // 1. Crash recovery timer & Immunity timer handling
    // When down the skier stays down and only gets up after player taps the jump/trick button
    if (this.state.crashTimer > 0) {
      this.state.crashTimer--;
    }

    if (this.jumpCooldownTimer > 0) {
      this.jumpCooldownTimer -= dt;
      if (this.jumpCooldownTimer < 0) {
        this.jumpCooldownTimer = 0;
      }
    }

    if (this.turnCooldownTimer > 0) {
      this.turnCooldownTimer -= dt;
      if (this.turnCooldownTimer < 0) {
        this.turnCooldownTimer = 0;
      }
    }

    if (this.state.isImmune) {
      this.state.immunityTimer -= dt;
      if (this.state.immunityTimer <= 0) {
        this.state.isImmune = false;
        this.state.immunityTimer = 0;
      }
    }

    // 2. Gameplay speed calculations
    // - Skier normal max speed is capped at 77 km/h (9.625 physics units).
    // - Sprint button toggle sets skier speed to 150 km/h (18.75 physics units).
    const NORMAL_MAX_SPEED_PHYSICS = 77 / 8; // 9.625 (9.625 * 8 = 77 km/h)
    const SPRINT_SPEED_PHYSICS = 150 / 8; // 18.75 (18.75 * 8 = 150 km/h)

    // Stance speed multiplier
    let stanceMultiplier = 1.0;
    switch (this.state.stance) {
      case 'STAND_LEFT':
      case 'STAND_RIGHT':
        // When angled all the way left or right, stop moving at all
        stanceMultiplier = 0;
        break;
      case 'SKI_LEFT':
      case 'SKI_RIGHT':
        stanceMultiplier = 0.92;
        break;
      case 'SKI_FAST_LEFT':
      case 'SKI_FAST_RIGHT':
        stanceMultiplier = 0.78;
        break;
      case 'SKI_DOWN':
        stanceMultiplier = 1.25;
        break;
      case 'SKI_DOWN_FAST':
        stanceMultiplier = 1.55;
        break;
      case 'CRASH':
      case 'EATEN':
        stanceMultiplier = 0;
        break;
      default:
        stanceMultiplier = 1.0;
    }

    if (stanceMultiplier === 0) {
      this.state.speed = 0;
    } else if (this.state.isSprinting) {
      // Sprint toggle sets skier speed to 150 km/h
      this.state.speed = SPRINT_SPEED_PHYSICS;
    } else {
      // Normal downhill speed: accelerates with distance, capped at 77 km/h normal max speed
      const distanceKm = this.state.distance / 1000;
      this.state.baseSpeed = 5.0 + Math.min(3.5, distanceKm * 2.5);
      const rawSpeed = this.state.baseSpeed * stanceMultiplier;
      this.state.speed = Math.min(NORMAL_MAX_SPEED_PHYSICS, rawSpeed);
    }

    // Convert to realistic km/h for the HUD
    const speedKmH = Math.round(this.state.speed * 8);
    if (speedKmH > this.state.maxSpeedAchieved) {
      this.state.maxSpeedAchieved = speedKmH;
    }

    // 3. Movement
    const isStopped =
      this.state.stance === 'STAND_LEFT' ||
      this.state.stance === 'STAND_RIGHT' ||
      this.state.stance === 'CRASH';

    if (!this.state.isGameOver && !isStopped && this.state.speed > 0) {
      // Downhill displacement
      const dy = this.state.speed;
      this.state.skierY += dy;
      this.state.distance += Math.round(dy * 0.4);
      this.state.score += Math.round(dy * 0.4);

      // Horizontal displacement
      // When sprinting at 150 km/h, lateral steering is slightly slower with heavier forward inertia
      const lateralDamp = this.state.isSprinting ? 0.45 : 0.85;
      this.state.skierX += this.state.directionX * (this.state.speed * lateralDamp);

      // High-speed sprint snow spray particles
      if (this.state.isSprinting && !this.state.isAirborne && this.animTick % 2 === 0) {
        this.state.particles.push({
          x: this.state.skierX + (Math.random() - 0.5) * 12,
          y: this.state.skierY + 6,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3 - 1,
          color: '#FFFFFF',
          size: 2,
          life: 0,
          maxLife: 8,
          shape: 'pixel',
        });
      }

      // Leave ski tracks
      if (!this.state.isAirborne && this.animTick % 3 === 0) {
        this.state.tracks.push({
          x: this.state.skierX,
          y: this.state.skierY,
          angle: this.state.directionX * 0.3,
          opacity: 0.6,
        });
        if (this.state.tracks.length > 250) {
          this.state.tracks.shift();
        }
      }
    }

    // 4. Airborne jump physics (slower, floatier descent)
    if (this.state.isAirborne) {
      this.state.skierZ += this.state.vz;
      this.state.vz -= 0.48; // Gravity reduced from 0.85 so skier falls slower

      if (this.state.skierZ <= 0) {
        // Landing!
        this.state.skierZ = 0;
        this.state.vz = 0;
        this.state.isAirborne = false;

        // Check clean landing vs crash
        if (this.state.stance === 'JUMP_FLIP') {
          // Landed on head!
          this.triggerCrash();
        } else {
          // Safe landing! Preserve previous angle and stance!
          const prevStance = this.state.preJumpStance;
          if (prevStance && !prevStance.startsWith('JUMP_') && prevStance !== 'CRASH') {
            this.state.stance = prevStance;
          } else {
            this.state.stance = 'SKI_DOWN';
          }
          if (this.state.preJumpDirectionX !== undefined) {
            this.state.directionX = this.state.preJumpDirectionX;
          }
          this.state.currentTrick = null;
          // Snow landing puff
          for (let i = 0; i < 8; i++) {
            this.state.particles.push({
              x: this.state.skierX + (Math.random() - 0.5) * 16,
              y: this.state.skierY,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 2,
              color: '#FFFFFF',
              size: 3,
              life: 0,
              maxLife: 15,
              shape: 'pixel',
            });
          }
        }
      }
    }

    // 5. Procedural Mountain Spawning & Culling (spread out trees)
    if (this.state.skierY + 800 > this.lastObstacleSpawnY) {
      this.spawnObstacleRow(this.lastObstacleSpawnY + 110);
      this.lastObstacleSpawnY += 110;
    }

    // Cull obstacles that are far behind or far to the side of the skier
    this.state.obstacles = this.state.obstacles.filter(
      obs => obs.y > this.state.skierY - 450 &&
             obs.y < this.state.skierY + 1400 &&
             Math.abs(obs.x - this.state.skierX) < 2500
    );

    // 6. Update NPCs (Snowboarders, Novice skiers, Dogs)
    this.updateNPCs();

    // 7. Collision Detection with Obstacles
    this.checkCollisions();

    // 8. The Yeti Logic (Abominable Snow Monster)
    this.updateYeti(dt);

    // 9. Update Particles & Floating texts
    this.updateEffects(dt);
  }

  private updateNPCs() {
    this.state.obstacles.forEach(obs => {
      obs.frame = (obs.frame || 0) + 1;

      if (obs.type === 'SNOWBOARDER') {
        obs.y += obs.vy || 3.0;
        obs.x += obs.vx || 1.2;

        // Periodic carving switch relative to skier view corridor
        if (obs.x > this.state.skierX + 360) obs.vx = -Math.abs(obs.vx || 1.5);
        if (obs.x < this.state.skierX - 360) obs.vx = Math.abs(obs.vx || 1.5);

        if (Math.random() < 0.02) {
          obs.vx = (obs.vx || 1.5) * -1;
          obs.stance = (obs.vx || 1) > 0 ? 'CARVE_RIGHT' : 'CARVE_LEFT';
        }
      } else if (obs.type === 'NOVICE_SKIER') {
        obs.y += obs.vy || 2.0;
        obs.x += Math.sin((obs.frame || 0) * 0.05) * 1.0;
      } else if (obs.type === 'DOG') {
        obs.x += obs.vx || 1.2;
        if (obs.x > this.state.skierX + 360) obs.vx = -1.2;
        if (obs.x < this.state.skierX - 360) obs.vx = 1.2;

        // Dog barking near skier
        const distToSkier = Math.hypot(obs.x - this.state.skierX, obs.y - this.state.skierY);
        if (distToSkier < 140 && Math.random() < 0.03 && (obs.barkTimer || 0) <= 0) {
          obs.barkTimer = 40;
          sound.playWoof();
        }
        if ((obs.barkTimer || 0) > 0) {
          obs.barkTimer = (obs.barkTimer || 0) - 1;
        }
      }
    });
  }

  private checkCollisions() {
    // If airborne, only collide if low height
    if (this.state.isAirborne && this.state.skierZ > 16) {
      return;
    }
    if (
      this.state.isImmune ||
      this.state.immunityTimer > 0 ||
      this.state.stance === 'CRASH' ||
      this.state.crashTimer > 0 ||
      this.state.isGameOver
    ) {
      return;
    }

    const sx = this.state.skierX;
    const sy = this.state.skierY;

    for (const obs of this.state.obstacles) {
      // Hitbox check
      const hitX = Math.abs(sx - obs.x) < (obs.width / 2 + 8);
      const hitY = Math.abs(sy - obs.y) < (obs.height / 2 + 8);

      if (hitX && hitY) {
        if (obs.type === 'SNOW_BUMP') {
          // Hitting a snow bump / mogul launches player into a jump!
          if (!this.state.isAirborne) {
            this.state.preJumpStance = this.state.stance;
            this.state.preJumpDirectionX = this.state.directionX;
            this.state.isAirborne = true;
            this.state.vz = 9.0;
            this.state.skierZ = 2;
            this.state.stance = 'JUMP_NORMAL';
            sound.playBump();
            this.addFloatingText('HOP!', '#FFFFFF');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(30);
            }
          }
        } else {
          // Crash into tree, rock, dog, or NPC!
          this.triggerCrash(obs.type);
          break;
        }
      }
    }
  }

  private updateYeti(dt: number) {
    const yeti = this.state.yeti;

    // Trigger Yeti when skier reaches 1600m or on steep slopes
    if (yeti.state === 'SLEEPING' && this.state.distance > 1600) {
      yeti.state = 'SPAWNING';
      yeti.active = true;
      yeti.x = this.state.skierX + (Math.random() > 0.5 ? 200 : -200);
      yeti.y = this.state.skierY - 350; // behind skier
      sound.playYetiRoar();
      this.addFloatingText('ROAAAR!', '#E01820');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 150]);
      }
    }

    if (!yeti.active || yeti.state === 'SLEEPING') return;

    yeti.frame++;

    if (yeti.state === 'SPAWNING') {
      yeti.state = 'CHASING';
    }

    if (yeti.state === 'CHASING' || yeti.state === 'POUNCING') {
      // Check if Yeti collides with trees or rocks (Yeti crashes into obstacle and gets stunned!)
      for (const obs of this.state.obstacles) {
        if (obs.type.includes('TREE') || obs.type === 'ROCK' || obs.type === 'TREE_STUMP') {
          const hitX = Math.abs(yeti.x - obs.x) < (obs.width / 2 + 18);
          const hitY = Math.abs(yeti.y - obs.y) < (obs.height / 2 + 18);
          if (hitX && hitY) {
            yeti.state = 'STUNNED';
            yeti.stateTimer = 0;
            sound.playBump();
            this.addFloatingText('💫 YETI CRASHED INTO TREE! +500', '#00FFFF');
            this.state.score += 500;
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([120, 60, 120]);
            }
            break;
          }
        }
      }

      if (yeti.state === 'STUNNED') return;

      // Yeti runs faster than the skier!
      const targetX = this.state.skierX;
      const targetY = this.state.skierY;
      const dx = targetX - yeti.x;
      const dy = targetY - yeti.y;
      const dist = Math.hypot(dx, dy);

      // Yeti chasing speed is 110 km/h (110 / 8 = 13.75 in physics units)
      const yetiSpeed = 110 / 8; // 13.75

      if (dist > 10) {
        yeti.vx = (dx / dist) * (yetiSpeed * 0.85);
        yeti.vy = (dy / dist) * yetiSpeed;
        yeti.x += yeti.vx;
        yeti.y += yeti.vy;
      }

      // Check catching skier
      if (dist < 28 && !this.state.isImmune) {
        if (this.state.isAirborne) {
          // Skier jumps over the Yeti!
          this.addFloatingText('★ YETI JUMP DODGE! +750 ★', '#FFD700');
          this.state.score += 750;
          sound.playJump();
          yeti.y -= 150; // Push Yeti back
          yeti.state = 'CHASING';
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
          }
        } else {
          // Yeti catches the skier! Blood bursts out!
          yeti.state = 'GRABBING';
          this.state.isSprinting = false;
          this.state.stance = 'EATEN';
          this.state.isGameOver = true;
          yeti.stateTimer = 0;
          yeti.eatStep = 0;
          sound.playYetiChomp();
          this.spawnBloodParticles(yeti.x, yeti.y - 12, 'yeti_grab');
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([150, 50, 200]);
          }
        }
      }
    } else if (yeti.state === 'STUNNED') {
      yeti.stateTimer += dt;
      yeti.y -= this.state.speed * 0.45; // Falls behind as you speed away
      if (yeti.stateTimer > 3500) {
        yeti.state = 'CHASING';
        sound.playYetiRoar();
        this.addFloatingText('ROAR! YETI RECOVERS!', '#FF4500');
      }
    } else if (yeti.state === 'GRABBING') {
      yeti.stateTimer += dt;
      yeti.x = this.state.skierX;
      yeti.y = this.state.skierY;
      if (yeti.stateTimer > 700) {
        yeti.state = 'EATING';
        yeti.stateTimer = 0;
        yeti.eatStep = 0;
        sound.playYetiChomp();
        this.spawnBloodParticles(yeti.x, yeti.y - 25, 'yeti_bite');
      }
    } else if (yeti.state === 'EATING') {
      yeti.stateTimer += dt;
      if (yeti.stateTimer > 500 && yeti.eatStep === 0) {
        yeti.eatStep = 1;
        sound.playYetiChomp();
        this.spawnBloodParticles(yeti.x, yeti.y - 25, 'yeti_bite');
      } else if (yeti.stateTimer > 1000 && yeti.eatStep === 1) {
        yeti.eatStep = 2;
        sound.playYetiChomp();
        this.spawnBloodParticles(yeti.x, yeti.y - 25, 'yeti_bite');
      } else if (yeti.stateTimer > 1500) {
        yeti.state = 'SATISFIED';
        yeti.stateTimer = 0;
        sound.playGameOver();
        if (this.onGameOverCallback) {
          this.onGameOverCallback(
            this.state.score,
            this.state.distance,
            this.state.maxSpeedAchieved,
            this.state.tricksLanded
          );
        }
      }
    }
  }

  private updateEffects(dt: number = 16) {
    // Particles (with physics gravity and snow blood stains)
    this.state.particles = this.state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) {
        p.vy += p.gravity;
      }
      p.life++;

      // Blood particles paint the white snow red as they arc and land
      if (p.isBlood && this.state.bloodStains.length < 160) {
        // Occasional spray painting as larger droplets fall
        if (p.life > 1 && p.life % 5 === 0 && Math.random() < 0.25) {
          const maxLife = 1800 + Math.random() * 500;
          this.state.bloodStains.push({
            x: p.x + (Math.random() - 0.5) * 4,
            y: p.y + (Math.random() - 0.5) * 4,
            size: Math.max(2, p.size - 1),
            color: p.color,
            opacity: 0.95,
            life: 0,
            maxLife,
          });
        }
        // Impact splatter pool when droplet reaches end of flight
        if (p.life >= p.maxLife - 1 && Math.random() < 0.6) {
          const maxLife = 2000 + Math.random() * 500;
          this.state.bloodStains.push({
            x: p.x,
            y: p.y,
            size: Math.max(2, p.size),
            color: p.color,
            opacity: 0.95,
            life: 0,
            maxLife,
          });
        }
      }

      return p.life < p.maxLife;
    });

    // Blood splatter stains fade away after a couple of seconds (~2.0 - 2.5 seconds)
    const screenTopMargin = this.canvasHeight * 0.35 + 80;
    const screenBottomMargin = this.canvasHeight * 0.65 + 120;
    const screenSideMargin = this.canvasWidth * 0.5 + 100;

    const safeDt = Math.max(1, Math.min(100, dt || 16));

    this.state.bloodStains = this.state.bloodStains.filter(stain => {
      stain.life = (stain.life || 0) + safeDt;
      const maxLife = stain.maxLife || 2200;

      // Stay crisp/opaque on snow for initial impact (~0.8s), then smoothly fade out to 0
      const solidDuration = Math.min(800, maxLife * 0.35);
      if (stain.life <= solidDuration) {
        stain.opacity = 0.95;
      } else {
        const fadeRatio = (stain.life - solidDuration) / Math.max(1, maxLife - solidDuration);
        stain.opacity = Math.max(0, 0.95 * (1 - fadeRatio));
      }

      // Remove once completely faded away
      if (stain.life >= maxLife || stain.opacity <= 0.01) {
        return false;
      }

      // Also cull when moved out of screen viewport
      const relY = stain.y - this.state.skierY;
      const relX = Math.abs(stain.x - this.state.skierX);
      return relY >= -screenTopMargin && relY <= screenBottomMargin && relX <= screenSideMargin;
    });

    // Floating texts
    this.state.floatingTexts = this.state.floatingTexts.filter(t => {
      t.y -= 0.8;
      t.life++;
      return t.life < t.maxLife;
    });
  }
}
