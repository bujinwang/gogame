/**
 * Rules - Move validation and capture logic for Simultaneous Go
 */

const { STONE } = require('../../shared/constants');
const Board = require('./board');

class Rules {
  /**
   * Validate if a move is legal for a player
   * Validation is done on the player's visible board state
   * @param {Board} board - Current board state
   * @param {number} x - Column
   * @param {number} y - Row
   * @param {number} color - STONE.BLACK or STONE.WHITE
   * @param {Set<string>} boardHistory - Set of previous board hashes (for superko)
   * @returns {{valid: boolean, reason?: string}}
   */
  static validateMove(board, x, y, color, boardHistory = new Set()) {
    // Check bounds
    if (!board.isValidPosition(x, y)) {
      return { valid: false, reason: 'Position out of bounds' };
    }

    // Check if position is empty
    if (!board.isEmpty(x, y)) {
      return { valid: false, reason: 'Position is occupied' };
    }

    // Simulate the move to check for suicide
    const testBoard = board.clone();
    testBoard.set(x, y, color);

    // Check if this move captures any opponent stones
    const opponent = color === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
    const opponentCaptures = testBoard.findDeadGroups(opponent);

    // Remove captured opponent stones
    for (const group of opponentCaptures) {
      testBoard.removeStones(group);
    }

    // Check if the placed stone's group has liberties after captures
    const ownGroup = testBoard.getGroup(x, y);
    const ownLiberties = testBoard.countLiberties(ownGroup);

    if (ownLiberties === 0 && opponentCaptures.length === 0) {
      return { valid: false, reason: 'Suicide move is not allowed' };
    }

    // Superko check - the resulting board state must not repeat
    if (boardHistory.size > 0) {
      const newHash = testBoard.getHash();
      if (boardHistory.has(newHash)) {
        return { valid: false, reason: 'Superko violation - board state would repeat' };
      }
    }

    return { valid: true };
  }

  /**
   * Resolve a simultaneous turn
   * Both players have submitted their moves - now resolve the board state
   * 
   * @param {Board} board - Current board state (will be modified)
   * @param {{x: number, y: number, pass: boolean}} blackMove
   * @param {{x: number, y: number, pass: boolean}} whiteMove
   * @returns {{
   *   board: Board,
   *   collision: boolean,
   *   collisionPos: {x: number, y: number}|null,
   *   capturedBlack: Array<{x: number, y: number}>,
   *   capturedWhite: Array<{x: number, y: number}>,
   *   bothPassed: boolean
   * }}
   */
  static resolveTurn(board, blackMove, whiteMove) {
    const result = {
      board: board,
      collision: false,
      collisionPos: null,
      capturedBlack: [],
      capturedWhite: [],
      bothPassed: false
    };

    const blackPass = blackMove.pass;
    const whitePass = whiteMove.pass;

    // Both pass - game ends
    if (blackPass && whitePass) {
      result.bothPassed = true;
      return result;
    }

    // Check for collision (both place on same position)
    if (!blackPass && !whitePass &&
        blackMove.x === whiteMove.x && blackMove.y === whiteMove.y) {
      result.collision = true;
      result.collisionPos = { x: blackMove.x, y: blackMove.y };
      board.set(blackMove.x, blackMove.y, STONE.RED);
    } else {
      // Place stones
      if (!blackPass) {
        board.set(blackMove.x, blackMove.y, STONE.BLACK);
      }
      if (!whitePass) {
        board.set(whiteMove.x, whiteMove.y, STONE.WHITE);
      }
    }

    // Capture phase - find all dead groups simultaneously
    const deadBlack = board.findDeadGroups(STONE.BLACK);
    const deadWhite = board.findDeadGroups(STONE.WHITE);

    // Collect all captured stones
    for (const group of deadBlack) {
      result.capturedBlack.push(...group);
    }
    for (const group of deadWhite) {
      result.capturedWhite.push(...group);
    }

    // Remove all captured stones at once (simultaneous)
    board.removeStones(result.capturedBlack);
    board.removeStones(result.capturedWhite);

    // Red stones are NEVER removed
    return result;
  }

  /**
   * Check if a move would be valid in the simultaneous context
   * This is a pre-validation before the opponent's move is known
   * We check basic validity: bounds, empty, not suicide on current board
   * 
   * @param {Board} board - Current visible board state
   * @param {number} x
   * @param {number} y
   * @param {number} color
   * @returns {{valid: boolean, reason?: string}}
   */
  static preValidateMove(board, x, y, color) {
    if (!board.isValidPosition(x, y)) {
      return { valid: false, reason: 'Position out of bounds' };
    }

    if (!board.isEmpty(x, y)) {
      return { valid: false, reason: 'Position is occupied' };
    }

    // Check for obvious suicide (no adjacent liberties and no captures possible)
    const testBoard = board.clone();
    testBoard.set(x, y, color);

    const opponent = color === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
    const opponentCaptures = testBoard.findDeadGroups(opponent);

    for (const group of opponentCaptures) {
      testBoard.removeStones(group);
    }

    const ownGroup = testBoard.getGroup(x, y);
    const ownLiberties = testBoard.countLiberties(ownGroup);

    if (ownLiberties === 0 && opponentCaptures.length === 0) {
      return { valid: false, reason: 'Suicide move' };
    }

    return { valid: true };
  }
}

module.exports = Rules;
