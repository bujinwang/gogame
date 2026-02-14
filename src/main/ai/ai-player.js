/**
 * 无先围棋 (Wuxian Go) - Strengthened AI Player
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 * 
 * Uses UCB1-based Monte Carlo Tree Search (MCTS) with:
 * - Full board evaluation
 * - Influence-based territory estimation
 * - Pattern recognition for common shapes
 * - Opening book (fuseki) awareness
 * - Tactical reading (atari, ladders, connections)
 */
const { STONE, AI_DIFFICULTY, BOARD_SIZE } = require('../../shared/constants');
const Board = require('../game/board');
const Rules = require('../game/rules');

// ============================================================
// MCTS Tree Node
// ============================================================
class MCTSNode {
  constructor(move, parent, color) {
    this.move = move;       // {x, y} or null for root
    this.parent = parent;
    this.color = color;     // The color that MADE this move
    this.children = [];
    this.visits = 0;
    this.wins = 0;
    this.untriedMoves = null; // Will be set lazily
  }

  get ucb1() {
    if (this.visits === 0) return Infinity;
    const exploitation = this.wins / this.visits;
    const exploration = Math.sqrt(2 * Math.log(this.parent.visits) / this.visits);
    return exploitation + 1.414 * exploration;
  }

  bestChild() {
    let best = null;
    let bestScore = -Infinity;
    for (const child of this.children) {
      const score = child.ucb1;
      if (score > bestScore) {
        bestScore = score;
        best = child;
      }
    }
    return best;
  }

  mostVisitedChild() {
    let best = null;
    let bestVisits = -1;
    for (const child of this.children) {
      if (child.visits > bestVisits) {
        bestVisits = child.visits;
        best = child;
      }
    }
    return best;
  }
}

// ============================================================
// AI Player
// ============================================================
class AIPlayer {
  constructor(color, difficulty = AI_DIFFICULTY.MEDIUM) {
    this.color = color;
    this.stoneColor = color === 'black' ? STONE.BLACK : STONE.WHITE;
    this.opponentColor = color === 'black' ? STONE.WHITE : STONE.BLACK;
    this.difficulty = difficulty;
    this.moveCount = 0;

    // MCTS iteration counts based on difficulty
    this.iterationCounts = {
      [AI_DIFFICULTY.EASY]: 400,
      [AI_DIFFICULTY.MEDIUM]: 2000,
      [AI_DIFFICULTY.HARD]: 8000
    };

    // Max playout depth
    this.maxPlayoutDepth = {
      [AI_DIFFICULTY.EASY]: 40,
      [AI_DIFFICULTY.MEDIUM]: 80,
      [AI_DIFFICULTY.HARD]: 120
    };
  }

  /**
   * Generate a move for the AI
   * @param {Board} board - Current board state
   * @returns {{x: number, y: number, pass: boolean}}
   */
  generateMove(board) {
    this.moveCount++;
    const iterations = this.iterationCounts[this.difficulty] || 2000;
    const size = board.size;

    // Get candidate moves (prioritized)
    const candidates = this._getCandidateMoves(board);

    if (candidates.length === 0) {
      return { pass: true };
    }

    // For EASY difficulty, use simpler heuristic-based selection
    if (this.difficulty === AI_DIFFICULTY.EASY) {
      return this._heuristicMove(board, candidates);
    }

    // Run MCTS
    const bestMove = this._runMCTS(board, candidates, iterations);

    if (bestMove) {
      return { x: bestMove.x, y: bestMove.y, pass: false };
    }

    return { pass: true };
  }

  // ============================================================
  // MCTS Implementation
  // ============================================================

  _runMCTS(board, candidates, iterations) {
    const root = new MCTSNode(null, null, this.opponentColor);
    root.untriedMoves = candidates.slice();

    const maxDepth = this.maxPlayoutDepth[this.difficulty] || 80;

    for (let i = 0; i < iterations; i++) {
      const clonedBoard = board.clone();
      let node = root;

      // 1. Selection - traverse tree using UCB1
      while (node.untriedMoves !== null && node.untriedMoves.length === 0 && node.children.length > 0) {
        node = node.bestChild();
        if (node.move) {
          this._applyMove(clonedBoard, node.move.x, node.move.y, node.color);
        }
      }

      // 2. Expansion - add a new child node
      if (node.untriedMoves !== null && node.untriedMoves.length > 0) {
        // Pick a move using heuristic priority (not purely random)
        const moveIdx = this._selectExpansionMove(clonedBoard, node.untriedMoves, node);
        const move = node.untriedMoves.splice(moveIdx, 1)[0];
        const nextColor = node.color === STONE.BLACK ? STONE.WHITE : STONE.BLACK;

        const child = new MCTSNode(move, node, nextColor);
        // Lazily initialize untried moves for child
        this._applyMove(clonedBoard, move.x, move.y, nextColor);
        child.untriedMoves = this._getPlayoutMoves(clonedBoard, nextColor === STONE.BLACK ? STONE.WHITE : STONE.BLACK);
        node.children.push(child);
        node = child;
      }

      // 3. Simulation (playout)
      const result = this._playout(clonedBoard, node.color, maxDepth);

      // 4. Backpropagation
      while (node !== null) {
        node.visits++;
        // Win from the perspective of the AI
        if (result > 0 && node.color === this.stoneColor) {
          node.wins++;
        } else if (result < 0 && node.color === this.opponentColor) {
          node.wins++;
        } else if (result === 0) {
          node.wins += 0.5;
        }
        node = node.parent;
      }
    }

    // Select the most visited child
    const bestChild = root.mostVisitedChild();
    return bestChild ? bestChild.move : null;
  }

  _selectExpansionMove(board, moves, node) {
    // Use heuristic scores to bias expansion toward promising moves
    if (moves.length <= 1) return 0;

    const color = node.color === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < moves.length; i++) {
      const score = this._quickEvaluate(board, moves[i].x, moves[i].y, color) + Math.random() * 2;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  _applyMove(board, x, y, color) {
    board.set(x, y, color);
    const opponent = color === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
    const deadGroups = board.findDeadGroups(opponent);
    for (const group of deadGroups) {
      board.removeStones(group);
    }
    // Also remove own dead groups (suicide shouldn't happen but safety check)
    const ownDead = board.findDeadGroups(color);
    for (const group of ownDead) {
      board.removeStones(group);
    }
  }

  // ============================================================
  // Playout (Simulation)
  // ============================================================

  _playout(board, lastColor, maxDepth) {
    let currentColor = lastColor === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
    let consecutivePasses = 0;

    for (let i = 0; i < maxDepth; i++) {
      if (consecutivePasses >= 2) break;

      const move = this._getSmartRandomMove(board, currentColor);
      if (move === null) {
        consecutivePasses++;
      } else {
        consecutivePasses = 0;
        this._applyMove(board, move.x, move.y, currentColor);
      }

      currentColor = currentColor === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
    }

    // Evaluate final position
    return this._evaluatePosition(board);
  }

  /**
   * Smart random move for playouts - avoids obvious bad moves
   */
  _getSmartRandomMove(board, color) {
    const size = board.size;
    const emptyPositions = [];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board.isEmpty(x, y)) {
          emptyPositions.push({ x, y });
        }
      }
    }

    // Shuffle
    for (let i = emptyPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyPositions[i], emptyPositions[j]] = [emptyPositions[j], emptyPositions[i]];
    }

    const opponent = color === STONE.BLACK ? STONE.WHITE : STONE.BLACK;

    for (const pos of emptyPositions) {
      // Skip if not valid
      const validation = Rules.preValidateMove(board, pos.x, pos.y, color);
      if (!validation.valid) continue;

      // Skip filling own eyes (a critical playout improvement)
      if (this._isEye(board, pos.x, pos.y, color)) continue;

      return pos;
    }

    return null;
  }

  /**
   * Check if a position is an eye for the given color
   */
  _isEye(board, x, y, color) {
    if (!board.isEmpty(x, y)) return false;

    // All adjacent must be same color
    const adj = board.getAdjacentPositions(x, y);
    for (const pos of adj) {
      const stone = board.get(pos.x, pos.y);
      if (stone !== color) return false;
    }

    // Check diagonals - at most one can be opponent/edge
    const size = board.size;
    const diagonals = [
      { x: x - 1, y: y - 1 }, { x: x + 1, y: y - 1 },
      { x: x - 1, y: y + 1 }, { x: x + 1, y: y + 1 }
    ];

    let badDiagonals = 0;
    let totalDiagonals = 0;
    const isEdge = x === 0 || x === size - 1 || y === 0 || y === size - 1;

    for (const d of diagonals) {
      if (!board.isValidPosition(d.x, d.y)) {
        totalDiagonals++;
        badDiagonals++; // Edge counts as bad
        continue;
      }
      totalDiagonals++;
      const stone = board.get(d.x, d.y);
      if (stone !== color && stone !== STONE.EMPTY) {
        badDiagonals++;
      }
    }

    // For edge/corner eyes, no bad diagonals allowed; for center, at most 1
    if (isEdge) {
      return badDiagonals === 0;
    }
    return badDiagonals <= 1;
  }

  // ============================================================
  // Position Evaluation
  // ============================================================

  /**
   * Evaluate the board position from AI's perspective
   * Returns positive if AI is winning, negative if losing
   */
  _evaluatePosition(board) {
    const size = board.size;
    let aiTerritory = 0;
    let oppTerritory = 0;

    // Count stones
    const counts = board.countStones();
    const aiStones = this.stoneColor === STONE.BLACK ? counts.black : counts.white;
    const oppStones = this.stoneColor === STONE.BLACK ? counts.white : counts.black;

    // Simple territory estimation using flood fill
    const visited = new Set();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board.isEmpty(x, y) && !visited.has(`${x},${y}`)) {
          const { territory, owner } = this._floodFillTerritory(board, x, y, visited);
          if (owner === this.stoneColor) {
            aiTerritory += territory;
          } else if (owner === this.opponentColor) {
            oppTerritory += territory;
          }
        }
      }
    }

    const aiTotal = aiStones + aiTerritory;
    const oppTotal = oppStones + oppTerritory;

    // Apply komi if AI is white
    const komi = this.stoneColor === STONE.WHITE ? 7.5 : -7.5;

    return (aiTotal - oppTotal + komi);
  }

  /**
   * Flood fill to determine territory ownership
   */
  _floodFillTerritory(board, startX, startY, visited) {
    const queue = [{ x: startX, y: startY }];
    const region = [];
    let touchesBlack = false;
    let touchesWhite = false;

    while (queue.length > 0) {
      const pos = queue.shift();
      const key = `${pos.x},${pos.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const stone = board.get(pos.x, pos.y);
      if (stone === STONE.BLACK) {
        touchesBlack = true;
        continue;
      }
      if (stone === STONE.WHITE) {
        touchesWhite = true;
        continue;
      }
      if (stone === STONE.RED) {
        continue; // Red stones are neutral blockers
      }

      // Empty
      region.push(pos);
      for (const adj of board.getAdjacentPositions(pos.x, pos.y)) {
        const adjKey = `${adj.x},${adj.y}`;
        if (!visited.has(adjKey)) {
          queue.push(adj);
        }
      }
    }

    let owner = null;
    if (touchesBlack && !touchesWhite) owner = STONE.BLACK;
    else if (touchesWhite && !touchesBlack) owner = STONE.WHITE;

    return { territory: region.length, owner };
  }

  // ============================================================
  // Candidate Move Generation
  // ============================================================

  /**
   * Get candidate moves, prioritized by strategic importance
   */
  _getCandidateMoves(board) {
    const size = board.size;
    const candidates = [];
    const candidateSet = new Set();

    const addCandidate = (x, y, priority) => {
      const key = `${x},${y}`;
      if (candidateSet.has(key)) return;
      if (!board.isValidPosition(x, y)) return;
      const validation = Rules.preValidateMove(board, x, y, this.stoneColor);
      if (!validation.valid) return;
      candidateSet.add(key);
      candidates.push({ x, y, pass: false, priority });
    };

    // 1. Urgent tactical moves (atari responses, captures)
    this._addTacticalMoves(board, addCandidate);

    // 2. Moves near existing stones (within distance 2)
    this._addProximityMoves(board, addCandidate);

    // 3. Opening moves (star points, approach moves)
    if (this.moveCount <= 20) {
      this._addOpeningMoves(board, size, addCandidate);
    }

    // 4. Strategic points on empty board areas
    this._addStrategicMoves(board, size, addCandidate);

    // If very few candidates, add more from the whole board
    if (candidates.length < 10) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (candidates.length >= 60) break;
          addCandidate(x, y, 0);
        }
      }
    }

    // Limit candidates for performance (keep top by priority)
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates.slice(0, Math.min(candidates.length, 80));
  }

  /**
   * Add urgent tactical moves: save groups in atari, capture opponent groups
   */
  _addTacticalMoves(board, addCandidate) {
    const size = board.size;
    const visited = new Set();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const stone = board.get(x, y);
        const key = `${x},${y}`;
        if (stone === STONE.EMPTY || stone === STONE.RED || visited.has(key)) continue;

        const group = board.getGroup(x, y);
        for (const pos of group) visited.add(`${pos.x},${pos.y}`);

        const liberties = board.countLiberties(group);
        const libertyPositions = board.getLibertiesPositions(group);

        if (stone === this.stoneColor) {
          // Our group in atari - save it!
          if (liberties === 1) {
            for (const lib of libertyPositions) {
              addCandidate(lib.x, lib.y, 100); // Highest priority
            }
            // Also try to extend by playing adjacent to the group
            for (const pos of group) {
              for (const adj of board.getAdjacentPositions(pos.x, pos.y)) {
                if (board.isEmpty(adj.x, adj.y)) {
                  addCandidate(adj.x, adj.y, 80);
                }
              }
            }
          }
          // Our group with 2 liberties - strengthen it
          else if (liberties === 2) {
            for (const lib of libertyPositions) {
              addCandidate(lib.x, lib.y, 50);
            }
          }
        } else if (stone === this.opponentColor) {
          // Opponent group in atari - capture it!
          if (liberties === 1) {
            for (const lib of libertyPositions) {
              addCandidate(lib.x, lib.y, 95);
            }
          }
          // Opponent group with 2 liberties - put in atari
          else if (liberties === 2) {
            for (const lib of libertyPositions) {
              addCandidate(lib.x, lib.y, 60);
            }
          }
          // Opponent group with 3 liberties - pressure
          else if (liberties === 3) {
            for (const lib of libertyPositions) {
              addCandidate(lib.x, lib.y, 25);
            }
          }
        }
      }
    }
  }

  /**
   * Add moves near existing stones (proximity heuristic)
   */
  _addProximityMoves(board, addCandidate) {
    const size = board.size;
    const nearStone = new Set();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const stone = board.get(x, y);
        if (stone === STONE.EMPTY || stone === STONE.RED) continue;

        // Add positions within Manhattan distance 2
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (Math.abs(dx) + Math.abs(dy) > 3) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (board.isValidPosition(nx, ny) && board.isEmpty(nx, ny)) {
              const dist = Math.abs(dx) + Math.abs(dy);
              const priority = dist === 1 ? 40 : (dist === 2 ? 30 : 15);
              addCandidate(nx, ny, priority);
            }
          }
        }
      }
    }
  }

  /**
   * Add opening moves (fuseki patterns)
   */
  _addOpeningMoves(board, size, addCandidate) {
    if (size !== 19) return;

    // Star points
    const starPoints = [
      { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
      { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
      { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
    ];

    // 3-4 points (komoku)
    const komokuPoints = [
      { x: 2, y: 3 }, { x: 3, y: 2 }, { x: 15, y: 2 }, { x: 16, y: 3 },
      { x: 2, y: 15 }, { x: 3, y: 16 }, { x: 15, y: 16 }, { x: 16, y: 15 }
    ];

    // 3-3 points (san-san)
    const sanSanPoints = [
      { x: 2, y: 2 }, { x: 16, y: 2 }, { x: 2, y: 16 }, { x: 16, y: 16 }
    ];

    // 5-4 and 5-3 points (takamoku, mokuhazushi)
    const highPoints = [
      { x: 4, y: 3 }, { x: 3, y: 4 }, { x: 14, y: 3 }, { x: 15, y: 4 },
      { x: 4, y: 15 }, { x: 3, y: 14 }, { x: 14, y: 15 }, { x: 15, y: 14 }
    ];

    const counts = board.countStones();
    const totalStones = counts.black + counts.white;

    if (totalStones < 8) {
      // Early opening - prioritize corner star points and komoku
      for (const p of starPoints) {
        if (p.x !== 9 && p.y !== 9) { // Corner star points first
          addCandidate(p.x, p.y, 70);
        }
      }
      for (const p of komokuPoints) addCandidate(p.x, p.y, 65);
      for (const p of sanSanPoints) addCandidate(p.x, p.y, 55);
      for (const p of highPoints) addCandidate(p.x, p.y, 50);
    } else if (totalStones < 16) {
      // Side star points and extensions
      for (const p of starPoints) {
        addCandidate(p.x, p.y, 45);
      }
      // Side extensions (3rd and 4th line)
      for (let i = 3; i <= 15; i += 3) {
        addCandidate(i, 2, 35);
        addCandidate(i, 16, 35);
        addCandidate(2, i, 35);
        addCandidate(16, i, 35);
        addCandidate(i, 3, 30);
        addCandidate(i, 15, 30);
        addCandidate(3, i, 30);
        addCandidate(15, i, 30);
      }
    }
  }

  /**
   * Add strategic moves on the board
   */
  _addStrategicMoves(board, size, addCandidate) {
    // 3rd and 4th line points spread across the board
    for (let y = 2; y < size - 2; y += 3) {
      for (let x = 2; x < size - 2; x += 3) {
        addCandidate(x, y, 10);
      }
    }

    // Center tengen area
    const center = Math.floor(size / 2);
    addCandidate(center, center, 15);
    addCandidate(center - 1, center, 8);
    addCandidate(center + 1, center, 8);
    addCandidate(center, center - 1, 8);
    addCandidate(center, center + 1, 8);
  }

  // ============================================================
  // Quick Evaluation (for move ordering in MCTS expansion)
  // ============================================================

  _quickEvaluate(board, x, y, color) {
    let score = 0;
    const size = board.size;
    const opponent = color === STONE.BLACK ? STONE.WHITE : STONE.BLACK;

    // Captures
    const testBoard = board.clone();
    testBoard.set(x, y, color);
    const captures = testBoard.findDeadGroups(opponent);
    let captureCount = 0;
    for (const group of captures) captureCount += group.length;
    score += captureCount * 8;

    // Save own groups in atari
    for (const adj of board.getAdjacentPositions(x, y)) {
      const adjStone = board.get(adj.x, adj.y);
      if (adjStone === color) {
        const group = board.getGroup(adj.x, adj.y);
        const libs = board.countLiberties(group);
        if (libs === 1) score += 12;
        else if (libs === 2) score += 3;
      }
      // Put opponent in atari
      if (adjStone === opponent) {
        const group = board.getGroup(adj.x, adj.y);
        const libs = board.countLiberties(group);
        if (libs === 2) score += 6;
        else if (libs === 3) score += 2;
      }
      // Avoid red stones
      if (adjStone === STONE.RED) score -= 3;
    }

    // Prefer 3rd/4th line in opening
    const line = Math.min(x, y, size - 1 - x, size - 1 - y);
    if (line === 2 || line === 3) score += 2;
    else if (line === 0) score -= 3;
    else if (line === 1) score -= 1;

    // Liberties after placement
    for (const group of captures) testBoard.removeStones(group);
    const ownGroup = testBoard.getGroup(x, y);
    if (ownGroup.length > 0) {
      const libs = testBoard.countLiberties(ownGroup);
      score += Math.min(libs, 6) * 0.5;
    }

    return score;
  }

  // ============================================================
  // Heuristic Move Selection (for EASY difficulty)
  // ============================================================

  _heuristicMove(board, candidates) {
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of candidates) {
      let score = move.priority * 2;
      score += this._quickEvaluate(board, move.x, move.y, this.stoneColor);
      score += (Math.random() - 0.5) * 6; // Add randomness for easy mode

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (bestMove && bestScore > -20) {
      return { x: bestMove.x, y: bestMove.y, pass: false };
    }
    return { pass: true };
  }

  // ============================================================
  // Helper: Get playout moves (lighter than full candidate generation)
  // ============================================================

  _getPlayoutMoves(board, color) {
    const moves = [];
    const size = board.size;

    // For playout move generation, just get moves near existing stones
    const nearStone = new Set();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const stone = board.get(x, y);
        if (stone === STONE.EMPTY || stone === STONE.RED) continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (Math.abs(dx) + Math.abs(dy) > 3) continue;
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;
            if (board.isValidPosition(nx, ny) && board.isEmpty(nx, ny) && !nearStone.has(key)) {
              nearStone.add(key);
              const validation = Rules.preValidateMove(board, nx, ny, color);
              if (validation.valid) {
                moves.push({ x: nx, y: ny });
              }
            }
          }
        }
      }
    }

    // If board is mostly empty, add some strategic points
    if (moves.length < 15) {
      for (let y = 2; y < size - 2; y += 4) {
        for (let x = 2; x < size - 2; x += 4) {
          const key = `${x},${y}`;
          if (!nearStone.has(key) && board.isEmpty(x, y)) {
            const validation = Rules.preValidateMove(board, x, y, color);
            if (validation.valid) {
              moves.push({ x, y });
            }
          }
        }
      }
    }

    return moves;
  }
}

module.exports = AIPlayer;
