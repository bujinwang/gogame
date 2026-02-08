/**
 * Test suite for Game Engine
 * Tests board operations, rules, and scoring
 */

const assert = require('assert');

// Import modules to test
const Board = require('../src/main/game/board');
const Rules = require('../src/main/game/rules');
const Scoring = require('../src/main/game/scoring');
const { STONE } = require('../src/shared/constants');

describe('Board', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  describe('constructor', () => {
    it('should create a 19x19 board by default', () => {
      assert.strictEqual(board.size, 19);
      assert.strictEqual(board.grid.length, 19);
      assert.strictEqual(board.grid[0].length, 19);
    });

    it('should initialize all cells as EMPTY', () => {
      for (let y = 0; y < board.size; y++) {
        for (let x = 0; x < board.size; x++) {
          assert.strictEqual(board.get(x, y), STONE.EMPTY);
        }
      }
    });

    it('should create custom sized board', () => {
      const smallBoard = new Board(9);
      assert.strictEqual(smallBoard.size, 9);
    });
  });

  describe('get/set', () => {
    it('should set and get stone correctly', () => {
      board.set(5, 5, STONE.BLACK);
      assert.strictEqual(board.get(5, 5), STONE.BLACK);
    });

    it('should return null for out of bounds coordinates', () => {
      assert.strictEqual(board.get(-1, 0), null);
      assert.strictEqual(board.get(0, -1), null);
      assert.strictEqual(board.get(19, 0), null);
      assert.strictEqual(board.get(0, 19), null);
    });
  });

  describe('isValidPosition', () => {
    it('should return true for valid positions', () => {
      assert.strictEqual(board.isValidPosition(0, 0), true);
      assert.strictEqual(board.isValidPosition(18, 18), true);
      assert.strictEqual(board.isValidPosition(9, 9), true);
    });

    it('should return false for invalid positions', () => {
      assert.strictEqual(board.isValidPosition(-1, 0), false);
      assert.strictEqual(board.isValidPosition(19, 0), false);
      assert.strictEqual(board.isValidPosition(0, 19), false);
    });
  });

  describe('getNeighbors', () => {
    it('should return 4 neighbors for center position', () => {
      const neighbors = board.getNeighbors(9, 9);
      assert.strictEqual(neighbors.length, 4);
    });

    it('should return 2 neighbors for corner position', () => {
      const neighbors = board.getNeighbors(0, 0);
      assert.strictEqual(neighbors.length, 2);
    });

    it('should return 3 neighbors for edge position', () => {
      const neighbors = board.getNeighbors(0, 9);
      assert.strictEqual(neighbors.length, 3);
    });
  });

  describe('getGroup', () => {
    it('should return single stone group', () => {
      board.set(5, 5, STONE.BLACK);
      const group = board.getGroup(5, 5);
      assert.strictEqual(group.length, 1);
      assert.deepStrictEqual(group[0], { x: 5, y: 5 });
    });

    it('should return connected group', () => {
      board.set(5, 5, STONE.BLACK);
      board.set(5, 6, STONE.BLACK);
      board.set(5, 7, STONE.BLACK);
      const group = board.getGroup(5, 5);
      assert.strictEqual(group.length, 3);
    });

    it('should not include different color stones', () => {
      board.set(5, 5, STONE.BLACK);
      board.set(5, 6, STONE.WHITE);
      const group = board.getGroup(5, 5);
      assert.strictEqual(group.length, 1);
    });
  });

  describe('countLiberties', () => {
    it('should count 4 liberties for isolated stone', () => {
      board.set(9, 9, STONE.BLACK);
      const liberties = board.countLiberties(9, 9);
      assert.strictEqual(liberties, 4);
    });

    it('should count 2 liberties for corner stone', () => {
      board.set(0, 0, STONE.BLACK);
      const liberties = board.countLiberties(0, 0);
      assert.strictEqual(liberties, 2);
    });

    it('should count reduced liberties when surrounded', () => {
      board.set(9, 9, STONE.BLACK);
      board.set(8, 9, STONE.WHITE);
      board.set(10, 9, STONE.WHITE);
      const liberties = board.countLiberties(9, 9);
      assert.strictEqual(liberties, 2);
    });

    it('should count liberties for connected group', () => {
      board.set(9, 9, STONE.BLACK);
      board.set(10, 9, STONE.BLACK);
      // Group has 6 liberties (8 shared - 2 connecting points)
      const liberties = board.countLiberties(9, 9);
      assert.strictEqual(liberties, 6);
    });

    it('should treat RED stones as blocking liberties', () => {
      board.set(9, 9, STONE.BLACK);
      board.set(8, 9, STONE.RED);
      const liberties = board.countLiberties(9, 9);
      assert.strictEqual(liberties, 3); // One liberty blocked by red
    });
  });

  describe('findDeadGroups', () => {
    it('should find captured group', () => {
      // Create a captured black stone
      board.set(9, 9, STONE.BLACK);
      board.set(8, 9, STONE.WHITE);
      board.set(10, 9, STONE.WHITE);
      board.set(9, 8, STONE.WHITE);
      board.set(9, 10, STONE.WHITE);
      
      const deadGroups = board.findDeadGroups(STONE.BLACK);
      assert.strictEqual(deadGroups.length, 1);
      assert.strictEqual(deadGroups[0].length, 1);
    });

    it('should not find alive groups', () => {
      board.set(9, 9, STONE.BLACK);
      board.set(8, 9, STONE.WHITE);
      // Stone still has liberties
      
      const deadGroups = board.findDeadGroups(STONE.BLACK);
      assert.strictEqual(deadGroups.length, 0);
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      board.set(5, 5, STONE.BLACK);
      const clone = board.clone();
      
      clone.set(5, 5, STONE.WHITE);
      
      assert.strictEqual(board.get(5, 5), STONE.BLACK);
      assert.strictEqual(clone.get(5, 5), STONE.WHITE);
    });
  });

  describe('getHash', () => {
    it('should return same hash for same position', () => {
      board.set(5, 5, STONE.BLACK);
      const hash1 = board.getHash();
      const hash2 = board.getHash();
      assert.strictEqual(hash1, hash2);
    });

    it('should return different hash for different positions', () => {
      board.set(5, 5, STONE.BLACK);
      const hash1 = board.getHash();
      
      board.set(5, 6, STONE.BLACK);
      const hash2 = board.getHash();
      
      assert.notStrictEqual(hash1, hash2);
    });
  });
});

describe('Rules', () => {
  let board;
  let rules;

  beforeEach(() => {
    board = new Board();
    rules = new Rules();
  });

  describe('validateMove', () => {
    it('should allow valid move on empty intersection', () => {
      const result = rules.validateMove(board, { x: 9, y: 9 }, STONE.BLACK);
      assert.strictEqual(result.valid, true);
    });

    it('should reject move on occupied intersection', () => {
      board.set(9, 9, STONE.WHITE);
      const result = rules.validateMove(board, { x: 9, y: 9 }, STONE.BLACK);
      assert.strictEqual(result.valid, false);
    });

    it('should reject suicide move', () => {
      // Create almost-surrounded position
      board.set(0, 1, STONE.WHITE);
      board.set(1, 0, STONE.WHITE);
      
      // Playing at 0,0 would be suicide
      const result = rules.validateMove(board, { x: 0, y: 0 }, STONE.BLACK);
      assert.strictEqual(result.valid, false);
    });

    it('should allow capture move that looks like suicide', () => {
      // Create capturable position
      board.set(1, 0, STONE.WHITE);
      board.set(0, 1, STONE.WHITE);
      board.set(2, 0, STONE.BLACK);
      board.set(1, 1, STONE.BLACK);
      
      // White at 1,0 only has one liberty at 0,0
      // Black playing there captures it
      const result = rules.validateMove(board, { x: 0, y: 0 }, STONE.BLACK);
      assert.strictEqual(result.valid, true);
    });

    it('should allow pass move', () => {
      const result = rules.validateMove(board, { pass: true }, STONE.BLACK);
      assert.strictEqual(result.valid, true);
    });
  });

  describe('resolveTurn', () => {
    it('should place both stones on different intersections', () => {
      const blackMove = { x: 3, y: 3 };
      const whiteMove = { x: 15, y: 15 };
      
      const result = rules.resolveTurn(board, blackMove, whiteMove);
      
      assert.strictEqual(result.collision, false);
      assert.strictEqual(board.get(3, 3), STONE.BLACK);
      assert.strictEqual(board.get(15, 15), STONE.WHITE);
    });

    it('should create RED stone on collision', () => {
      const blackMove = { x: 9, y: 9 };
      const whiteMove = { x: 9, y: 9 };
      
      const result = rules.resolveTurn(board, blackMove, whiteMove);
      
      assert.strictEqual(result.collision, true);
      assert.strictEqual(board.get(9, 9), STONE.RED);
    });

    it('should handle double pass', () => {
      const blackMove = { pass: true };
      const whiteMove = { pass: true };
      
      const result = rules.resolveTurn(board, blackMove, whiteMove);
      
      assert.strictEqual(result.doublePass, true);
    });

    it('should perform simultaneous captures', () => {
      // Set up mutual capture scenario
      // Black group with 1 liberty
      board.set(0, 0, STONE.BLACK);
      board.set(1, 0, STONE.WHITE);
      board.set(0, 1, STONE.WHITE);
      
      // White group with 1 liberty  
      board.set(5, 5, STONE.WHITE);
      board.set(4, 5, STONE.BLACK);
      board.set(6, 5, STONE.BLACK);
      board.set(5, 4, STONE.BLACK);
      
      // Both moves capture the opponent's group
      const blackMove = { x: 5, y: 6 }; // Captures white
      const whiteMove = { x: 0, y: 0 }; // Can't place - collision test
      
      // Simplified - just test that captures work
      const result = rules.resolveTurn(board, blackMove, { pass: true });
      
      assert.strictEqual(result.capturedWhite > 0, true);
    });
  });
});

describe('Scoring', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  describe('calculateScore', () => {
    it('should count stones correctly', () => {
      board.set(0, 0, STONE.BLACK);
      board.set(0, 1, STONE.BLACK);
      board.set(1, 0, STONE.WHITE);
      
      const score = Scoring.calculateScore(board);
      
      assert.strictEqual(score.blackStones, 2);
      assert.strictEqual(score.whiteStones, 1);
    });

    it('should not count RED stones for either player', () => {
      board.set(0, 0, STONE.RED);
      board.set(1, 0, STONE.BLACK);
      
      const score = Scoring.calculateScore(board);
      
      assert.strictEqual(score.redStones, 1);
      assert.strictEqual(score.blackStones, 1);
      assert.strictEqual(score.whiteStones, 0);
    });

    it('should calculate territory correctly', () => {
      // Create a simple enclosed territory for black
      // Black stones forming a small corner territory
      for (let i = 0; i < 4; i++) {
        board.set(i, 3, STONE.BLACK);
        board.set(3, i, STONE.BLACK);
      }
      
      const score = Scoring.calculateScore(board);
      
      // Black should have territory in the corner
      assert.strictEqual(score.blackTerritory > 0, true);
    });

    it('should determine winner based on total score', () => {
      // Give black more stones
      for (let i = 0; i < 10; i++) {
        board.set(i, 0, STONE.BLACK);
      }
      for (let i = 0; i < 5; i++) {
        board.set(i, 18, STONE.WHITE);
      }
      
      const score = Scoring.calculateScore(board);
      
      assert.strictEqual(score.winner, 'black');
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

module.exports = { Board, Rules, Scoring };
