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

    it('should return -1 for out of bounds coordinates', () => {
      assert.strictEqual(board.get(-1, 0), -1);
      assert.strictEqual(board.get(0, -1), -1);
      assert.strictEqual(board.get(19, 0), -1);
      assert.strictEqual(board.get(0, 19), -1);
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

  describe('isEmpty', () => {
    it('should return true for empty positions', () => {
      assert.strictEqual(board.isEmpty(0, 0), true);
    });

    it('should return false for occupied positions', () => {
      board.set(5, 5, STONE.BLACK);
      assert.strictEqual(board.isEmpty(5, 5), false);
    });
  });

  describe('getAdjacentPositions', () => {
    it('should return 4 neighbors for center position', () => {
      const neighbors = board.getAdjacentPositions(9, 9);
      assert.strictEqual(neighbors.length, 4);
    });

    it('should return 2 neighbors for corner position', () => {
      const neighbors = board.getAdjacentPositions(0, 0);
      assert.strictEqual(neighbors.length, 2);
    });

    it('should return 3 neighbors for edge position', () => {
      const neighbors = board.getAdjacentPositions(0, 9);
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
    it('should count liberties for a group', () => {
      board.set(9, 9, STONE.BLACK);
      const group = board.getGroup(9, 9);
      const liberties = board.countLiberties(group);
      assert.strictEqual(liberties, 4);
    });

    it('should count reduced liberties when surrounded', () => {
      board.set(9, 9, STONE.BLACK);
      board.set(8, 9, STONE.WHITE);
      board.set(10, 9, STONE.WHITE);
      const group = board.getGroup(9, 9);
      const liberties = board.countLiberties(group);
      assert.strictEqual(liberties, 2);
    });

    it('should count liberties for connected group', () => {
      board.set(9, 9, STONE.BLACK);
      board.set(10, 9, STONE.BLACK);
      const group = board.getGroup(9, 9);
      // Group has 6 liberties (8 shared - 2 connecting points)
      const liberties = board.countLiberties(group);
      assert.strictEqual(liberties, 6);
    });
  });

  describe('getLibertiesPositions', () => {
    it('should return liberty positions for a group', () => {
      board.set(9, 9, STONE.BLACK);
      const group = board.getGroup(9, 9);
      const liberties = board.getLibertiesPositions(group);
      assert.strictEqual(liberties.length, 4);
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

  describe('removeStones', () => {
    it('should remove stones from the board', () => {
      board.set(5, 5, STONE.BLACK);
      assert.strictEqual(board.get(5, 5), STONE.BLACK);
      
      board.removeStones([{ x: 5, y: 5 }]);
      assert.strictEqual(board.get(5, 5), STONE.EMPTY);
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

  describe('serialize/deserialize', () => {
    it('should serialize and deserialize board state', () => {
      board.set(5, 5, STONE.BLACK);
      board.set(10, 10, STONE.WHITE);
      
      const serialized = board.serialize();
      const newBoard = new Board();
      newBoard.deserialize(serialized);
      
      assert.strictEqual(newBoard.get(5, 5), STONE.BLACK);
      assert.strictEqual(newBoard.get(10, 10), STONE.WHITE);
    });
  });

  describe('countStones', () => {
    it('should count stones of each color', () => {
      board.set(0, 0, STONE.BLACK);
      board.set(1, 0, STONE.BLACK);
      board.set(2, 0, STONE.WHITE);
      board.set(3, 0, STONE.RED);
      
      const counts = board.countStones();
      assert.strictEqual(counts.black, 2);
      assert.strictEqual(counts.white, 1);
      assert.strictEqual(counts.red, 1);
      assert.strictEqual(counts.empty, 19*19 - 4);
    });
  });
});

describe('Rules', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  describe('validateMove', () => {
    it('should allow valid move on empty intersection', () => {
      const result = Rules.validateMove(board, 9, 9, STONE.BLACK);
      assert.strictEqual(result.valid, true);
    });

    it('should reject move on occupied intersection', () => {
      board.set(9, 9, STONE.WHITE);
      const result = Rules.validateMove(board, 9, 9, STONE.BLACK);
      assert.strictEqual(result.valid, false);
    });

    it('should reject suicide move', () => {
      // Create almost-surrounded position
      board.set(0, 1, STONE.WHITE);
      board.set(1, 0, STONE.WHITE);
      
      // Playing at 0,0 would be suicide
      const result = Rules.validateMove(board, 0, 0, STONE.BLACK);
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
      const result = Rules.validateMove(board, 0, 0, STONE.BLACK);
      assert.strictEqual(result.valid, true);
    });
  });

  describe('preValidateMove', () => {
    it('should allow valid move on empty intersection', () => {
      const result = Rules.preValidateMove(board, 9, 9, STONE.BLACK);
      assert.strictEqual(result.valid, true);
    });

    it('should reject move on occupied intersection', () => {
      board.set(9, 9, STONE.WHITE);
      const result = Rules.preValidateMove(board, 9, 9, STONE.BLACK);
      assert.strictEqual(result.valid, false);
    });

    it('should reject suicide move', () => {
      // Create almost-surrounded position
      board.set(0, 1, STONE.WHITE);
      board.set(1, 0, STONE.WHITE);
      
      // Playing at 0,0 would be suicide
      const result = Rules.preValidateMove(board, 0, 0, STONE.BLACK);
      assert.strictEqual(result.valid, false);
    });
  });

  describe('resolveTurn', () => {
    it('should place both stones on different intersections', () => {
      const blackMove = { x: 3, y: 3, pass: false };
      const whiteMove = { x: 15, y: 15, pass: false };
      
      const result = Rules.resolveTurn(board, blackMove, whiteMove);
      
      assert.strictEqual(result.collision, false);
      assert.strictEqual(board.get(3, 3), STONE.BLACK);
      assert.strictEqual(board.get(15, 15), STONE.WHITE);
    });

    it('should create RED stone on collision', () => {
      const blackMove = { x: 9, y: 9, pass: false };
      const whiteMove = { x: 9, y: 9, pass: false };
      
      const result = Rules.resolveTurn(board, blackMove, whiteMove);
      
      assert.strictEqual(result.collision, true);
      assert.strictEqual(result.collisionPos.x, 9);
      assert.strictEqual(result.collisionPos.y, 9);
      assert.strictEqual(board.get(9, 9), STONE.RED);
    });

    it('should handle double pass', () => {
      const blackMove = { pass: true };
      const whiteMove = { pass: true };
      
      const result = Rules.resolveTurn(board, blackMove, whiteMove);
      
      assert.strictEqual(result.bothPassed, true);
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
      const blackMove = { x: 5, y: 6, pass: false }; // Captures white
      const whiteMove = { x: 1, y: 1, pass: false }; // Captures black
      
      const result = Rules.resolveTurn(board, blackMove, whiteMove);
      
      assert.strictEqual(result.capturedBlack.length > 0, true);
      assert.strictEqual(result.capturedWhite.length > 0, true);
    });
  });
});

describe('Scoring', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  describe('calculate', () => {
    it('should count stones correctly', () => {
      board.set(0, 0, STONE.BLACK);
      board.set(0, 1, STONE.BLACK);
      board.set(1, 0, STONE.WHITE);
      
      const score = Scoring.calculate(board);
      
      assert.strictEqual(score.blackStones, 2);
      assert.strictEqual(score.whiteStones, 1);
      assert.strictEqual(score.blackScore, 2);
      assert.strictEqual(score.whiteScore, 1);
    });

    it('should not count RED stones for either player', () => {
      board.set(0, 0, STONE.RED);
      board.set(1, 0, STONE.BLACK);
      
      const score = Scoring.calculate(board);
      
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
      
      const score = Scoring.calculate(board);
      
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
      
      const score = Scoring.calculate(board);
      
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
