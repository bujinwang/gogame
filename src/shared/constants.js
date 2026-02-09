/**
 * 同步围棋 (Simultaneous Go) - Shared Constants
 * 
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin)
 * Version: 三宝001版 (v1.0.0-sanbao001)
 * 
 * All rights reserved.
 */

// Stone types on the board
const STONE = {
  EMPTY: 0,
  BLACK: 1,
  WHITE: 2,
  RED: 3
};

// Game modes
const GAME_MODE = {
  HUMAN_VS_HUMAN: 'human_vs_human',
  HUMAN_VS_AI: 'human_vs_ai',
  HUMAN_VS_HUMAN_P2P: 'human_vs_human_p2p'
};

// AI difficulty levels
const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Board size
const BOARD_SIZE = 19;

// Time control options (in milliseconds)
const TIME_OPTIONS = [
  { label: '10 分钟', value: 10 * 60 * 1000 },
  { label: '15 分钟', value: 15 * 60 * 1000 },
  { label: '20 分钟', value: 20 * 60 * 1000 },
  { label: '30 分钟', value: 30 * 60 * 1000 },
  { label: '45 分钟', value: 45 * 60 * 1000 },
  { label: '1 小时', value: 60 * 60 * 1000 },
  { label: '1.5 小时', value: 90 * 60 * 1000 },
  { label: '2 小时', value: 120 * 60 * 1000 },
  { label: '3 小时', value: 180 * 60 * 1000 },
  { label: '5 小时', value: 300 * 60 * 1000 }
];

// Byo-yomi settings
const BYOYOMI = {
  PERIODS: 3,
  TIME: 30 * 1000 // 30 seconds per period
};

// Default WebSocket port
const DEFAULT_PORT = 38765;

// Game end reasons
const GAME_END_REASON = {
  DOUBLE_PASS: 'double_pass',
  RESIGN: 'resign',
  TIMEOUT: 'timeout',
  DISCONNECT: 'disconnect'
};

module.exports = {
  STONE,
  GAME_MODE,
  AI_DIFFICULTY,
  BOARD_SIZE,
  TIME_OPTIONS,
  BYOYOMI,
  DEFAULT_PORT,
  GAME_END_REASON
};
