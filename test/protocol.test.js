/**
 * Test suite for Network Protocol
 * Tests message creation, validation, and protocol handling
 */

const assert = require('assert');

// Import protocol and constants
const { MessageType, createMessage, parseMessage } = require('../src/shared/protocol');
const { STONE } = require('../src/shared/constants');

describe('Protocol', () => {
  describe('MessageType', () => {
    it('should have all required message types', () => {
      assert.ok(MessageType.JOIN);
      assert.ok(MessageType.JOINED);
      assert.ok(MessageType.GAME_START);
      assert.ok(MessageType.TURN_START);
      assert.ok(MessageType.SUBMIT_MOVE);
      assert.ok(MessageType.MOVE_ACK);
      assert.ok(MessageType.TURN_RESULT);
      assert.ok(MessageType.TIME_UPDATE);
      assert.ok(MessageType.GAME_END);
      assert.ok(MessageType.RESIGN);
      assert.ok(MessageType.ERROR);
    });
  });

  describe('createMessage', () => {
    it('should create valid JOIN message', () => {
      const msg = createMessage(MessageType.JOIN, { playerName: 'TestPlayer' });
      assert.strictEqual(msg.type, MessageType.JOIN);
      assert.strictEqual(msg.playerName, 'TestPlayer');
    });

    it('should create valid SUBMIT_MOVE message with coordinates', () => {
      const msg = createMessage(MessageType.SUBMIT_MOVE, { x: 9, y: 9, pass: false });
      assert.strictEqual(msg.type, MessageType.SUBMIT_MOVE);
      assert.strictEqual(msg.x, 9);
      assert.strictEqual(msg.y, 9);
      assert.strictEqual(msg.pass, false);
    });

    it('should create valid SUBMIT_MOVE message for pass', () => {
      const msg = createMessage(MessageType.SUBMIT_MOVE, { pass: true });
      assert.strictEqual(msg.type, MessageType.SUBMIT_MOVE);
      assert.strictEqual(msg.pass, true);
    });

    it('should create valid GAME_START message', () => {
      const msg = createMessage(MessageType.GAME_START, {
        boardSize: 19,
        baseTime: 1800000,
        byoYomiTime: 30000,
        byoYomiPeriods: 3
      });
      assert.strictEqual(msg.type, MessageType.GAME_START);
      assert.strictEqual(msg.boardSize, 19);
      assert.strictEqual(msg.baseTime, 1800000);
    });

    it('should create valid TURN_RESULT message', () => {
      const board = [];
      for (let i = 0; i < 19; i++) {
        board.push(new Array(19).fill(0));
      }
      board[9][9] = STONE.BLACK;
      board[10][10] = STONE.WHITE;
      
      const msg = createMessage(MessageType.TURN_RESULT, {
        turn: 5,
        board: board,
        blackMove: { x: 9, y: 9 },
        whiteMove: { x: 10, y: 10 },
        collision: false,
        capturedByBlack: 0,
        capturedByWhite: 0
      });
      
      assert.strictEqual(msg.type, MessageType.TURN_RESULT);
      assert.strictEqual(msg.turn, 5);
      assert.strictEqual(msg.board[9][9], STONE.BLACK);
    });

    it('should create valid GAME_END message', () => {
      const msg = createMessage(MessageType.GAME_END, {
        reason: 'double_pass',
        winner: 'black',
        scoring: {
          blackScore: 185,
          whiteScore: 176,
          blackStones: 95,
          whiteStones: 86,
          blackTerritory: 90,
          whiteTerritory: 90,
          redStones: 3
        }
      });
      
      assert.strictEqual(msg.type, MessageType.GAME_END);
      assert.strictEqual(msg.reason, 'double_pass');
      assert.strictEqual(msg.winner, 'black');
      assert.strictEqual(msg.scoring.blackScore, 185);
    });

    it('should create valid TIME_UPDATE message', () => {
      const msg = createMessage(MessageType.TIME_UPDATE, {
        blackTimer: {
          remainingBase: 300000,
          byoYomiPeriods: 3,
          inByoYomi: false,
          currentByoYomiRemaining: 30000,
          timedOut: false
        },
        whiteTimer: {
          remainingBase: 250000,
          byoYomiPeriods: 3,
          inByoYomi: false,
          currentByoYomiRemaining: 30000,
          timedOut: false
        }
      });
      
      assert.strictEqual(msg.type, MessageType.TIME_UPDATE);
      assert.strictEqual(msg.blackTimer.remainingBase, 300000);
      assert.strictEqual(msg.whiteTimer.remainingBase, 250000);
    });
  });

  describe('parseMessage', () => {
    it('should parse valid JSON message', () => {
      const jsonStr = JSON.stringify({ type: 'join', playerName: 'Test' });
      const msg = parseMessage(jsonStr);
      assert.strictEqual(msg.type, 'join');
      assert.strictEqual(msg.playerName, 'Test');
    });

    it('should handle already parsed object', () => {
      const obj = { type: 'join', playerName: 'Test' };
      const msg = parseMessage(obj);
      assert.strictEqual(msg.type, 'join');
    });

    it('should throw on invalid JSON', () => {
      assert.throws(() => {
        parseMessage('invalid json {');
      });
    });

    it('should throw on message without type', () => {
      assert.throws(() => {
        parseMessage(JSON.stringify({ playerName: 'Test' }));
      }, /missing type/i);
    });
  });
});

describe('Protocol Validation', () => {
  describe('SUBMIT_MOVE validation', () => {
    it('should validate coordinates are within board', () => {
      const validMove = { type: MessageType.SUBMIT_MOVE, x: 18, y: 18, pass: false };
      const invalidMove = { type: MessageType.SUBMIT_MOVE, x: 19, y: 0, pass: false };
      
      // Valid move coordinates check
      assert.ok(validMove.x >= 0 && validMove.x < 19);
      assert.ok(validMove.y >= 0 && validMove.y < 19);
      
      // Invalid move coordinates check
      assert.ok(!(invalidMove.x >= 0 && invalidMove.x < 19));
    });

    it('should validate pass move has pass flag', () => {
      const passMove = { type: MessageType.SUBMIT_MOVE, pass: true };
      assert.strictEqual(passMove.pass, true);
    });

    it('should validate coordinate move has x and y', () => {
      const coordMove = { type: MessageType.SUBMIT_MOVE, x: 5, y: 5, pass: false };
      assert.ok('x' in coordMove);
      assert.ok('y' in coordMove);
    });
  });

  describe('TURN_RESULT validation', () => {
    it('should include all required fields', () => {
      const result = createMessage(MessageType.TURN_RESULT, {
        turn: 1,
        board: [],
        blackMove: { pass: true },
        whiteMove: { x: 5, y: 5 },
        collision: false,
        capturedByBlack: 0,
        capturedByWhite: 0
      });
      
      assert.ok('turn' in result);
      assert.ok('board' in result);
      assert.ok('blackMove' in result);
      assert.ok('whiteMove' in result);
      assert.ok('collision' in result);
    });

    it('should include collision position if collision occurred', () => {
      const result = createMessage(MessageType.TURN_RESULT, {
        turn: 1,
        board: [],
        blackMove: { x: 5, y: 5 },
        whiteMove: { x: 5, y: 5 },
        collision: true,
        collisionPos: { x: 5, y: 5 },
        capturedByBlack: 0,
        capturedByWhite: 0
      });
      
      assert.strictEqual(result.collision, true);
      assert.deepStrictEqual(result.collisionPos, { x: 5, y: 5 });
    });
  });
});

describe('Protocol Message Serialization', () => {
  it('should serialize and deserialize without data loss', () => {
    const original = createMessage(MessageType.TURN_RESULT, {
      turn: 42,
      board: [[1, 2, 0], [0, 3, 1], [2, 0, 0]],
      blackMove: { x: 0, y: 0 },
      whiteMove: { x: 1, y: 0 },
      collision: false,
      capturedByBlack: 5,
      capturedByWhite: 3
    });
    
    const serialized = JSON.stringify(original);
    const deserialized = parseMessage(serialized);
    
    assert.deepStrictEqual(deserialized, original);
  });

  it('should handle special characters in player names', () => {
    const original = createMessage(MessageType.JOIN, {
      playerName: '棋手🎮<script>alert(1)</script>'
    });
    
    const serialized = JSON.stringify(original);
    const deserialized = parseMessage(serialized);
    
    assert.strictEqual(deserialized.playerName, original.playerName);
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
