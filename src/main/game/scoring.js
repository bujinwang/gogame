/**
 * 同步围棋 (Simultaneous Go)
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 */
const { STONE } = require('../../shared/constants');

class Scoring {
  /**
   * Calculate the final score using Chinese area scoring
   * Score = stones on board + territory (empty regions fully surrounded by one color)
   * Red stones count for neither side
   * 
   * @param {import('./board')} board
   * @returns {{
   *   blackScore: number,
   *   whiteScore: number,
   *   blackStones: number,
   *   whiteStones: number,
   *   blackTerritory: number,
   *   whiteTerritory: number,
   *   redStones: number,
   *   neutralTerritory: number,
   *   territoryMap: number[][],
   *   winner: string
   * }}
   */
  static calculate(board) {
    const size = board.size;
    
    // Count stones
    const stoneCounts = board.countStones();
    
    // Find territory - flood fill empty regions
    const visited = Array.from({ length: size }, () => new Array(size).fill(false));
    let blackTerritory = 0;
    let whiteTerritory = 0;
    let neutralTerritory = 0;
    
    // Territory map: 0=neutral, 1=black territory, 2=white territory, 
    // 3=red stone, 4=black stone, 5=white stone
    const territoryMap = Array.from({ length: size }, () => new Array(size).fill(0));
    
    // Mark stones on territory map
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const stone = board.get(x, y);
        if (stone === STONE.BLACK) territoryMap[y][x] = 4;
        else if (stone === STONE.WHITE) territoryMap[y][x] = 5;
        else if (stone === STONE.RED) territoryMap[y][x] = 3;
      }
    }
    
    // Flood fill to find empty regions and determine ownership
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board.get(x, y) === STONE.EMPTY && !visited[y][x]) {
          const { region, adjacentColors } = this._floodFillEmpty(board, x, y, visited);
          
          // Determine territory ownership
          // Only count as territory if surrounded by exactly one color
          // (RED doesn't count as a color for territory purposes)
          const colors = new Set(adjacentColors);
          colors.delete(STONE.RED); // Red doesn't claim territory
          
          if (colors.size === 1) {
            const owner = colors.values().next().value;
            if (owner === STONE.BLACK) {
              blackTerritory += region.length;
              for (const pos of region) {
                territoryMap[pos.y][pos.x] = 1;
              }
            } else if (owner === STONE.WHITE) {
              whiteTerritory += region.length;
              for (const pos of region) {
                territoryMap[pos.y][pos.x] = 2;
              }
            }
          } else {
            // Neutral territory (touched by both colors, or only by red, or open)
            neutralTerritory += region.length;
          }
        }
      }
    }
    
    const blackScore = stoneCounts.black + blackTerritory;
    const whiteScore = stoneCounts.white + whiteTerritory;
    
    let winner;
    if (blackScore > whiteScore) {
      winner = 'black';
    } else if (whiteScore > blackScore) {
      winner = 'white';
    } else {
      winner = 'tie';
    }
    
    return {
      blackScore,
      whiteScore,
      blackStones: stoneCounts.black,
      whiteStones: stoneCounts.white,
      blackTerritory,
      whiteTerritory,
      redStones: stoneCounts.red,
      neutralTerritory,
      territoryMap,
      winner
    };
  }
  
  /**
   * Flood fill from an empty position to find the connected empty region
   * and all colors adjacent to it
   * 
   * @param {import('./board')} board
   * @param {number} startX
   * @param {number} startY
   * @param {boolean[][]} visited
   * @returns {{region: Array<{x: number, y: number}>, adjacentColors: number[]}}
   */
  static _floodFillEmpty(board, startX, startY, visited) {
    const region = [];
    const adjacentColors = [];
    const queue = [{ x: startX, y: startY }];
    
    while (queue.length > 0) {
      const pos = queue.shift();
      
      if (visited[pos.y][pos.x]) continue;
      
      const stone = board.get(pos.x, pos.y);
      
      if (stone === STONE.EMPTY) {
        visited[pos.y][pos.x] = true;
        region.push(pos);
        
        for (const adj of board.getAdjacentPositions(pos.x, pos.y)) {
          if (!visited[adj.y][adj.x]) {
            queue.push(adj);
          }
        }
      } else {
        // This is a stone adjacent to the empty region
        adjacentColors.push(stone);
      }
    }
    
    return { region, adjacentColors };
  }
}

module.exports = Scoring;
