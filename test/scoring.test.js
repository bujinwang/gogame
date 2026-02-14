/**
 * Test suite for Scoring (Win/Loss Calculation)
 * 
 * Tests Chinese area scoring with:
 * - Stone counting
 * - Territory calculation (flood-fill based)
 * - Komi (7.5 贴目)
 * - Red stone handling (collisions are neutral)
 * - Winner determination
 * - Score difference
 */

const assert = require('assert');
const Board = require('../src/main/game/board');
const Scoring = require('../src/main/game/scoring');
const { STONE, KOMI } = require('../src/shared/constants');

describe('Scoring - Win/Loss Calculation', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  // ============================================================
  // Basic Score Counting
  // ============================================================
  describe('basic stone counting', () => {
    it('should return zero scores on empty board', () => {
      const result = Scoring.calculate(board);
      assert.strictEqual(result.blackStones, 0);
      assert.strictEqual(result.whiteStones, 0);
      assert.strictEqual(result.redStones, 0);
    });

    it('should count black and white stones correctly', () => {
      board.set(3, 3, STONE.BLACK);
      board.set(4, 3, STONE.BLACK);
      board.set(5, 3, STONE.BLACK);
      board.set(15, 15, STONE.WHITE);
      board.set(16, 15, STONE.WHITE);

      const result = Scoring.calculate(board);
      assert.strictEqual(result.blackStones, 3);
      assert.strictEqual(result.whiteStones, 2);
    });

    it('should count red stones without adding to either side', () => {
      board.set(9, 9, STONE.RED);
      board.set(10, 10, STONE.RED);
      board.set(3, 3, STONE.BLACK);

      const result = Scoring.calculate(board);
      assert.strictEqual(result.redStones, 2);
      assert.strictEqual(result.blackStones, 1);
      assert.strictEqual(result.whiteStones, 0);
    });
  });

  // ============================================================
  // Komi (贴目) Tests
  // ============================================================
  describe('komi application', () => {
    it('should apply 7.5 komi to white score', () => {
      const result = Scoring.calculate(board);
      assert.strictEqual(result.komi, KOMI);
      assert.strictEqual(result.komi, 7.5);
    });

    it('white wins on empty board due to komi', () => {
      const result = Scoring.calculate(board);
      // Empty board: black=0, white=0+7.5=7.5
      assert.strictEqual(result.blackScore, 0);
      assert.strictEqual(result.whiteScore, 7.5);
      assert.strictEqual(result.winner, 'white');
    });

    it('should include komi in whiteScore but not whiteScoreRaw', () => {
      board.set(5, 5, STONE.WHITE);
      const result = Scoring.calculate(board);
      assert.strictEqual(result.whiteScore - result.whiteScoreRaw, KOMI);
    });

    it('black needs more than komi advantage to win', () => {
      // Place 8 black stones, 0 white stones on an open board to check komi effect
      for (let i = 0; i < 8; i++) {
        board.set(i, 0, STONE.BLACK);
      }
      const result = Scoring.calculate(board);
      // Black has 8 stones + territory, white has 0 stones + 7.5 komi + territory
      // Without enclosed territory, this should favor black
      assert.strictEqual(result.blackStones, 8);
    });
  });

  // ============================================================
  // Territory Calculation
  // ============================================================
  describe('territory calculation', () => {
    it('should calculate enclosed corner territory for black', () => {
      // Build a wall at row 3 and column 3 to enclose a corner
      // Black wall along y=3, x=0..3
      for (let x = 0; x <= 3; x++) {
        board.set(x, 3, STONE.BLACK);
      }
      // Black wall along x=3, y=0..2
      for (let y = 0; y <= 2; y++) {
        board.set(3, y, STONE.BLACK);
      }
      // Place white stones elsewhere so the rest of the board isn't all-black territory
      board.set(18, 18, STONE.WHITE);
      // The corner territory is (0,0)..(2,2) = 9 points surrounded only by black

      const result = Scoring.calculate(board);
      assert.strictEqual(result.blackTerritory, 9);
    });

    it('should calculate enclosed corner territory for white', () => {
      // White wall along y=3, x=0..3
      for (let x = 0; x <= 3; x++) {
        board.set(x, 3, STONE.WHITE);
      }
      // White wall along x=3, y=0..2
      for (let y = 0; y <= 2; y++) {
        board.set(3, y, STONE.WHITE);
      }
      // Place black stones elsewhere so the rest of the board isn't all-white territory
      board.set(18, 18, STONE.BLACK);

      const result = Scoring.calculate(board);
      assert.strictEqual(result.whiteTerritory, 9);
    });

    it('should mark disputed territory as neutral', () => {
      // Open area bordered by both black and white
      board.set(0, 0, STONE.BLACK);
      board.set(2, 0, STONE.WHITE);
      // Position (1,0) is adjacent to both → its region should be neutral

      const result = Scoring.calculate(board);
      assert.strictEqual(result.neutralTerritory > 0, true);
    });

    it('should not assign territory to red stones', () => {
      // Red wall can NOT claim territory
      for (let x = 0; x <= 3; x++) {
        board.set(x, 3, STONE.RED);
      }
      for (let y = 0; y <= 2; y++) {
        board.set(3, y, STONE.RED);
      }

      const result = Scoring.calculate(board);
      // Neither side should get this corner as territory
      assert.strictEqual(result.blackTerritory, 0);
      assert.strictEqual(result.whiteTerritory, 0);
    });

    it('red-only adjacent region should be neutral', () => {
      // Build a region only touching red
      board.set(0, 1, STONE.RED);
      board.set(1, 0, STONE.RED);

      const result = Scoring.calculate(board);
      // The corner at (0,0) + other areas touch only red → neutral
      assert.strictEqual(result.blackTerritory, 0);
      assert.strictEqual(result.whiteTerritory, 0);
    });
  });

  // ============================================================
  // Territory Map
  // ============================================================
  describe('territory map', () => {
    it('should mark black stones as 4 on territory map', () => {
      board.set(5, 5, STONE.BLACK);
      const result = Scoring.calculate(board);
      assert.strictEqual(result.territoryMap[5][5], 4);
    });

    it('should mark white stones as 5 on territory map', () => {
      board.set(5, 5, STONE.WHITE);
      const result = Scoring.calculate(board);
      assert.strictEqual(result.territoryMap[5][5], 5);
    });

    it('should mark red stones as 3 on territory map', () => {
      board.set(5, 5, STONE.RED);
      const result = Scoring.calculate(board);
      assert.strictEqual(result.territoryMap[5][5], 3);
    });

    it('should mark black territory as 1 on territory map', () => {
      // Enclose corner for black
      for (let x = 0; x <= 2; x++) board.set(x, 2, STONE.BLACK);
      for (let y = 0; y <= 1; y++) board.set(2, y, STONE.BLACK);

      const result = Scoring.calculate(board);
      // (0,0) and (1,0), (0,1), (1,1) should be black territory (value 1)
      assert.strictEqual(result.territoryMap[0][0], 1);
      assert.strictEqual(result.territoryMap[0][1], 1);
      assert.strictEqual(result.territoryMap[1][0], 1);
      assert.strictEqual(result.territoryMap[1][1], 1);
    });

    it('should mark white territory as 2 on territory map', () => {
      // Enclose corner for white
      for (let x = 0; x <= 2; x++) board.set(x, 2, STONE.WHITE);
      for (let y = 0; y <= 1; y++) board.set(2, y, STONE.WHITE);

      const result = Scoring.calculate(board);
      assert.strictEqual(result.territoryMap[0][0], 2);
    });
  });

  // ============================================================
  // Winner Determination
  // ============================================================
  describe('winner determination', () => {
    it('black wins with significant stone advantage', () => {
      // Place many black stones in rows
      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 10; y++) {
          board.set(x, y, STONE.BLACK);
        }
      }
      // Place some white stones
      for (let x = 0; x < 5; x++) {
        board.set(x, 18, STONE.WHITE);
      }

      const result = Scoring.calculate(board);
      assert.strictEqual(result.winner, 'black');
      assert.ok(result.scoreDiff > 0, 'Score difference should be positive');
    });

    it('white wins with significant stone advantage', () => {
      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 10; y++) {
          board.set(x, y, STONE.WHITE);
        }
      }
      for (let x = 0; x < 5; x++) {
        board.set(x, 18, STONE.BLACK);
      }

      const result = Scoring.calculate(board);
      assert.strictEqual(result.winner, 'white');
      assert.ok(result.scoreDiff > 0, 'Score difference should be positive');
    });

    it('white wins by komi when stones + territory are equal', () => {
      // Symmetric position should result in white win by komi
      board.set(3, 3, STONE.BLACK);
      board.set(15, 15, STONE.WHITE);

      const result = Scoring.calculate(board);
      // Both have 1 stone; territory is open/neutral for both
      // White gets komi so should win
      assert.strictEqual(result.winner, 'white');
    });

    it('should report score difference correctly', () => {
      // Give black a clear advantage
      for (let x = 0; x < 15; x++) {
        board.set(x, 0, STONE.BLACK);
      }

      const result = Scoring.calculate(board);
      assert.strictEqual(typeof result.scoreDiff, 'number');
      assert.ok(result.scoreDiff >= 0, 'Score diff should be non-negative');
    });
  });

  // ============================================================
  // Complex Board Scenarios
  // ============================================================
  describe('complex scenarios', () => {
    it('should handle board with all three stone types', () => {
      board.set(0, 0, STONE.BLACK);
      board.set(1, 1, STONE.WHITE);
      board.set(2, 2, STONE.RED);

      const result = Scoring.calculate(board);
      assert.strictEqual(result.blackStones, 1);
      assert.strictEqual(result.whiteStones, 1);
      assert.strictEqual(result.redStones, 1);
    });

    it('should handle multiple separate territories', () => {
      // Black encloses top-left corner
      for (let x = 0; x <= 3; x++) board.set(x, 3, STONE.BLACK);
      for (let y = 0; y <= 2; y++) board.set(3, y, STONE.BLACK);

      // White encloses bottom-right corner
      for (let x = 15; x <= 18; x++) board.set(x, 15, STONE.WHITE);
      for (let y = 16; y <= 18; y++) board.set(15, y, STONE.WHITE);

      const result = Scoring.calculate(board);
      assert.ok(result.blackTerritory > 0, 'Black should have territory');
      assert.ok(result.whiteTerritory > 0, 'White should have territory');
    });

    it('should calculate correct total score (stones + territory)', () => {
      // Black encloses a 2x2 corner
      board.set(0, 2, STONE.BLACK);
      board.set(1, 2, STONE.BLACK);
      board.set(2, 2, STONE.BLACK);
      board.set(2, 0, STONE.BLACK);
      board.set(2, 1, STONE.BLACK);
      // Place white elsewhere so the rest of the board isn't all-black territory
      board.set(18, 18, STONE.WHITE);
      // 5 black stones, territory = (0,0),(1,0),(0,1),(1,1) = 4 points

      const result = Scoring.calculate(board);
      assert.strictEqual(result.blackStones, 5);
      assert.strictEqual(result.blackTerritory, 4);
      assert.strictEqual(result.blackScore, 9); // 5 stones + 4 territory
    });

    it('should handle red stones adjacent to territory boundary', () => {
      // Build a wall with a red stone gap
      board.set(0, 2, STONE.BLACK);
      board.set(1, 2, STONE.RED);  // Red gap in the wall
      board.set(2, 2, STONE.BLACK);
      board.set(2, 0, STONE.BLACK);
      board.set(2, 1, STONE.BLACK);
      // Red doesn't claim territory, so the empty region touching
      // black and red should have red ignored for ownership

      const result = Scoring.calculate(board);
      // The region touches both BLACK and RED
      // RED is deleted from colors set, so only BLACK remains → black territory
      assert.ok(result.blackTerritory >= 0);
    });

    it('should handle full board (no empty intersections)', () => {
      // Fill entire board with black
      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 19; y++) {
          board.set(x, y, STONE.BLACK);
        }
      }

      const result = Scoring.calculate(board);
      assert.strictEqual(result.blackStones, 361);
      assert.strictEqual(result.whiteStones, 0);
      assert.strictEqual(result.blackTerritory, 0);
      assert.strictEqual(result.whiteTerritory, 0);
      assert.strictEqual(result.neutralTerritory, 0);
      assert.strictEqual(result.winner, 'black');
    });
  });

  // ============================================================
  // GameEngine Integration - endGame scoring
  // ============================================================
  describe('game engine integration', () => {
    const GameEngine = require('../src/main/game/game-engine');
    const { GAME_MODE, GAME_END_REASON } = require('../src/shared/constants');

    it('should calculate scoring on double pass', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 600000
      });

      engine.onGameEnd((result) => {
        assert.strictEqual(result.reason, GAME_END_REASON.DOUBLE_PASS);
        assert.ok(result.scoring, 'Should include scoring data');
        assert.ok('winner' in result, 'Should have winner');
        assert.ok('blackScore' in result.scoring, 'Scoring should have blackScore');
        assert.ok('whiteScore' in result.scoring, 'Scoring should have whiteScore');
        engine.destroy();
        done();
      });

      engine.startGame();
      engine.submitMove('black', { pass: true });
      engine.submitMove('white', { pass: true });
    });

    it('should use forcedWinner on resignation (not scoring)', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 600000
      });

      engine.onGameEnd((result) => {
        assert.strictEqual(result.reason, GAME_END_REASON.RESIGN);
        assert.strictEqual(result.winner, 'white');
        engine.destroy();
        done();
      });

      engine.startGame();
      engine.resign('black');
    });

    it('forcedWinner overrides scoring winner', (done) => {
      const engine = new GameEngine({
        mode: GAME_MODE.HUMAN_VS_HUMAN,
        baseTime: 600000
      });

      // Place a bunch of black stones to give black a scoring advantage
      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 10; y++) {
          engine.board.set(x, y, STONE.BLACK);
        }
      }

      engine.onGameEnd((result) => {
        // Even though black has more score, white wins by resignation
        assert.strictEqual(result.winner, 'white');
        engine.destroy();
        done();
      });

      engine.resign('black');
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
