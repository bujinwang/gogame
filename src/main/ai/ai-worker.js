/**
 * 同弈 (SyncGo) - AI Worker Thread
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 *
 * Runs AI move generation in a separate thread to keep
 * the main Electron process responsive for IPC.
 */
const { workerData, parentPort } = require('worker_threads');
const AIPlayer = require('./ai-player');
const Board = require('../game/board');

// Reconstruct the board and AI player from serialized data
const { color, difficulty, moveCount, boardGrid, boardSize } = workerData;

const board = new Board(boardSize);
for (let y = 0; y < boardSize; y++) {
  for (let x = 0; x < boardSize; x++) {
    board.grid[y][x] = boardGrid[y][x];
  }
}

const aiPlayer = new AIPlayer(color, difficulty);
aiPlayer.moveCount = moveCount;

// Generate the move
const move = aiPlayer.generateMove(board);

// Send the result back to the main thread
parentPort.postMessage(move);
