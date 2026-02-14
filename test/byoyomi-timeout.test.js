/**
 * Test suite for Byoyomi Timeout System
 * 
 * Tests:
 * - Base time exhaustion → entering byoyomi
 * - Byoyomi period consumption on timeout
 * - 3 byoyomi periods exhausted → timedOut = true, auto-stop
 * - Auto-judge win/loss when player times out
 * - Timer reset behavior after making a move in byoyomi
 * - GameEngine integration: timeout game end and winner assignment
 */

const assert = require('assert');
const sinon = require('sinon');
const { PlayerTimer, TimerManager } = require('../src/main/game/timer');
const GameEngine = require('../src/main/game/game-engine');
const { GAME_MODE, GAME_END_REASON, BYOYOMI, STONE } = require('../src/shared/constants');

describe('Byoyomi Timeout - Auto Stop & Auto Judge', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  // ============================================================
  // PlayerTimer: Base time → Byoyomi transition
  // ============================================================
  describe('base time exhaustion enters byoyomi', () => {
    it('should enter byoyomi when base time runs out', () => {
      const timer = new PlayerTimer(1000); // 1 second base time
      timer.start();

      // Advance time past base time
      clock.tick(1100);

      const state = timer.getState();
      assert.strictEqual(state.inByoYomi, true);
      assert.strictEqual(state.remainingBase, 0);
      timer.destroy();
    });

    it('should start byoyomi with 3 periods', () => {
      const timer = new PlayerTimer(500);
      timer.start();
      clock.tick(600);

      const state = timer.getState();
      assert.strictEqual(state.inByoYomi, true);
      assert.strictEqual(state.byoYomiPeriods, 3);
      timer.destroy();
    });

    it('should set byoyomi remaining time when entering byoyomi', () => {
      const timer = new PlayerTimer(500);
      timer.start();
      clock.tick(600);

      const state = timer.getState();
      assert.strictEqual(state.inByoYomi, true);
      // Byoyomi time = 30000ms, minus overflow from base time
      assert.ok(state.currentByoYomiRemaining > 0);
      assert.ok(state.currentByoYomiRemaining <= BYOYOMI.TIME);
      timer.destroy();
    });
  });

  // ============================================================
  // Byoyomi period consumption
  // ============================================================
  describe('byoyomi period consumption', () => {
    it('should decrement period when byoyomi time runs out', () => {
      const timer = new PlayerTimer(100); // Very short base time
      const byoYomiUsedSpy = sinon.spy();
      timer.onByoYomiUsed(byoYomiUsedSpy);
      timer.start();

      // Exhaust base time + first byoyomi period
      clock.tick(200);   // Past base time → enters byoyomi
      clock.tick(30100); // Past one full byoyomi period (30s)

      const state = timer.getState();
      assert.ok(byoYomiUsedSpy.called, 'onByoYomiUsed should have been called');
      assert.ok(state.byoYomiPeriods < 3, 'Should have consumed at least one period');
      timer.destroy();
    });

    it('should fire onByoYomiUsed callback with remaining periods', () => {
      const timer = new PlayerTimer(100);
      const byoYomiUsedSpy = sinon.spy();
      timer.onByoYomiUsed(byoYomiUsedSpy);
      timer.start();

      // Exhaust base time
      clock.tick(200);
      // Exhaust first byoyomi period
      clock.tick(30100);

      assert.ok(byoYomiUsedSpy.calledWith(2), 'Should report 2 remaining periods');
      timer.destroy();
    });

    it('should reset byoyomi timer when move is made in time', () => {
      const timer = new PlayerTimer(100);
      timer.start();

      // Exhaust base time
      clock.tick(200); // Now in byoyomi

      // Wait 15 seconds (half of byoyomi period)
      clock.tick(15000);

      // Make a move (stop timer)
      timer.stop();

      const state = timer.getState();
      assert.strictEqual(state.inByoYomi, true);
      assert.strictEqual(state.byoYomiPeriods, 3); // No period consumed
      assert.strictEqual(state.currentByoYomiRemaining, BYOYOMI.TIME); // Reset to full
      timer.destroy();
    });
  });

  // ============================================================
  // 3 Byoyomi timeouts → Auto Stop
  // ============================================================
  describe('3 byoyomi timeouts trigger auto-stop', () => {
    it('should set timedOut=true after all 3 periods exhausted', () => {
      const timer = new PlayerTimer(100);
      timer.start();

      // Exhaust base time + all 3 byoyomi periods
      // Base: 100ms, then 3 × 30000ms = 90000ms + some margin
      clock.tick(200);     // Past base time
      clock.tick(30100);   // Period 1 exhausted (2 remaining)
      clock.tick(30100);   // Period 2 exhausted (1 remaining)
      clock.tick(30100);   // Period 3 exhausted (0 remaining)

      const state = timer.getState();
      assert.strictEqual(state.timedOut, true);
      assert.strictEqual(state.byoYomiPeriods, 0);
      timer.destroy();
    });

    it('should stop running after all periods exhausted', () => {
      const timer = new PlayerTimer(100);
      timer.start();

      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);

      const state = timer.getState();
      assert.strictEqual(state.running, false);
      timer.destroy();
    });

    it('should fire onTimedOut callback when all periods exhausted', () => {
      const timer = new PlayerTimer(100);
      const timedOutSpy = sinon.spy();
      timer.onTimedOut(timedOutSpy);
      timer.start();

      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);

      assert.ok(timedOutSpy.calledOnce, 'onTimedOut should be called exactly once');
      timer.destroy();
    });

    it('should fire onByoYomiUsed three times (once per period)', () => {
      const timer = new PlayerTimer(100);
      const byoYomiUsedSpy = sinon.spy();
      timer.onByoYomiUsed(byoYomiUsedSpy);
      timer.start();

      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);

      assert.strictEqual(byoYomiUsedSpy.callCount, 3);
      // Check the remaining periods passed to callback
      assert.ok(byoYomiUsedSpy.firstCall.calledWith(2));
      assert.ok(byoYomiUsedSpy.secondCall.calledWith(1));
      assert.ok(byoYomiUsedSpy.thirdCall.calledWith(0));
      timer.destroy();
    });

    it('should not accept start() after timedOut', () => {
      const timer = new PlayerTimer(100);
      timer.start();

      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);

      // Try to start again
      timer.start();
      const state = timer.getState();
      assert.strictEqual(state.running, false);
      assert.strictEqual(state.timedOut, true);
      timer.destroy();
    });

    it('currentByoYomiRemaining should be 0 after timeout', () => {
      const timer = new PlayerTimer(100);
      timer.start();

      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);

      const state = timer.getState();
      assert.strictEqual(state.currentByoYomiRemaining, 0);
      timer.destroy();
    });
  });

  // ============================================================
  // TimerManager: Dual player timeout management
  // ============================================================
  describe('TimerManager dual player timeout', () => {
    it('should track independent timeout states for each player', () => {
      const tm = new TimerManager(100);

      // Start both timers
      tm.startTurn();

      // Only exhaust black's time
      // We need to simulate only black running out
      // Stop white early
      clock.tick(50);
      tm.stopPlayer('white');

      // Let black exhaust all periods
      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);

      const state = tm.getState();
      assert.strictEqual(state.blackTimer.timedOut, true);
      assert.strictEqual(state.whiteTimer.timedOut, false);
      tm.destroy();
    });
  });

  // ============================================================
  // GameEngine: Auto-judge on timeout
  // ============================================================
  describe('GameEngine auto-judge on player timeout', () => {
    it('should end game and declare opponent winner when player times out', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 100 // Very short
      });

      engine.onGameEnd((result) => {
        assert.strictEqual(result.reason, GAME_END_REASON.TIMEOUT);
        // The winner should be the opponent of whoever timed out
        assert.ok(result.winner === 'black' || result.winner === 'white');
        assert.ok(result.scoring, 'Should include scoring data');
        engine.destroy();
        done();
      });

      engine.startGame();
      // White submits, black does not
      engine.submitMove('white', { pass: true });

      // Let black's time run out completely (base + 3 byoyomi)
      clock.tick(200);     // Base time
      clock.tick(30100);   // Byoyomi 1
      clock.tick(30100);   // Byoyomi 2
      clock.tick(30100);   // Byoyomi 3
    });

    it('black timeout → white wins', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 100
      });

      engine.onGameEnd((result) => {
        assert.strictEqual(result.winner, 'white');
        assert.strictEqual(result.reason, GAME_END_REASON.TIMEOUT);
        engine.destroy();
        done();
      });

      engine.startGame();
      engine.submitMove('white', { pass: true });

      // Black times out
      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);
    });

    it('white timeout → black wins', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 100
      });

      engine.onGameEnd((result) => {
        assert.strictEqual(result.winner, 'black');
        assert.strictEqual(result.reason, GAME_END_REASON.TIMEOUT);
        engine.destroy();
        done();
      });

      engine.startGame();
      engine.submitMove('black', { pass: true });

      // White times out
      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);
    });

    it('timeout winner overrides scoring winner', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 100
      });

      // Give black massive scoring advantage
      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 10; y++) {
          engine.board.set(x, y, STONE.BLACK);
        }
      }

      engine.onGameEnd((result) => {
        // Even though black has more territory, black times out → white wins
        assert.strictEqual(result.winner, 'white');
        assert.strictEqual(result.reason, GAME_END_REASON.TIMEOUT);
        engine.destroy();
        done();
      });

      engine.startGame();
      engine.submitMove('white', { pass: true });

      // Black times out
      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);
    });

    it('should fire onPlayerTimedOut callback', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 100
      });

      const timedOutSpy = sinon.spy();
      engine.onPlayerTimedOut(timedOutSpy);

      engine.onGameEnd((result) => {
        assert.ok(timedOutSpy.called, 'onPlayerTimedOut should have been called');
        engine.destroy();
        done();
      });

      engine.startGame();
      engine.submitMove('white', { pass: true });

      clock.tick(200);
      clock.tick(30100);
      clock.tick(30100);
      clock.tick(30100);
    });

    it('timed out player auto-passes on subsequent turns', () => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 100
      });

      // Track game end - prevent it from ending on timeout for this test
      let gameEnded = false;
      engine.onGameEnd(() => { gameEnded = true; });

      engine.startGame();

      // Manually simulate a player being timed out
      engine.timerManager.black.timedOut = true;
      engine.timerManager.black._running = false;

      // Clear pending moves and start next turn
      engine.pendingBlackMove = null;
      engine.pendingWhiteMove = null;

      // When starting a new turn, timed out player should auto-pass
      engine.startNextTurn();

      // Black should have been auto-assigned a pass
      assert.deepStrictEqual(engine.pendingBlackMove, { pass: true });
      engine.destroy();
    });

    it('both players timed out → game ends with scoring', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 100
      });

      engine.onGameEnd((result) => {
        // When both time out, we expect the game to end
        assert.ok(result.scoring, 'Should have scoring');
        assert.ok(result.winner, 'Should have a winner');
        engine.destroy();
        done();
      });

      // Manually set both timers as timed out
      engine.startGame();
      engine.timerManager.black.timedOut = true;
      engine.timerManager.white.timedOut = true;
      engine.timerManager.black._running = false;
      engine.timerManager.white._running = false;

      // Start next turn - both auto-pass → double pass → scoring
      engine.pendingBlackMove = null;
      engine.pendingWhiteMove = null;
      engine.startNextTurn();
    });
  });

  // ============================================================
  // Edge cases
  // ============================================================
  describe('edge cases', () => {
    it('zero base time should immediately enter byoyomi', () => {
      const timer = new PlayerTimer(0);
      timer.start();
      clock.tick(200);

      const state = timer.getState();
      assert.strictEqual(state.inByoYomi, true);
      assert.strictEqual(state.remainingBase, 0);
      timer.destroy();
    });

    it('should handle rapid start/stop in byoyomi', () => {
      const timer = new PlayerTimer(100);
      timer.start();
      clock.tick(200); // Enter byoyomi

      // Rapid start/stop cycles (simulating quick moves)
      for (let i = 0; i < 5; i++) {
        timer.stop();   // Move made - reset byoyomi
        timer.start();  // New turn
        clock.tick(5000); // 5 seconds
      }

      const state = timer.getState();
      assert.strictEqual(state.inByoYomi, true);
      assert.strictEqual(state.byoYomiPeriods, 3); // No periods consumed
      assert.strictEqual(state.timedOut, false);
      timer.destroy();
    });

    it('should correctly track byoyomi periods through intermittent stop/start', () => {
      const timer = new PlayerTimer(100);
      timer.start();
      clock.tick(200); // Enter byoyomi

      // Let 25 seconds pass (close to timeout)
      clock.tick(25000);
      timer.stop();

      const state = timer.getState();
      assert.strictEqual(state.byoYomiPeriods, 3);
      assert.strictEqual(state.currentByoYomiRemaining, BYOYOMI.TIME); // Reset
      timer.destroy();
    });
  });
});

// Test runner
if (require.main === module) {
  const Mocha = require('mocha');
  const mocha = new Mocha({ timeout: 10000 });
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}
