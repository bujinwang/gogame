/**
 * 同步围棋 (Simultaneous Go)
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 */
const { STONE, GAME_MODE, GAME_END_REASON } = require('../../shared/constants');
const Board = require('./board');
const Rules = require('./rules');
const Scoring = require('./scoring');
const { TimerManager } = require('./timer');

class GameEngine {
  /**
   * @param {object} settings
   * @param {string} settings.mode - GAME_MODE enum
   * @param {number} settings.baseTime - Base time in ms
   * @param {string} [settings.aiDifficulty] - AI difficulty level
   */
  constructor(settings) {
    this.settings = settings;
    this.board = new Board();
    this.timerManager = new TimerManager(settings.baseTime);
    this.turnNumber = 0;
    this.gameStarted = false;
    this.gameEnded = false;
    
    // Pending moves for current turn
    this.pendingBlackMove = null;
    this.pendingWhiteMove = null;
    
    // History
    this.moveHistory = []; // Array of {turn, blackMove, whiteMove, result}
    this.boardHistory = new Set(); // Set of board hashes for superko
    
    // Captured stones count
    this.capturedByBlack = 0; // White stones captured by black
    this.capturedByWhite = 0; // Black stones captured by white
    
    // Callbacks
    this._onTurnResolved = null;
    this._onGameEnd = null;
    this._onTimerUpdate = null;
    this._onByoYomiUsed = null;
    this._onPlayerTimedOut = null;
    
    this._setupTimerCallbacks();
  }

  _setupTimerCallbacks() {
    this.timerManager.black.onUpdate((state) => {
      if (this._onTimerUpdate) {
        this._onTimerUpdate('black', state);
      }
    });

    this.timerManager.white.onUpdate((state) => {
      if (this._onTimerUpdate) {
        this._onTimerUpdate('white', state);
      }
    });

    this.timerManager.black.onByoYomiUsed((remaining) => {
      if (this._onByoYomiUsed) {
        this._onByoYomiUsed('black', remaining);
      }
    });

    this.timerManager.white.onByoYomiUsed((remaining) => {
      if (this._onByoYomiUsed) {
        this._onByoYomiUsed('white', remaining);
      }
    });

    this.timerManager.black.onTimedOut(() => {
      this._handlePlayerTimedOut('black');
    });

    this.timerManager.white.onTimedOut(() => {
      this._handlePlayerTimedOut('white');
    });

    this.timerManager.onBroadcast((state) => {
      if (this._onTimerUpdate) {
        this._onTimerUpdate('both', state);
      }
    });
  }

  // Event setters
  onTurnResolved(callback) { this._onTurnResolved = callback; }
  onGameEnd(callback) { this._onGameEnd = callback; }
  onTimerUpdate(callback) { this._onTimerUpdate = callback; }
  onByoYomiUsed(callback) { this._onByoYomiUsed = callback; }
  onPlayerTimedOut(callback) { this._onPlayerTimedOut = callback; }

  /**
   * Start the game
   */
  startGame() {
    this.gameStarted = true;
    this.gameEnded = false;
    this.turnNumber = 0;
    this.board = new Board();
    this.boardHistory.clear();
    this.boardHistory.add(this.board.getHash());
    this.moveHistory = [];
    this.capturedByBlack = 0;
    this.capturedByWhite = 0;
    this.pendingBlackMove = null;
    this.pendingWhiteMove = null;
    
    this.startNextTurn();
  }

  /**
   * Start the next turn
   */
  startNextTurn() {
    this.turnNumber++;
    this.pendingBlackMove = null;
    this.pendingWhiteMove = null;
    
    // Auto-pass for timed-out players
    if (this.timerManager.black.timedOut) {
      this.pendingBlackMove = { pass: true };
    }
    if (this.timerManager.white.timedOut) {
      this.pendingWhiteMove = { pass: true };
    }
    
    // If both players are timed out (both auto-passed), resolve immediately
    if (this.pendingBlackMove !== null && this.pendingWhiteMove !== null) {
      this._resolveTurn();
      return;
    }
    
    // Start timers for non-timed-out players
    this.timerManager.startTurn();
    this.timerManager.startBroadcast();
  }

  /**
   * Submit a move for a player
   * @param {string} color - 'black' or 'white'
   * @param {{x?: number, y?: number, pass?: boolean}} move
   * @returns {{accepted: boolean, reason?: string, turnResolved?: boolean}}
   */
  submitMove(color, move) {
    if (this.gameEnded) {
      return { accepted: false, reason: 'Game has ended' };
    }

    if (!this.gameStarted) {
      return { accepted: false, reason: 'Game has not started' };
    }

    // Check if player already submitted
    if (color === 'black' && this.pendingBlackMove !== null) {
      return { accepted: false, reason: 'Already submitted move this turn' };
    }
    if (color === 'white' && this.pendingWhiteMove !== null) {
      return { accepted: false, reason: 'Already submitted move this turn' };
    }

    // Check if player is timed out
    const timer = color === 'black' ? this.timerManager.black : this.timerManager.white;
    if (timer.timedOut) {
      return { accepted: false, reason: 'Player has timed out' };
    }

    // Validate move (pre-validation - before knowing opponent's move)
    if (!move.pass) {
      const stoneColor = color === 'black' ? STONE.BLACK : STONE.WHITE;
      const validation = Rules.preValidateMove(this.board, move.x, move.y, stoneColor);
      if (!validation.valid) {
        return { accepted: false, reason: validation.reason };
      }
    }

    // Accept the move
    if (color === 'black') {
      this.pendingBlackMove = move;
    } else {
      this.pendingWhiteMove = move;
    }

    // Stop this player's timer
    this.timerManager.stopPlayer(color);

    // Check if both moves are in
    if (this.pendingBlackMove !== null && this.pendingWhiteMove !== null) {
      this._resolveTurn();
      return { accepted: true, turnResolved: true };
    }

    return { accepted: true, turnResolved: false };
  }

  /**
   * Resolve the current turn after both moves are submitted
   */
  _resolveTurn() {
    this.timerManager.stopBroadcast();

    const blackMove = this.pendingBlackMove;
    const whiteMove = this.pendingWhiteMove;

    // Resolve the turn
    const result = Rules.resolveTurn(this.board, blackMove, whiteMove);

    // Update capture counts
    this.capturedByBlack += result.capturedWhite.length;
    this.capturedByWhite += result.capturedBlack.length;

    // Record board state for superko
    this.boardHistory.add(this.board.getHash());

    // Record move history
    const historyEntry = {
      turn: this.turnNumber,
      blackMove: blackMove,
      whiteMove: whiteMove,
      collision: result.collision,
      collisionPos: result.collisionPos,
      capturedBlack: result.capturedBlack.length,
      capturedWhite: result.capturedWhite.length
    };
    this.moveHistory.push(historyEntry);

    // Notify
    if (this._onTurnResolved) {
      this._onTurnResolved({
        ...historyEntry,
        board: this.board.serialize(),
        capturedByBlack: this.capturedByBlack,
        capturedByWhite: this.capturedByWhite,
        timers: this.timerManager.getState()
      });
    }

    // Check if game should end
    if (result.bothPassed) {
      this._endGame(GAME_END_REASON.DOUBLE_PASS);
      return;
    }

    // Check if both players are timed out
    if (this.timerManager.black.timedOut && this.timerManager.white.timedOut) {
      this._endGame(GAME_END_REASON.TIMEOUT);
      return;
    }

    // Start next turn
    this.startNextTurn();
  }

  /**
   * Handle player timeout - when all 3 byo-yomi periods are exhausted,
   * the game ends immediately and the opponent wins.
   * @param {string} color
   */
  _handlePlayerTimedOut(color) {
    if (this._onPlayerTimedOut) {
      this._onPlayerTimedOut(color);
    }

    // When a player's all 3 byo-yomi periods are exhausted,
    // end the game immediately - the other player wins by timeout
    const winner = color === 'black' ? 'white' : 'black';
    this._endGame(GAME_END_REASON.TIMEOUT, winner);
  }

  /**
   * Handle player resignation
   * @param {string} color - The color that resigns
   */
  resign(color) {
    this._endGame(GAME_END_REASON.RESIGN, color === 'black' ? 'white' : 'black');
  }

  /**
   * End the game and calculate scores
   * @param {string} reason
   * @param {string} [forcedWinner] - If set, this player wins regardless of score
   */
  _endGame(reason, forcedWinner = null) {
    this.gameEnded = true;
    this.timerManager.destroy();

    const scoring = Scoring.calculate(this.board);
    
    const result = {
      reason,
      scoring,
      winner: forcedWinner || scoring.winner,
      board: this.board.serialize(),
      moveHistory: this.moveHistory,
      capturedByBlack: this.capturedByBlack,
      capturedByWhite: this.capturedByWhite
    };

    if (this._onGameEnd) {
      this._onGameEnd(result);
    }

    return result;
  }

  /**
   * Get current game state for sync/reconnection
   */
  getState() {
    return {
      board: this.board.serialize(),
      turnNumber: this.turnNumber,
      gameStarted: this.gameStarted,
      gameEnded: this.gameEnded,
      capturedByBlack: this.capturedByBlack,
      capturedByWhite: this.capturedByWhite,
      moveHistory: this.moveHistory,
      timers: this.timerManager.getState(),
      blackSubmitted: this.pendingBlackMove !== null,
      whiteSubmitted: this.pendingWhiteMove !== null
    };
  }

  /**
   * Destroy the engine and clean up
   */
  destroy() {
    this.timerManager.destroy();
  }
}

module.exports = GameEngine;
