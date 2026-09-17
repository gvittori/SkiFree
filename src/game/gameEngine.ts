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
    return {
      skierX: 0,
      skierY: 100,
      skierZ: 0,
      vz: 0,
      stance: 'SKI_DOWN',
      directionX: 0,
      speed: 0,
      baseSpeed: 4.5,

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
      particles: [],
      floatingTexts: [],
    };
  }

  public reset(autoStart: boolean = false) {
    this.state = this.createInitialState();
    this.seedInitialObstacles();
    if (autoStart) {
      this.start();
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
      this.spawnObstacleRow(y);
    }
    this.lastObstacleSpawnY = 1500;
  }

  private spawnObstacleRow(y: number) {
    const spreadX = 540; // wider mountain width corridor so trees are spread out
    const count = 1 + Math.floor(Math.random() * 2); // 1 or 2 items per row

    for (let i = 0; i < count; i++) {
      // Pick random X position
      const x = (Math.random() - 0.5) * spreadX * 2;

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
   * Steer left command
   */
  public steerLeft() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.crashTimer > 0) return;

    if (this.state.isAirborne) {
      // Slight air drift
      this.state.skierX -= 12;
      return;
    }

    switch (this.state.stance) {
      case 'STAND_RIGHT':
        this.state.stance = 'SKI_DOWN';
        this.state.directionX = 0;
        break;
      case 'SKI_FAST_RIGHT':
        this.state.stance = 'SKI_RIGHT';
        this.state.directionX = 0.6;
        break;
      case 'SKI_RIGHT':
        this.state.stance = 'SKI_DOWN';
        this.state.directionX = 0;
        break;
      case 'SKI_DOWN':
      case 'SKI_DOWN_FAST':
        this.state.stance = 'SKI_LEFT';
        this.state.directionX = -0.7;
        this.addCarveParticles(-1);
        break;
      case 'SKI_LEFT':
        this.state.stance = 'SKI_FAST_LEFT';
        this.state.directionX = -1.2;
        this.addCarveParticles(-1);
        break;
      case 'SKI_FAST_LEFT':
        this.state.stance = 'STAND_LEFT';
        this.state.directionX = -0.2;
        break;
      case 'STAND_LEFT':
        // already stopped facing left
        break;
      default:
        this.state.stance = 'SKI_LEFT';
        this.state.directionX = -0.7;
    }
  }

  /**
   * Steer right command
   */
  public steerRight() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.crashTimer > 0) return;

    if (this.state.isAirborne) {
      // Slight air drift
      this.state.skierX += 12;
      return;
    }

    switch (this.state.stance) {
      case 'STAND_LEFT':
        this.state.stance = 'SKI_DOWN';
        this.state.directionX = 0;
        break;
      case 'SKI_FAST_LEFT':
        this.state.stance = 'SKI_LEFT';
        this.state.directionX = -0.6;
        break;
      case 'SKI_LEFT':
        this.state.stance = 'SKI_DOWN';
        this.state.directionX = 0;
        break;
      case 'SKI_DOWN':
      case 'SKI_DOWN_FAST':
        this.state.stance = 'SKI_RIGHT';
        this.state.directionX = 0.7;
        this.addCarveParticles(1);
        break;
      case 'SKI_RIGHT':
        this.state.stance = 'SKI_FAST_RIGHT';
        this.state.directionX = 1.2;
        this.addCarveParticles(1);
        break;
      case 'SKI_FAST_RIGHT':
        this.state.stance = 'STAND_RIGHT';
        this.state.directionX = 0.2;
        break;
      case 'STAND_RIGHT':
        // already stopped facing right
        break;
      default:
        this.state.stance = 'SKI_RIGHT';
        this.state.directionX = 0.7;
    }
  }

  /**
   * Straight downhill tuck / speed boost
   */
  public steerDown() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.crashTimer > 0) return;
    if (this.state.isAirborne) return;

    this.state.stance = 'SKI_DOWN_FAST';
    this.state.directionX = 0;
  }

  /**
   * Jump or Trick Action
   * (Bottom center button)
   */
  public actionJumpOrTrick() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver || this.state.crashTimer > 0) return;

    if (!this.state.isAirborne) {
      // Launch jump from ground!
      this.state.preJumpStance = this.state.stance;
      this.state.preJumpDirectionX = this.state.directionX;
      this.state.isAirborne = true;
      this.state.vz = 14;
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
   * Trigger crash with 2-second immunity frame (no message just blinking)
   */
  public triggerCrash() {
    if (!this.state.isRunning || this.state.isPaused || this.state.isImmune || this.state.crashTimer > 0 || this.state.isGameOver) return;

    this.state.stance = 'CRASH';
    this.state.crashTimer = 40; // ~0.65s stunned
    this.state.isAirborne = false;
    this.state.skierZ = 0;
    this.state.vz = 0;
    this.state.directionX = 0;
    this.state.speed = 1.0;

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
  public update(dt: number) {
    if (!this.state.isRunning || this.state.isPaused) return;

    this.animTick++;

    // 1. Crash recovery and Immunity timer handling
    if (this.state.crashTimer > 0) {
      this.state.crashTimer--;
      if (this.state.crashTimer === 0) {
        // Skier gets back up
        this.state.stance = 'SKI_DOWN';
        // Activate 2-second immunity frame (2000 ms)
        this.state.isImmune = true;
        this.state.immunityTimer = 2000;
      }
    }

    if (this.state.isImmune) {
      this.state.immunityTimer -= dt;
      if (this.state.immunityTimer <= 0) {
        this.state.isImmune = false;
        this.state.immunityTimer = 0;
      }
    }

    // 2. Gameplay speed increases as the skier descends the mountain!
    // As distance increases, base downhill speed progressively scales up.
    const distanceKm = this.state.distance / 1000;
    this.state.baseSpeed = 4.5 + Math.min(6.5, distanceKm * 2.8);

    // Stance speed multiplier
    let stanceMultiplier = 1.0;
    switch (this.state.stance) {
      case 'STAND_LEFT':
      case 'STAND_RIGHT':
        stanceMultiplier = 0.15;
        break;
      case 'SKI_LEFT':
      case 'SKI_RIGHT':
        stanceMultiplier = 0.95;
        break;
      case 'SKI_FAST_LEFT':
      case 'SKI_FAST_RIGHT':
        stanceMultiplier = 0.8;
        break;
      case 'SKI_DOWN':
        stanceMultiplier = 1.25;
        break;
      case 'SKI_DOWN_FAST':
        stanceMultiplier = 1.55;
        break;
      case 'CRASH':
        stanceMultiplier = 0.05;
        break;
      case 'EATEN':
        stanceMultiplier = 0;
        break;
      default:
        stanceMultiplier = 1.0;
    }

    this.state.speed = this.state.baseSpeed * stanceMultiplier;

    // Convert to realistic km/h for the HUD
    const speedKmH = Math.round(this.state.speed * 8);
    if (speedKmH > this.state.maxSpeedAchieved) {
      this.state.maxSpeedAchieved = speedKmH;
    }

    // 3. Movement
    if (!this.state.isGameOver && this.state.stance !== 'CRASH') {
      // Downhill displacement
      const dy = this.state.speed;
      this.state.skierY += dy;
      this.state.distance += Math.round(dy * 0.4);
      this.state.score += Math.round(dy * 0.4);

      // Horizontal displacement
      this.state.skierX += this.state.directionX * (this.state.speed * 0.85);

      // Clamp boundary
      this.state.skierX = Math.max(-420, Math.min(420, this.state.skierX));

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

    // 4. Airborne jump physics
    if (this.state.isAirborne) {
      this.state.skierZ += this.state.vz;
      this.state.vz -= 0.85; // Gravity

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

    // Cull obstacles that are far behind skier
    this.state.obstacles = this.state.obstacles.filter(
      obs => obs.y > this.state.skierY - 400 && obs.y < this.state.skierY + 1200
    );

    // 6. Update NPCs (Snowboarders, Novice skiers, Dogs)
    this.updateNPCs();

    // 7. Collision Detection with Obstacles
    this.checkCollisions();

    // 8. The Yeti Logic (Abominable Snow Monster)
    this.updateYeti(dt);

    // 9. Update Particles & Floating texts
    this.updateEffects();
  }

  private updateNPCs() {
    this.state.obstacles.forEach(obs => {
      obs.frame = (obs.frame || 0) + 1;

      if (obs.type === 'SNOWBOARDER') {
        obs.y += obs.vy || 3.0;
        obs.x += obs.vx || 1.2;

        // Periodic carving switch
        if (obs.x > 380) obs.vx = -Math.abs(obs.vx || 1.5);
        if (obs.x < -380) obs.vx = Math.abs(obs.vx || 1.5);

        if (Math.random() < 0.02) {
          obs.vx = (obs.vx || 1.5) * -1;
          obs.stance = (obs.vx || 1) > 0 ? 'CARVE_RIGHT' : 'CARVE_LEFT';
        }
      } else if (obs.type === 'NOVICE_SKIER') {
        obs.y += obs.vy || 2.0;
        obs.x += Math.sin((obs.frame || 0) * 0.05) * 1.0;
      } else if (obs.type === 'DOG') {
        obs.x += obs.vx || 1.2;
        if (obs.x > 400) obs.vx = -1.2;
        if (obs.x < -400) obs.vx = 1.2;

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
    if (this.state.isImmune || this.state.crashTimer > 0 || this.state.isGameOver) {
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
            this.state.vz = 12;
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
          this.triggerCrash();
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

      // Speed is 1.3x faster than current downhill speed
      const yetiSpeed = Math.max(7.5, this.state.speed * 1.32);

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
          // Yeti catches the skier!
          yeti.state = 'GRABBING';
          this.state.stance = 'EATEN';
          this.state.isGameOver = true;
          yeti.stateTimer = 0;
          yeti.eatStep = 0;
          sound.playYetiChomp();
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
      }
    } else if (yeti.state === 'EATING') {
      yeti.stateTimer += dt;
      if (yeti.stateTimer > 500 && yeti.eatStep === 0) {
        yeti.eatStep = 1;
        sound.playYetiChomp();
      } else if (yeti.stateTimer > 1000 && yeti.eatStep === 1) {
        yeti.eatStep = 2;
        sound.playYetiChomp();
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

  private updateEffects() {
    // Particles
    this.state.particles = this.state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      return p.life < p.maxLife;
    });

    // Floating texts
    this.state.floatingTexts = this.state.floatingTexts.filter(t => {
      t.y -= 0.8;
      t.life++;
      return t.life < t.maxLife;
    });
  }
}
