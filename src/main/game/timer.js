/**
 * Timer - Server-authoritative time control system
 * Supports base time + byo-yomi (3 periods of 30 seconds)
 */

const { BYOYOMI } = require('../../shared/constants');

class PlayerTimer {
  /**
   * @param {number} baseTime - Base time in milliseconds
   */
  constructor(baseTime) {
    this.baseTime = baseTime;
    this.remainingBase = baseTime;
    this.byoYomiPeriods = BYOYOMI.PERIODS; // 3
    this.byoYomiTime = BYOYOMI.TIME; // 30000ms
    this.currentByoYomiRemaining = BYOYOMI.TIME;
    this.inByoYomi = false;
    this.timedOut = false; // All periods exhausted
    this._running = false;
    this._lastTick = null;
    this._interval = null;
    this._onUpdate = null;
    this._onByoYomiUsed = null;
    this._onTimedOut = null;
  }

  /**
   * Set callback for timer updates (called every 100ms)
   */
  onUpdate(callback) {
    this._onUpdate = callback;
  }

  /**
   * Set callback for when a byo-yomi period is used
   */
  onByoYomiUsed(callback) {
    this._onByoYomiUsed = callback;
  }

  /**
   * Set callback for when all time is exhausted
   */
  onTimedOut(callback) {
    this._onTimedOut = callback;
  }

  /**
   * Start the timer
   */
  start() {
    if (this.timedOut || this._running) return;
    
    this._running = true;
    this._lastTick = Date.now();
    
    this._interval = setInterval(() => {
      this._tick();
    }, 100);
  }

  /**
   * Stop the timer (player submitted their move)
   */
  stop() {
    if (!this._running) return;
    
    this._running = false;
    this._tick(); // Final tick to update remaining time
    
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }

    // If in byo-yomi and move was made in time, reset byo-yomi timer
    if (this.inByoYomi && !this.timedOut) {
      this.currentByoYomiRemaining = this.byoYomiTime;
    }
  }

  /**
   * Internal tick - update remaining time
   */
  _tick() {
    const now = Date.now();
    const elapsed = now - this._lastTick;
    this._lastTick = now;

    if (!this.inByoYomi) {
      // Deduct from base time
      this.remainingBase -= elapsed;
      
      if (this.remainingBase <= 0) {
        // Base time exhausted - enter byo-yomi
        const overflow = -this.remainingBase;
        this.remainingBase = 0;
        this.inByoYomi = true;
        this.currentByoYomiRemaining = this.byoYomiTime - overflow;
        
        if (this.currentByoYomiRemaining <= 0) {
          this._handleByoYomiTimeout();
          return;
        }
      }
    } else {
      // Deduct from byo-yomi
      this.currentByoYomiRemaining -= elapsed;
      
      if (this.currentByoYomiRemaining <= 0) {
        this._handleByoYomiTimeout();
        return;
      }
    }

    if (this._onUpdate) {
      this._onUpdate(this.getState());
    }
  }

  /**
   * Handle byo-yomi period timeout
   */
  _handleByoYomiTimeout() {
    this.byoYomiPeriods--;
    
    if (this._onByoYomiUsed) {
      this._onByoYomiUsed(this.byoYomiPeriods);
    }

    if (this.byoYomiPeriods <= 0) {
      // All periods exhausted
      this.timedOut = true;
      this.currentByoYomiRemaining = 0;
      this._running = false;
      
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
      
      if (this._onTimedOut) {
        this._onTimedOut();
      }
    } else {
      // Reset byo-yomi timer for next period
      this.currentByoYomiRemaining = this.byoYomiTime;
    }

    if (this._onUpdate) {
      this._onUpdate(this.getState());
    }
  }

  /**
   * Get current timer state
   * @returns {{
   *   remainingBase: number,
   *   inByoYomi: boolean,
   *   byoYomiPeriods: number,
   *   currentByoYomiRemaining: number,
   *   timedOut: boolean,
   *   running: boolean
   * }}
   */
  getState() {
    return {
      remainingBase: Math.max(0, this.remainingBase),
      inByoYomi: this.inByoYomi,
      byoYomiPeriods: this.byoYomiPeriods,
      currentByoYomiRemaining: Math.max(0, this.currentByoYomiRemaining),
      timedOut: this.timedOut,
      running: this._running
    };
  }

  /**
   * Destroy the timer
   */
  destroy() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._running = false;
  }
}

class TimerManager {
  /**
   * @param {number} baseTime - Base time in milliseconds for each player
   */
  constructor(baseTime) {
    this.black = new PlayerTimer(baseTime);
    this.white = new PlayerTimer(baseTime);
    this._broadcastCallback = null;
    this._broadcastInterval = null;
  }

  /**
   * Set callback for broadcasting timer state to clients
   * @param {function} callback - Called with {blackTimer, whiteTimer}
   */
  onBroadcast(callback) {
    this._broadcastCallback = callback;
  }

  /**
   * Start broadcasting timer updates every second
   */
  startBroadcast() {
    this._broadcastInterval = setInterval(() => {
      if (this._broadcastCallback) {
        this._broadcastCallback({
          blackTimer: this.black.getState(),
          whiteTimer: this.white.getState()
        });
      }
    }, 1000);
  }

  /**
   * Stop broadcasting
   */
  stopBroadcast() {
    if (this._broadcastInterval) {
      clearInterval(this._broadcastInterval);
      this._broadcastInterval = null;
    }
  }

  /**
   * Start both timers for a new turn
   */
  startTurn() {
    if (!this.black.timedOut) this.black.start();
    if (!this.white.timedOut) this.white.start();
  }

  /**
   * Stop a player's timer when they submit their move
   * @param {string} color - 'black' or 'white'
   */
  stopPlayer(color) {
    if (color === 'black') {
      this.black.stop();
    } else {
      this.white.stop();
    }
  }

  /**
   * Get combined timer state
   */
  getState() {
    return {
      blackTimer: this.black.getState(),
      whiteTimer: this.white.getState()
    };
  }

  /**
   * Destroy all timers
   */
  destroy() {
    this.stopBroadcast();
    this.black.destroy();
    this.white.destroy();
  }
}

module.exports = { PlayerTimer, TimerManager };
