/**
 * 同步围棋 (Simultaneous Go)
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 */
const { STONE, BOARD_SIZE } = require('../../shared/constants');

class Board {
  /**
   * @param {number} size - Board size (default 19)
   */
  constructor(size = BOARD_SIZE) {
    this.size = size;
    this.grid = this._createEmptyGrid();
  }

  _createEmptyGrid() {
    const grid = [];
    for (let i = 0; i < this.size; i++) {
      grid.push(new Array(this.size).fill(STONE.EMPTY));
    }
    return grid;
  }

  /**
   * Get stone at position
   * @param {number} x - Column (0-indexed)
   * @param {number} y - Row (0-indexed)
   * @returns {number} Stone type
   */
  get(x, y) {
    if (!this.isValidPosition(x, y)) return -1;
    return this.grid[y][x];
  }

  /**
   * Set stone at position
   * @param {number} x - Column
   * @param {number} y - Row
   * @param {number} stone - Stone type (STONE enum)
   */
  set(x, y, stone) {
    if (this.isValidPosition(x, y)) {
      this.grid[y][x] = stone;
    }
  }

  /**
   * Check if position is within board bounds
   */
  isValidPosition(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  /**
   * Check if position is empty
   */
  isEmpty(x, y) {
    return this.get(x, y) === STONE.EMPTY;
  }

  /**
   * Get adjacent positions (up, down, left, right)
   * @param {number} x
   * @param {number} y
   * @returns {Array<{x: number, y: number}>}
   */
  getAdjacentPositions(x, y) {
    const adjacent = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValidPosition(nx, ny)) {
        adjacent.push({ x: nx, y: ny });
      }
    }
    return adjacent;
  }

  /**
   * Find the group (connected stones of same color) containing the stone at (x, y)
   * @param {number} x
   * @param {number} y
   * @returns {Array<{x: number, y: number}>} Array of positions in the group
   */
  getGroup(x, y) {
    const stone = this.get(x, y);
    if (stone === STONE.EMPTY || stone === -1) return [];

    const group = [];
    const visited = new Set();
    const queue = [{ x, y }];

    while (queue.length > 0) {
      const pos = queue.shift();
      const key = `${pos.x},${pos.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (this.get(pos.x, pos.y) === stone) {
        group.push(pos);
        for (const adj of this.getAdjacentPositions(pos.x, pos.y)) {
          const adjKey = `${adj.x},${adj.y}`;
          if (!visited.has(adjKey)) {
            queue.push(adj);
          }
        }
      }
    }

    return group;
  }

  /**
   * Count liberties of a group
   * Red stones are NOT empty - they block liberties
   * @param {Array<{x: number, y: number}>} group
   * @returns {number} Number of liberties
   */
  countLiberties(group) {
    const liberties = new Set();
    for (const pos of group) {
      for (const adj of this.getAdjacentPositions(pos.x, pos.y)) {
        if (this.get(adj.x, adj.y) === STONE.EMPTY) {
          liberties.add(`${adj.x},${adj.y}`);
        }
      }
    }
    return liberties.size;
  }

  /**
   * Get all liberties of a group as positions
   * @param {Array<{x: number, y: number}>} group
   * @returns {Array<{x: number, y: number}>}
   */
  getLibertiesPositions(group) {
    const liberties = new Set();
    const result = [];
    for (const pos of group) {
      for (const adj of this.getAdjacentPositions(pos.x, pos.y)) {
        const key = `${adj.x},${adj.y}`;
        if (this.get(adj.x, adj.y) === STONE.EMPTY && !liberties.has(key)) {
          liberties.add(key);
          result.push(adj);
        }
      }
    }
    return result;
  }

  /**
   * Find all groups of a given color that have zero liberties
   * @param {number} color - STONE.BLACK or STONE.WHITE
   * @returns {Array<Array<{x: number, y: number}>>} Array of groups
   */
  findDeadGroups(color) {
    const visited = new Set();
    const deadGroups = [];

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const key = `${x},${y}`;
        if (this.get(x, y) === color && !visited.has(key)) {
          const group = this.getGroup(x, y);
          for (const pos of group) {
            visited.add(`${pos.x},${pos.y}`);
          }
          if (this.countLiberties(group) === 0) {
            deadGroups.push(group);
          }
        }
      }
    }

    return deadGroups;
  }

  /**
   * Remove stones from the board
   * @param {Array<{x: number, y: number}>} stones
   */
  removeStones(stones) {
    for (const pos of stones) {
      this.set(pos.x, pos.y, STONE.EMPTY);
    }
  }

  /**
   * Create a deep copy of this board
   * @returns {Board}
   */
  clone() {
    const newBoard = new Board(this.size);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        newBoard.grid[y][x] = this.grid[y][x];
      }
    }
    return newBoard;
  }

  /**
   * Get a hash string of the board state (for superko detection)
   * @returns {string}
   */
  getHash() {
    return this.grid.map(row => row.join('')).join('');
  }

  /**
   * Serialize board to a flat array for network transmission
   * @returns {number[][]}
   */
  serialize() {
    return this.grid.map(row => [...row]);
  }

  /**
   * Load board state from serialized data
   * @param {number[][]} data
   */
  deserialize(data) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.grid[y][x] = data[y][x];
      }
    }
  }

  /**
   * Count stones of each color
   * @returns {{black: number, white: number, red: number, empty: number}}
   */
  countStones() {
    let black = 0, white = 0, red = 0, empty = 0;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        switch (this.grid[y][x]) {
          case STONE.BLACK: black++; break;
          case STONE.WHITE: white++; break;
          case STONE.RED: red++; break;
          case STONE.EMPTY: empty++; break;
        }
      }
    }
    return { black, white, red, empty };
  }
}

module.exports = Board;
