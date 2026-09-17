/**
 * SkiFree Retro - Offline Leaderboard Management
 * Persists high scores to localStorage with offline support.
 */

import { LeaderboardEntry } from '../types';

const STORAGE_KEY = 'skifree_retro_offline_leaderboard';
const PLAYER_NAME_KEY = 'skifree_last_player_name';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    name: 'YETI_SLAYER',
    score: 8450,
    distance: 2850,
    tricksCount: 18,
    maxSpeed: 78,
    date: '2026-09-10',
  },
  {
    id: 'seed-2',
    name: 'ALPINE_PRO',
    score: 6200,
    distance: 2310,
    tricksCount: 14,
    maxSpeed: 72,
    date: '2026-09-12',
  },
  {
    id: 'seed-3',
    name: 'POWDER_HOUND',
    score: 4890,
    distance: 1940,
    tricksCount: 11,
    maxSpeed: 65,
    date: '2026-09-13',
  },
  {
    id: 'seed-4',
    name: 'MOGUL_CHAMP',
    score: 3650,
    distance: 1620,
    tricksCount: 9,
    maxSpeed: 59,
    date: '2026-09-14',
  },
  {
    id: 'seed-5',
    name: 'RETRO_SKIER',
    score: 2400,
    distance: 1200,
    tricksCount: 5,
    maxSpeed: 52,
    date: '2026-09-15',
  },
];

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
      return DEFAULT_LEADERBOARD;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => b.score - a.score);
    }
    return DEFAULT_LEADERBOARD;
  } catch {
    return DEFAULT_LEADERBOARD;
  }
}

export function saveScore(entry: Omit<LeaderboardEntry, 'id' | 'date'>): { entry: LeaderboardEntry; rank: number; isTop10: boolean } {
  const current = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `score-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString().split('T')[0],
  };

  const updated = [...current, newEntry].sort((a, b) => b.score - a.score).slice(0, 15);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(PLAYER_NAME_KEY, entry.name);
  } catch (e) {
    console.error('Failed to save score to localStorage', e);
  }

  const rank = updated.findIndex((item) => item.id === newEntry.id) + 1;
  return {
    entry: newEntry,
    rank,
    isTop10: rank > 0 && rank <= 10,
  };
}

export function getLastPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || 'SKIER_' + Math.floor(Math.random() * 900 + 100);
  } catch {
    return 'SKIER_101';
  }
}

export function getHighScore(): number {
  const list = getLeaderboard();
  return list.length > 0 ? list[0].score : 0;
}

export function resetLeaderboard(): LeaderboardEntry[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
  } catch (e) {
    console.error('Failed to reset leaderboard', e);
  }
  return DEFAULT_LEADERBOARD;
}
