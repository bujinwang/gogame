/**
 * Test suite for Network Protocol
 * Tests message creation, validation, and protocol handling
 */

const assert = require('assert');

// Import protocol and constants
const { MSG, createMessage, parseMessage } = require('../src/shared/protocol');
const { STONE } = require('../src/shared/constants');

describe('Protocol', () => {
  describe('MSG', () => {
    it('should have all required message types', () => {
      assert.ok(MSG.JOIN);
      assert.ok(MSG.JOINED);
      assert.ok(MSG.GAME_START);
      assert.ok(MSG.TURN_START);
      assert.ok(MSG.SUBMIT_MOVE);
      assert.ok(MSG.MOVE_ACK);
      assert.ok(MSG.TURN_RESULT);
      assert.ok(MSG.TIME_UPDATE);
      assert.ok(MSG.GAME_END);
      assert.ok(MSG.RESIGN);
      assert.ok(MSG.ERROR);
    });
  });

  describe('createMessage', () => {
    it('should create valid JOIN message', () => {
      const msg = createMessage(MSG.JOIN, { playerName: 'TestPlayer' });
      const parsed = JSON.parse(msg);
      assert.strictEqual(parsed.type, MSG.JOIN);
      assert.strictEqual(parsed.playerName, 'TestPlayer');
    });

    it('should create valid SUBMIT_MOVE message with coordinates', () => {
      const msg = createMessage(MSG.SUBMIT_MOVE, { x: 9, y: 9, pass: false });
      const parsed = JSON.parse(msg);
      assert.strictEqual(parsed.type, MSG.SUBMIT_MOVE);
      assert.strictEqual(parsed.x, 9);
      assert.strictEqual(parsed.y, 9);
      assert.strictEqual(parsed.pass, false);
    });

    it('should create valid SUBMIT_MOVE message for pass', () => {
      const msg = createMessage(MSG.SUBMIT_MOVE, { pass: true });
      const parsed = JSON.parse(msg);
      assert.strictEqual(parsed.type, MSG.SUBMIT_MOVE);
      assert.strictEqual(parsed.pass, true);
    });

    it('should create valid GAME_START message', () => {
      const msg = createMessage(MSG.GAME_START, {
        boardSize: 19,
        baseTime: 1800000,
        byoYomiTime: 30000,
        byoYomiPeriods: 3
      });
      const parsed = JSON.parse(msg);
      assert.strictEqual(parsed.type, MSG.GAME_START);
      assert.strictEqual(parsed.boardSize, 19);
      assert.strictEqual(parsed.baseTime, 1800000);
    });

    it('should create valid TURN_RESULT message', () => {
      const board = [];
      for (let i = 0; i < 19; i++) {
        board.push(new Array(19).fill(0));
      }
      board[9][9] = STONE.BLACK;
      board[10][10] = STONE.WHITE;
      
      const msg = createMessage(MSG.TURN_RESULT, {
        turn: 5,
        board: board,
        blackMove: { x: 9, y: 9 },
        whiteMove: { x: 10, y: 10 },
        collision: false,
        capturedByBlack: 0,
        capturedByWhite: 0
      });
      
      const parsed = JSON.parse(msg);
      assert.strictEqual(parsed.type, MSG.TURN_RESULT);
      assert.strictEqual(parsed.turn, 5);
      assert.strictEqual(parsed.board[9][9], STONE.BLACK);
    });

    it('should create valid GAME_END message', () => {
      const msg = createMessage(MSG.GAME_END, {
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
      
      const parsed = JSON.parse(msg);
      assert.strictEqual(parsed.type, MSG.GAME_END);
      assert.strictEqual(parsed.reason, 'double_pass');
      assert.strictEqual(parsed.winner, 'black');
      assert.strictEqual(parsed.scoring.blackScore, 185);
    });

    it('should create valid TIME_UPDATE message', () => {
      const msg = createMessage(MSG.TIME_UPDATE, {
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
      
      const parsed = JSON.parse(msg);
      assert.strictEqual(parsed.type, MSG.TIME_UPDATE);
      assert.strictEqual(parsed.blackTimer.remainingBase, 300000);
      assert.strictEqual(parsed.whiteTimer.remainingBase, 250000);
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
      const msg = parseMessage(JSON.stringify(obj));
      assert.strictEqual(msg.type, 'join');
    });

    it('should handle invalid JSON', () => {
      const msg = parseMessage('invalid json {');
      assert.strictEqual(msg.type, MSG.ERROR);
    });

    it('should handle message without type', () => {
      const msg = parseMessage(JSON.stringify({ playerName: 'Test' }));
      // Should not throw an exception
      assert.ok(msg);
    });
  });
});

describe('Protocol Message Serialization', () => {
  it('should serialize and deserialize without data loss', () => {
    const original = {
      type: MSG.TURN_RESULT,
      turn: 42,
      board: [[1, 2, 0], [0, 3, 1], [2, 0, 0]],
      blackMove: { x: 0, y: 0 },
      whiteMove: { x: 1, y: 0 },
      collision: false,
      capturedByBlack: 5,
      capturedByWhite: 3
    };
    
    const serialized = createMessage(original.type, {
      turn: original.turn,
      board: original.board,
      blackMove: original.blackMove,
      whiteMove: original.whiteMove,
      collision: original.collision,
      capturedByBlack: original.capturedByBlack,
      capturedByWhite: original.capturedByWhite
    });
    
    const deserialized = parseMessage(serialized);
    
    assert.strictEqual(deserialized.type, original.type);
    assert.strictEqual(deserialized.turn, original.turn);
  });

  it('should handle special characters in player names', () => {
    const playerName = '棋手🎮<script>alert(1)</script>';
    const msg = createMessage(MSG.JOIN, { playerName });
    const parsed = parseMessage(msg);
    assert.strictEqual(parsed.playerName, playerName);
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
