/**
 * 同步围棋 (Simultaneous Go)
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 */
const { STONE, AI_DIFFICULTY } = require('../../shared/constants');
const Board = require('../game/board');
const Rules = require('../game/rules');

class AIPlayer {
  /**
   * @param {string} color - 'black' or 'white'
   * @param {string} difficulty - AI_DIFFICULTY enum
   */
  constructor(color, difficulty = AI_DIFFICULTY.MEDIUM) {
    this.color = color;
    this.stoneColor = color === 'black' ? STONE.BLACK : STONE.WHITE;
    this.opponentColor = color === 'black' ? STONE.WHITE : STONE.BLACK;
    this.difficulty = difficulty;
    
    // Playout counts based on difficulty
    this.playoutCounts = {
      [AI_DIFFICULTY.EASY]: 100,
      [AI_DIFFICULTY.MEDIUM]: 500,
      [AI_DIFFICULTY.HARD]: 2000
    };
  }

  /**
   * Generate a move for the AI
   * @param {Board} board - Current board state
   * @returns {{x: number, y: number, pass: boolean}}
   */
  generateMove(board) {
    const playouts = this.playoutCounts[this.difficulty] || 500;
    
    // Get all legal moves
    const legalMoves = this._getLegalMoves(board);
    
    if (legalMoves.length === 0) {
      return { pass: true };
    }

    // Score each move using MCTS-like evaluation
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      let score = 0;
      
      // Heuristic evaluation
      score += this._evaluateMove(board, move.x, move.y) * 10;
      
      // Random playouts
      const playoutsPerMove = Math.floor(playouts / legalMoves.length);
      for (let i = 0; i < Math.max(1, playoutsPerMove); i++) {
        score += this._randomPlayout(board, move.x, move.y);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // If best score is very negative, consider passing
    if (bestScore < -50 && legalMoves.length < 10) {
      return { pass: true };
    }

    return bestMove || { pass: true };
  }

  /**
   * Get all legal moves on the board
   * @param {Board} board
   * @returns {Array<{x: number, y: number, pass: boolean}>}
   */
  _getLegalMoves(board) {
    const moves = [];
    for (let y = 0; y < board.size; y++) {
      for (let x = 0; x < board.size; x++) {
        const validation = Rules.preValidateMove(board, x, y, this.stoneColor);
        if (validation.valid) {
          moves.push({ x, y, pass: false });
        }
      }
    }
    return moves;
  }

  /**
   * Heuristic evaluation of a move position
   * @param {Board} board
   * @param {number} x
   * @param {number} y
   * @returns {number} Score
   */
  _evaluateMove(board, x, y) {
    let score = 0;
    const size = board.size;

    // Prefer center positions early in the game
    const centerDist = Math.abs(x - size / 2) + Math.abs(y - size / 2);
    score -= centerDist * 0.5;

    // Star points bonus
    if (this._isStarPoint(x, y, size)) {
      score += 3;
    }

    // Check if this move captures opponent stones
    const testBoard = board.clone();
    testBoard.set(x, y, this.stoneColor);
    const captures = testBoard.findDeadGroups(this.opponentColor);
    let captureCount = 0;
    for (const group of captures) {
      captureCount += group.length;
    }
    score += captureCount * 5;

    // Check if this move saves own stones in atari
    for (const adj of board.getAdjacentPositions(x, y)) {
      if (board.get(adj.x, adj.y) === this.stoneColor) {
        const group = board.getGroup(adj.x, adj.y);
        const liberties = board.countLiberties(group);
        if (liberties === 1) {
          score += 8; // Save stones in atari
        }
      }
    }

    // Check if this move puts opponent in atari
    for (const adj of board.getAdjacentPositions(x, y)) {
      if (board.get(adj.x, adj.y) === this.opponentColor) {
        const group = board.getGroup(adj.x, adj.y);
        const liberties = board.countLiberties(group);
        if (liberties === 2) {
          score += 4; // Atari opponent
        }
      }
    }

    // Avoid playing next to red stones (they reduce liberties)
    for (const adj of board.getAdjacentPositions(x, y)) {
      if (board.get(adj.x, adj.y) === STONE.RED) {
        score -= 2;
      }
    }

    // Prefer moves with more liberties
    const testGroup = testBoard.getGroup(x, y);
    // Remove captured stones first
    for (const group of captures) {
      testBoard.removeStones(group);
    }
    const liberties = testBoard.countLiberties(testBoard.getGroup(x, y));
    score += liberties * 0.5;

    // Edge penalty
    if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
      score -= 2;
    }
    if (x <= 1 || x >= size - 2 || y <= 1 || y >= size - 2) {
      score -= 1;
    }

    return score;
  }

  /**
   * Check if position is a star point
   */
  _isStarPoint(x, y, size) {
    if (size === 19) {
      const starPoints = [3, 9, 15];
      return starPoints.includes(x) && starPoints.includes(y);
    }
    return false;
  }

  /**
   * Perform a random playout from a position
   * @param {Board} board
   * @param {number} moveX
   * @param {number} moveY
   * @returns {number} Score (positive = good for AI)
   */
  _randomPlayout(board, moveX, moveY) {
    const testBoard = board.clone();
    testBoard.set(moveX, moveY, this.stoneColor);

    // Remove captured stones
    const captures = testBoard.findDeadGroups(this.opponentColor);
    for (const group of captures) {
      testBoard.removeStones(group);
    }

    // Random playout for a limited number of moves
    let currentColor = this.opponentColor;
    const maxMoves = 30; // Limit playout length
    let consecutivePasses = 0;

    for (let i = 0; i < maxMoves; i++) {
      if (consecutivePasses >= 2) break;

      // Get random legal move
      const move = this._getRandomMove(testBoard, currentColor);
      if (move === null) {
        consecutivePasses++;
      } else {
        consecutivePasses = 0;
        testBoard.set(move.x, move.y, currentColor);

        // Remove captures
        const opponent = currentColor === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
        const deadGroups = testBoard.findDeadGroups(opponent);
        for (const group of deadGroups) {
          testBoard.removeStones(group);
        }
      }

      currentColor = currentColor === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
    }

    // Evaluate final position
    const counts = testBoard.countStones();
    const myStones = this.stoneColor === STONE.BLACK ? counts.black : counts.white;
    const oppStones = this.stoneColor === STONE.BLACK ? counts.white : counts.black;

    return myStones - oppStones;
  }

  /**
   * Get a random legal move
   * @param {Board} board
   * @param {number} color
   * @returns {{x: number, y: number}|null}
   */
  _getRandomMove(board, color) {
    const emptyPositions = [];
    for (let y = 0; y < board.size; y++) {
      for (let x = 0; x < board.size; x++) {
        if (board.isEmpty(x, y)) {
          emptyPositions.push({ x, y });
        }
      }
    }

    // Shuffle and try positions
    for (let i = emptyPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyPositions[i], emptyPositions[j]] = [emptyPositions[j], emptyPositions[i]];
    }

    for (const pos of emptyPositions) {
      const validation = Rules.preValidateMove(board, pos.x, pos.y, color);
      if (validation.valid) {
        return pos;
      }
    }

    return null;
  }
}

module.exports = AIPlayer;
