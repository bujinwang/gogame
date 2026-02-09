/**
 * IPC Handlers - Bridge between Electron main process and renderer
 */

const { ipcMain } = require('electron');
const GameServer = require('./server');
const AIPlayer = require('./ai/ai-player');
const GameEngine = require('./game/game-engine');
const { WebRTCManager, SignalingHandler } = require('./webrtc');
const { MSG, createMessage, parseMessage } = require('../shared/protocol');
const { GAME_MODE, STONE } = require('../shared/constants');

let gameServer = null;
let localClient = null;
let aiPlayer = null;
let aiEngine = null;
let webRTCManager = null;
let signalingHandler = null;

function setupIpcHandlers(mainWindow) {
  /**
   * Host a game (WebSocket LAN) - start server and wait for opponent
   */
  ipcMain.handle('host-game', async (event, settings) => {
    try {
      // Stop any existing game/server
      cleanup();

      // Create a local game server
      gameServer = new GameServer({ port: settings.port || 38765 });
      gameServer.onLog((msg) => {
        mainWindow.webContents.send('server-log', msg);
      });

      const serverInfo = await gameServer.start(settings);

      // Connect as local player (host is always black)
      localClient = gameServer.connectLocal(settings.playerName || 'Host');
      localClient.onMessage((data) => {
        mainWindow.webContents.send('game-message', data);
      });

      return { success: true, ...serverInfo };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  /**
   * Join a game (WebSocket LAN) - connect to remote host
   */
  ipcMain.handle('join-game', async (event, settings) => {
    try {
      // Stop any existing game/server
      cleanup();

      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://${settings.host}:${settings.port || 38765}`);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ success: false, error: 'Connection timed out' });
        }, 10000);

        ws.on('open', () => {
          clearTimeout(timeout);

          // Set up message forwarding
          ws.on('message', (data) => {
            mainWindow.webContents.send('game-message', data.toString());
          });

          ws.on('close', () => {
            mainWindow.webContents.send('connection-lost');
          });

          ws.on('error', (err) => {
            console.error('WebSocket error:', err.message);
          });

          // Send join message
          ws.send(createMessage(MSG.JOIN, {
            playerName: settings.playerName || 'Guest'
          }));

          // Store the ws for future operations
          localClient = {
            send: (msg) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(msg);
              }
            },
            onMessage: (callback) => {
              // Already set up above
            },
            close: () => {
              ws.close();
            }
          };

          resolve({ success: true });
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          resolve({ success: false, error: err.message });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  /**
   * Host a WebRTC game - start signaling server and wait for peer connection
   */
  ipcMain.handle('host-webrtc-game', async (event, settings) => {
    try {
      // Stop any existing game server
      cleanup();

      // Create a local game server
      gameServer = new GameServer({ port: settings.port || 38765 });
      gameServer.onLog((msg) => {
        mainWindow.webContents.send('server-log', msg);
      });

      const serverInfo = await gameServer.start(settings);

      // Connect the host as a local player
      localClient = gameServer.connectLocal(settings.playerName || 'Host');

      // Forward game messages from local client to renderer
      localClient.onMessage((data) => {
        mainWindow.webContents.send('game-message', data);
      });

      return { success: true, ...serverInfo };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  /**
   * Join a WebRTC game - connect to remote signaling server and establish peer connection
   */
  ipcMain.handle('join-webrtc-game', async (event, settings) => {
    try {
      // Stop any existing connections
      cleanup();

      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://${settings.host}:${settings.port || 38765}`);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ success: false, error: 'Connection timed out' });
        }, 10000);

        ws.on('open', () => {
          clearTimeout(timeout);

          // Set up message forwarding
          ws.on('message', (data) => {
            mainWindow.webContents.send('game-message', data.toString());
          });

          ws.on('close', () => {
            mainWindow.webContents.send('connection-lost');
          });

          ws.on('error', (err) => {
            console.error('WebSocket error:', err.message);
          });

          // Send join message
          ws.send(createMessage(MSG.JOIN, {
            playerName: settings.playerName || 'Guest'
          }));

          // Store the ws for future operations
          localClient = {
            send: (msg) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(msg);
              }
            },
            onMessage: (callback) => {
              // Already set up above
            },
            close: () => {
              ws.close();
            }
          };

          resolve({ success: true });
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          resolve({ success: false, error: err.message });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  /**
   * Start AI game - local game with AI opponent
   */
  ipcMain.handle('start-ai-game', async (event, settings) => {
    try {
      // Stop any existing game
      cleanup();

      // Create a local game server
      gameServer = new GameServer({ port: settings.port || 38766 });
      gameServer.onLog((msg) => {
        mainWindow.webContents.send('server-log', msg);
      });

      await gameServer.start(settings);

      // Connect human player
      const humanColor = settings.playerColor || 'black';
      localClient = gameServer.connectLocal(settings.playerName || 'Player');
      localClient.onMessage((data) => {
        mainWindow.webContents.send('game-message', data);
      });

      // Create AI player
      const aiColor = humanColor === 'black' ? 'white' : 'black';
      aiPlayer = new AIPlayer(aiColor, settings.aiDifficulty);

      // Connect AI as second player
      const aiClient = gameServer.connectLocal('AI');
      aiClient.onMessage((data) => {
        const msg = parseMessage(data);
        
        // When AI receives turn start, generate and submit a move
        if (msg.type === MSG.TURN_START) {
          // Small delay to simulate thinking
          const thinkTime = settings.aiDifficulty === 'easy' ? 500 :
                           settings.aiDifficulty === 'hard' ? 3000 : 1500;
          
          setTimeout(() => {
            if (gameServer && gameServer.engine && !gameServer.engine.gameEnded) {
              const board = gameServer.engine.board;
              const move = aiPlayer.generateMove(board);
              
              if (move.pass) {
                aiClient.send(createMessage(MSG.SUBMIT_MOVE, { pass: true }));
              } else {
                aiClient.send(createMessage(MSG.SUBMIT_MOVE, { x: move.x, y: move.y }));
              }
            }
          }, thinkTime);
        }
      });

      return { success: true, aiColor };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  /**
   * Submit a move
   */
  ipcMain.handle('submit-move', async (event, move) => {
    if (!localClient) {
      return { success: false, error: 'Not connected' };
    }

    try {
      if (move.pass) {
        localClient.send(createMessage(MSG.SUBMIT_MOVE, { pass: true }));
      } else {
        localClient.send(createMessage(MSG.SUBMIT_MOVE, { x: move.x, y: move.y }));
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  /**
   * Resign
   */
  ipcMain.handle('resign', async () => {
    if (!localClient) return { success: false };
    localClient.send(createMessage(MSG.RESIGN));
    return { success: true };
  });

  /**
   * Send chat message
   */
  ipcMain.handle('send-chat', async (event, message) => {
    if (!localClient) return { success: false };
    localClient.send(createMessage(MSG.CHAT, { message }));
    return { success: true };
  });

  /**
   * Disconnect and clean up
   */
  ipcMain.handle('disconnect', async () => {
    cleanup();
    return { success: true };
  });

  /**
   * Get local IP addresses for display
   */
  ipcMain.handle('get-local-ips', async () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push({ name, address: iface.address });
        }
      }
    }
    return ips;
  });
}

/**
 * Clean up all resources
 */
function cleanup() {
  if (localClient) {
    localClient.close();
    localClient = null;
  }
  if (gameServer) {
    gameServer.stop();
    gameServer = null;
  }
  if (webRTCManager) {
    webRTCManager.close();
    webRTCManager = null;
  }
  if (signalingHandler) {
    signalingHandler.close();
    signalingHandler = null;
  }
  aiPlayer = null;
}

function cleanupIpc() {
  cleanup();
}

module.exports = { setupIpcHandlers, cleanupIpc };
