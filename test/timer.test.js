/**
 * Test suite for Timer System
 * Tests time control, byo-yomi, and timeout logic
 */

const assert = require('assert');

// Import timer module
const { PlayerTimer, TimerManager } = require('../src/main/game/timer');

describe('PlayerTimer', () => {
  describe('constructor', () => {
    it('should initialize with correct base time', () => {
      const timer = new PlayerTimer(600000);
      const state = timer.getState();
      assert.strictEqual(state.remainingBase, 600000);
    });

    it('should initialize with 3 byo-yomi periods', () => {
      const timer = new PlayerTimer(600000);
      const state = timer.getState();
      assert.strictEqual(state.byoYomiPeriods, 3);
    });

    it('should not be in byo-yomi initially', () => {
      const timer = new PlayerTimer(600000);
      const state = timer.getState();
      assert.strictEqual(state.inByoYomi, false);
    });

    it('should not be timed out initially', () => {
      const timer = new PlayerTimer(600000);
      const state = timer.getState();
      assert.strictEqual(state.timedOut, false);
    });

    it('should not be running initially', () => {
      const timer = new PlayerTimer(600000);
      const state = timer.getState();
      assert.strictEqual(state.running, false);
    });
  });

  describe('start/stop', () => {
    it('should track running state', () => {
      const timer = new PlayerTimer(600000);
      assert.strictEqual(timer.getState().running, false);
      timer.start();
      assert.strictEqual(timer.getState().running, true);
      timer.stop();
      assert.strictEqual(timer.getState().running, false);
    });
  });

  describe('getState', () => {
    it('should return complete state object', () => {
      const timer = new PlayerTimer(600000);
      const state = timer.getState();
      
      assert.ok('remainingBase' in state);
      assert.ok('byoYomiPeriods' in state);
      assert.ok('inByoYomi' in state);
      assert.ok('currentByoYomiRemaining' in state);
      assert.ok('timedOut' in state);
      assert.ok('running' in state);
    });
  });

  describe('edge cases', () => {
    it('should handle zero base time', () => {
      const timer = new PlayerTimer(0);
      const state = timer.getState();
      assert.strictEqual(state.remainingBase, 0);
    });
  });
});

describe('TimerManager', () => {
  describe('constructor', () => {
    it('should create black and white timers', () => {
      const timerManager = new TimerManager(300000);
      const state = timerManager.getState();
      assert.ok(state.blackTimer);
      assert.ok(state.whiteTimer);
      assert.strictEqual(state.blackTimer.remainingBase, 300000);
      assert.strictEqual(state.whiteTimer.remainingBase, 300000);
    });
  });

  describe('methods', () => {
    it('should have startTurn method', () => {
      const timerManager = new TimerManager(300000);
      assert.strictEqual(typeof timerManager.startTurn, 'function');
    });

    it('should have stopPlayer method', () => {
      const timerManager = new TimerManager(300000);
      assert.strictEqual(typeof timerManager.stopPlayer, 'function');
    });

    it('should have getState method', () => {
      const timerManager = new TimerManager(300000);
      assert.strictEqual(typeof timerManager.getState, 'function');
    });
  });
});

// Test runner
if (require.main === module) {
  const Mocha = require('mocha');
  const mocha = new Mocha();
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}
