/**
 * WebSocket Game Server
 * Runs on the host machine, manages game sessions
 */

const WebSocket = require('ws');
const { DEFAULT_PORT, STONE, GAME_END_REASON } = require('../shared/constants');
const { MSG, createMessage, parseMessage } = require('../shared/protocol');
const GameEngine = require('./game/game-engine');

class GameServer {
  /**
   * @param {object} options
   * @param {number} [options.port] - WebSocket port
   */
  constructor(options = {}) {
    this.port = options.port || DEFAULT_PORT;
    this.wss = null;
    this.engine = null;
    this.clients = new Map(); // ws -> { color, playerName }
    this.gameSettings = null;
    this._onLog = null;
  }

  /**
   * Set logging callback
   */
  onLog(callback) {
    this._onLog = callback;
  }

  _log(msg) {
    if (this._onLog) this._onLog(msg);
    console.log(`[Server] ${msg}`);
  }

  /**
   * Start the WebSocket server
   * @param {object} gameSettings
   * @param {number} gameSettings.baseTime
   * @param {string} gameSettings.mode
   * @returns {Promise<{port: number, address: string}>}
   */
  start(gameSettings) {
    return new Promise((resolve, reject) => {
      this.gameSettings = gameSettings;

      try {
        this.wss = new WebSocket.Server({ port: this.port }, () => {
          this._log(`Server started on port ${this.port}`);
          
          // Get local IP addresses
          const os = require('os');
          const interfaces = os.networkInterfaces();
          let address = 'localhost';
          for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
              if (iface.family === 'IPv4' && !iface.internal) {
                address = iface.address;
                break;
              }
            }
          }
          
          resolve({ port: this.port, address });
        });

        this.wss.on('connection', (ws) => this._handleConnection(ws));
        this.wss.on('error', (err) => {
          this._log(`Server error: ${err.message}`);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Handle new WebSocket connection
   */
  _handleConnection(ws) {
    this._log('New connection');

    ws.on('message', (data) => {
      const msg = parseMessage(data.toString());
      this._handleMessage(ws, msg);
    });

    ws.on('close', () => {
      const client = this.clients.get(ws);
      if (client) {
        this._log(`${client.playerName} (${client.color}) disconnected`);
        this.clients.delete(ws);
      }
    });

    ws.on('error', (err) => {
      this._log(`Client error: ${err.message}`);
    });
  }

  /**
   * Handle incoming message from a client
   */
  _handleMessage(ws, msg) {
    // Handle WebRTC signaling messages - relay to other peer
    if (['offer', 'answer', 'ice-candidate'].includes(msg.type)) {
      this._relayWebRTCMessage(ws, msg);
      return;
    }

    switch (msg.type) {
      case MSG.JOIN:
        this._handleJoin(ws, msg);
        break;
      case MSG.SUBMIT_MOVE:
        this._handleSubmitMove(ws, msg);
        break;
      case MSG.RESIGN:
        this._handleResign(ws);
        break;
      case MSG.CHAT:
        this._handleChat(ws, msg);
        break;
      default:
        ws.send(createMessage(MSG.ERROR, { error: `Unknown message type: ${msg.type}` }));
    }
  }

  /**
   * Relay WebRTC signaling message to the other peer
   */
  _relayWebRTCMessage(senderWs, msg) {
    for (const [ws] of this.clients) {
      if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
        // Send as raw JSON for WebRTC signaling
        ws.send(JSON.stringify(msg));
      }
    }
  }

  /**
   * Handle player join
   */
  _handleJoin(ws, msg) {
    const { playerName } = msg;

    // Assign color based on join order
    let color;
    const existingColors = new Set([...this.clients.values()].map(c => c.color));

    if (!existingColors.has('black')) {
      color = 'black';
    } else if (!existingColors.has('white')) {
      color = 'white';
    } else {
      ws.send(createMessage(MSG.ERROR, { error: 'Game is full' }));
      return;
    }

    this.clients.set(ws, { color, playerName });
    this._log(`${playerName} joined as ${color}`);

    ws.send(createMessage(MSG.JOINED, {
      color,
      gameSettings: this.gameSettings
    }));

    // If both players are connected, start the game
    if (this.clients.size === 2) {
      this._startGame();
    }
  }

  /**
   * Start the game
   */
  _startGame() {
    this.engine = new GameEngine(this.gameSettings);

    // Set up engine callbacks
    this.engine.onTurnResolved((result) => {
      this._broadcast(createMessage(MSG.TURN_RESULT, result));
      
      if (!this.engine.gameEnded) {
        // Notify turn start
        this._broadcast(createMessage(MSG.TURN_START, {
          turnNumber: this.engine.turnNumber
        }));
      }
    });

    this.engine.onGameEnd((result) => {
      this._broadcast(createMessage(MSG.GAME_END, result));
    });

    this.engine.onTimerUpdate((color, state) => {
      if (color === 'both') {
        this._broadcast(createMessage(MSG.TIME_UPDATE, state));
      }
    });

    this.engine.onPlayerTimedOut((color) => {
      this._broadcast(createMessage(MSG.TIME_UPDATE, {
        ...this.engine.timerManager.getState(),
        timedOutPlayer: color
      }));
    });

    // Broadcast game start
    this._broadcast(createMessage(MSG.GAME_START, {
      boardSize: this.engine.board.size,
      board: this.engine.board.grid, // Include initial board state
      timeSettings: {
        baseTime: this.gameSettings.baseTime,
        byoYomiPeriods: 3,
        byoYomiTime: 30000
      }
    }));

    // Start the game
    this.engine.startGame();

    // Notify first turn
    this._broadcast(createMessage(MSG.TURN_START, {
      turnNumber: this.engine.turnNumber
    }));
  }

  /**
   * Handle move submission
   */
  _handleSubmitMove(ws, msg) {
    const client = this.clients.get(ws);
    if (!client) {
      ws.send(createMessage(MSG.ERROR, { error: 'Not joined' }));
      return;
    }

    const move = msg.pass ? { pass: true } : { x: msg.x, y: msg.y, pass: false };
    const result = this.engine.submitMove(client.color, move);

    if (result.accepted) {
      ws.send(createMessage(MSG.MOVE_ACK, { waiting: !result.turnResolved }));
      this._log(`${client.color} submitted move: ${move.pass ? 'PASS' : `(${move.x}, ${move.y})`}`);
    } else {
      ws.send(createMessage(MSG.ERROR, { error: result.reason }));
    }
  }

  /**
   * Handle resignation
   */
  _handleResign(ws) {
    const client = this.clients.get(ws);
    if (!client || !this.engine) return;

    this._log(`${client.color} resigned`);
    this.engine.resign(client.color);
  }

  /**
   * Handle chat message
   */
  _handleChat(ws, msg) {
    const client = this.clients.get(ws);
    if (!client) return;

    this._broadcast(createMessage(MSG.CHAT, {
      sender: client.playerName,
      color: client.color,
      message: msg.message
    }));
  }

  /**
   * Broadcast message to all connected clients
   */
  _broadcast(message) {
    for (const [ws] of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  /**
   * Connect a local player (host) directly without WebSocket
   * Returns a virtual client interface
   * @param {string} playerName
   * @returns {object} Virtual client with send/onMessage methods
   */
  connectLocal(playerName) {
    const virtualWs = {
      readyState: WebSocket.OPEN,
      _messageQueue: [],
      send: (data) => {
        if (virtualWs._onMessage) {
          virtualWs._onMessage(data);
        } else {
          // Buffer messages until onMessage callback is registered
          virtualWs._messageQueue.push(data);
        }
      },
      _onMessage: null,
      on: () => {},
      close: () => {}
    };

    // Simulate join
    this._handleConnection(virtualWs);
    this._handleMessage(virtualWs, { type: MSG.JOIN, playerName });

    return {
      send: (msg) => {
        this._handleMessage(virtualWs, parseMessage(msg));
      },
      onMessage: (callback) => {
        virtualWs._onMessage = callback;
        // Flush any buffered messages that were sent before the callback was registered
        while (virtualWs._messageQueue.length > 0) {
          callback(virtualWs._messageQueue.shift());
        }
      },
      close: () => {
        this.clients.delete(virtualWs);
      }
    };
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
    this._log('Server stopped');
  }
}

module.exports = GameServer;
