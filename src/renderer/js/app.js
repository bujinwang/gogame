/**
 * App - Main renderer process application
 * Handles UI, board rendering, and game client communication
 */

// ============================================================
// Constants (duplicated from shared for renderer context)
// ============================================================
const STONE = { EMPTY: 0, BLACK: 1, WHITE: 2, RED: 3 };
const BOARD_SIZE = 19;

// ============================================================
// Audio Service (inline for renderer context)
// ============================================================
const audioService = {
  audioContext: null,
  enabled: true,
  volume: 0.5,
  initialized: false,

  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  },

  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  },

  playStonePlace() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    const noise = this.audioContext.createOscillator();
    const noiseGain = this.audioContext.createGain();
    noise.type = 'triangle';
    noise.frequency.setValueAtTime(150, now);
    noise.frequency.exponentialRampToValueAtTime(50, now + 0.08);
    noiseGain.gain.setValueAtTime(this.volume * 0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);
    noise.start(now);
    noise.stop(now + 0.1);
  },

  playCapture(count = 1) {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;
    const intensity = Math.min(count, 10) / 10;

    for (let i = 0; i < Math.min(count, 5); i++) {
      const delay = i * 0.03;
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + Math.random() * 200, now + delay);
      osc.frequency.exponentialRampToValueAtTime(100, now + delay + 0.1);
      gainNode.gain.setValueAtTime(this.volume * 0.15 * (1 + intensity), now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    }

    const rumble = this.audioContext.createOscillator();
    const rumbleGain = this.audioContext.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(80, now);
    rumble.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    rumbleGain.gain.setValueAtTime(this.volume * 0.1 * (1 + intensity), now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.audioContext.destination);
    rumble.start(now);
    rumble.stop(now + 0.25);
  },

  playCollision() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;

    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain1.gain.setValueAtTime(this.volume * 0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(800, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.18);
    gain2.gain.setValueAtTime(this.volume * 0.15, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(this.audioContext.destination);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.22);
  },

  playTurnNotification() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;
    const notes = [523.25, 659.25];
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gainNode.gain.setValueAtTime(this.volume * 0.2, now + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  },

  playTimerWarning() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gainNode.gain.setValueAtTime(this.volume * 0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  },

  playTimerCritical() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;

    for (let i = 0; i < 2; i++) {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, now + i * 0.08);
      gainNode.gain.setValueAtTime(this.volume * 0.3, now + i * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.05);
      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.05);
    }
  },

  playGameOver(isWin) {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;

    if (isWin) {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gainNode.gain.setValueAtTime(this.volume * 0.25, now + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.4);
      });
    } else {
      const notes = [392.00, 329.63, 261.63];
      notes.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.2);
        gainNode.gain.setValueAtTime(this.volume * 0.2, now + i * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.35);
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.35);
      });
    }
  },

  playPass() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
    gainNode.gain.setValueAtTime(this.volume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  },

  playError() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    gainNode.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  },

  setEnabled(enabled) { this.enabled = enabled; },
  setVolume(volume) { this.volume = Math.max(0, Math.min(1, volume)); },
  isEnabled() { return this.enabled; },
  getVolume() { return this.volume; }
};

// ============================================================
// State
// ============================================================
const state = {
  currentScreen: 'home',
  myColor: null,        // 'black' or 'white'
  gameActive: false,
  board: null,          // 2D array
  turnNumber: 0,
  moveSubmitted: false,
  waitingForOpponent: false,
  capturedByBlack: 0,
  capturedByWhite: 0,
  blackTimer: null,
  whiteTimer: null,
  hoverPos: null,       // {x, y} for hover preview
  lastBlackMove: null,
  lastWhiteMove: null,
  moveHistory: [],
  lastByoYomiWarning: 0  // Track last warning to prevent spam
};

// ============================================================
// Screen Management
// ============================================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${screenId}`);
  if (screen) {
    screen.classList.add('active');
    state.currentScreen = screenId;
  }
}

// ============================================================
// Board Canvas Renderer
// ============================================================
class BoardRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = BOARD_SIZE;
    this.padding = 30;
    this.cellSize = 0;
    this.boardPixelSize = 0;
    this.stoneRadius = 0;
    
    this._resize();
    this._setupEvents();
    
    window.addEventListener('resize', () => {
      this._resize();
      this.draw();
    });
  }

  _resize() {
    const container = this.canvas.parentElement;
    const maxSize = Math.min(container.clientWidth - 30, container.clientHeight - 30);
    const canvasSize = Math.max(400, maxSize);
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = canvasSize * dpr;
    this.canvas.height = canvasSize * dpr;
    this.canvas.style.width = canvasSize + 'px';
    this.canvas.style.height = canvasSize + 'px';
    this.ctx.scale(dpr, dpr);
    
    this.boardPixelSize = canvasSize;
    this.cellSize = (canvasSize - 2 * this.padding) / (this.size - 1);
    this.stoneRadius = this.cellSize * 0.45;
  }

  _setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this._getIntersection(e);
      if (pos && state.gameActive && !state.moveSubmitted) {
        state.hoverPos = pos;
      } else {
        state.hoverPos = null;
      }
      this.draw();
    });

    this.canvas.addEventListener('mouseleave', () => {
      state.hoverPos = null;
      this.draw();
    });

    this.canvas.addEventListener('click', (e) => {
      if (!state.gameActive || state.moveSubmitted) return;
      
      const pos = this._getIntersection(e);
      if (pos && state.board && state.board[pos.y][pos.x] === STONE.EMPTY) {
        submitMove(pos.x, pos.y);
      }
    });
  }

  _getIntersection(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const col = Math.round((x - this.padding) / this.cellSize);
    const row = Math.round((y - this.padding) / this.cellSize);
    
    if (col >= 0 && col < this.size && row >= 0 && row < this.size) {
      // Check if click is close enough to intersection
      const ix = this.padding + col * this.cellSize;
      const iy = this.padding + row * this.cellSize;
      const dist = Math.sqrt((x - ix) ** 2 + (y - iy) ** 2);
      
      if (dist < this.cellSize * 0.5) {
        return { x: col, y: row };
      }
    }
    return null;
  }

  draw() {
    const ctx = this.ctx;
    const size = this.boardPixelSize;
    
    // Clear
    ctx.clearRect(0, 0, size, size);
    
    // Board background
    ctx.fillStyle = '#dcb35c';
    ctx.fillRect(0, 0, size, size);
    
    // Wood grain effect
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 7) {
      ctx.beginPath();
      ctx.moveTo(0, i + Math.sin(i * 0.1) * 3);
      ctx.lineTo(size, i + Math.sin(i * 0.1 + 2) * 3);
      ctx.stroke();
    }
    
    // Grid lines
    ctx.strokeStyle = '#2a1f0e';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < this.size; i++) {
      const pos = this.padding + i * this.cellSize;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, this.padding);
      ctx.lineTo(pos, this.padding + (this.size - 1) * this.cellSize);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(this.padding, pos);
      ctx.lineTo(this.padding + (this.size - 1) * this.cellSize, pos);
      ctx.stroke();
    }
    
    // Star points
    const starPoints = this._getStarPoints();
    ctx.fillStyle = '#2a1f0e';
    for (const sp of starPoints) {
      const sx = this.padding + sp.x * this.cellSize;
      const sy = this.padding + sp.y * this.cellSize;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Coordinate labels
    ctx.fillStyle = '#5a4a2e';
    ctx.font = `${Math.max(10, this.cellSize * 0.35)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const letters = 'ABCDEFGHJKLMNOPQRST'; // Skip 'I'
    for (let i = 0; i < this.size; i++) {
      const x = this.padding + i * this.cellSize;
      // Top
      ctx.fillText(letters[i], x, this.padding - 15);
      // Bottom
      ctx.fillText(letters[i], x, this.padding + (this.size - 1) * this.cellSize + 15);
      
      // Left
      const num = this.size - i;
      ctx.fillText(num.toString(), this.padding - 18, this.padding + i * this.cellSize);
      // Right
      ctx.fillText(num.toString(), this.padding + (this.size - 1) * this.cellSize + 18, this.padding + i * this.cellSize);
    }
    
    // Draw stones
    if (state.board) {
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          const stone = state.board[y][x];
          if (stone !== STONE.EMPTY) {
            this._drawStone(x, y, stone);
          }
        }
      }
    }
    
    // Last move indicators
    if (state.lastBlackMove && !state.lastBlackMove.pass) {
      this._drawLastMoveMarker(state.lastBlackMove.x, state.lastBlackMove.y, 'black');
    }
    if (state.lastWhiteMove && !state.lastWhiteMove.pass) {
      this._drawLastMoveMarker(state.lastWhiteMove.x, state.lastWhiteMove.y, 'white');
    }
    
    // Hover preview
    if (state.hoverPos && state.board && 
        state.board[state.hoverPos.y][state.hoverPos.x] === STONE.EMPTY &&
        !state.moveSubmitted) {
      this._drawHoverStone(state.hoverPos.x, state.hoverPos.y);
    }
  }

  _drawStone(x, y, type) {
    const ctx = this.ctx;
    const cx = this.padding + x * this.cellSize;
    const cy = this.padding + y * this.cellSize;
    const r = this.stoneRadius;
    
    ctx.save();
    
    if (type === STONE.BLACK) {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
      ctx.fill();
      
      // Stone
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (type === STONE.WHITE) {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
      ctx.fill();
      
      // Stone
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#c8c8c8');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      
    } else if (type === STONE.RED) {
      // Glow effect
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      
      // Shadow
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1, r, 0, Math.PI * 2);
      ctx.fill();
      
      // Stone
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      grad.addColorStop(0, '#ff6666');
      grad.addColorStop(0.5, '#ff2222');
      grad.addColorStop(1, '#cc0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // X mark on red stone
      ctx.strokeStyle = '#ffaaaa';
      ctx.lineWidth = 2;
      const markSize = r * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx - markSize, cy - markSize);
      ctx.lineTo(cx + markSize, cy + markSize);
      ctx.moveTo(cx + markSize, cy - markSize);
      ctx.lineTo(cx - markSize, cy + markSize);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  _drawHoverStone(x, y) {
    const ctx = this.ctx;
    const cx = this.padding + x * this.cellSize;
    const cy = this.padding + y * this.cellSize;
    const r = this.stoneRadius;
    
    ctx.save();
    ctx.globalAlpha = 0.4;
    
    if (state.myColor === 'black') {
      ctx.fillStyle = '#333';
    } else {
      ctx.fillStyle = '#ddd';
    }
    
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawLastMoveMarker(x, y, color) {
    const ctx = this.ctx;
    const cx = this.padding + x * this.cellSize;
    const cy = this.padding + y * this.cellSize;
    
    // Check if there's a red stone here (collision) - don't draw marker
    if (state.board && state.board[y][x] === STONE.RED) return;
    
    ctx.save();
    ctx.strokeStyle = color === 'black' ? '#fff' : '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, this.stoneRadius * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _getStarPoints() {
    if (this.size === 19) {
      return [
        {x: 3, y: 3}, {x: 9, y: 3}, {x: 15, y: 3},
        {x: 3, y: 9}, {x: 9, y: 9}, {x: 15, y: 9},
        {x: 3, y: 15}, {x: 9, y: 15}, {x: 15, y: 15}
      ];
    }
    return [];
  }
}

// ============================================================
// Board Renderer Instance
// ============================================================
let boardRenderer = null;

// ============================================================
// Game Message Handler
// ============================================================
function handleGameMessage(data) {
  let msg;
  try {
    msg = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('Failed to parse game message:', e);
    return;
  }

  switch (msg.type) {
    case 'joined':
      handleJoined(msg);
      break;
    case 'game_start':
      handleGameStart(msg);
      break;
    case 'turn_start':
      handleTurnStart(msg);
      break;
    case 'move_ack':
      handleMoveAck(msg);
      break;
    case 'turn_result':
      handleTurnResult(msg);
      break;
    case 'time_update':
      handleTimeUpdate(msg);
      break;
    case 'game_end':
      handleGameEnd(msg);
      break;
    case 'error':
      console.error('Server error:', msg.error);
      break;
  }
}

function handleJoined(msg) {
  state.myColor = msg.color;
  console.log(`Joined as ${msg.color}`);
}

function handleGameStart(msg) {
  state.gameActive = true;
  state.board = createEmptyBoard();
  state.turnNumber = 0;
  state.capturedByBlack = 0;
  state.capturedByWhite = 0;
  state.moveHistory = [];
  state.lastBlackMove = null;
  state.lastWhiteMove = null;
  
  showScreen('game');
  
  // Initialize audio (requires user interaction first)
  audioService.init();
  
  // Initialize board renderer
  if (!boardRenderer) {
    const canvas = document.getElementById('game-board');
    boardRenderer = new BoardRenderer(canvas);
  }
  boardRenderer.draw();
  
  // Enable controls
  document.getElementById('btn-pass').disabled = false;
  document.getElementById('btn-resign').disabled = false;
  
  // Play game start sound
  audioService.playTurnNotification();
  
  updateStatus('游戏开始！请落子...');
}

function handleTurnStart(msg) {
  state.turnNumber = msg.turnNumber;
  state.moveSubmitted = false;
  state.waitingForOpponent = false;
  state.hoverPos = null;
  
  document.getElementById('turn-number').textContent = `第 ${state.turnNumber} 手`;
  document.getElementById('btn-pass').disabled = false;
  
  const canvas = document.getElementById('game-board');
  canvas.classList.remove('waiting', 'disabled');
  
  updateStatus(`第 ${state.turnNumber} 手 - 请落子`);
  
  if (boardRenderer) boardRenderer.draw();
}

function handleMoveAck(msg) {
  if (msg.waiting) {
    state.waitingForOpponent = true;
    updateStatus('等待对手落子...');
    
    const canvas = document.getElementById('game-board');
    canvas.classList.add('waiting');
  }
}

function handleTurnResult(msg) {
  const prevCapturedBlack = state.capturedByBlack;
  const prevCapturedWhite = state.capturedByWhite;
  
  // Update board
  state.board = msg.board;
  state.capturedByBlack = msg.capturedByBlack || 0;
  state.capturedByWhite = msg.capturedByWhite || 0;
  state.lastBlackMove = msg.blackMove;
  state.lastWhiteMove = msg.whiteMove;
  
  // Update captures display
  document.getElementById('black-captures').textContent = `提子: ${state.capturedByBlack}`;
  document.getElementById('white-captures').textContent = `提子: ${state.capturedByWhite}`;
  
  // Add to move history
  addMoveToHistory(msg);
  
  // Update timers
  if (msg.timers) {
    updateTimerDisplay(msg.timers);
  }
  
  // Redraw board
  if (boardRenderer) boardRenderer.draw();
  
  // Play sounds based on what happened
  if (msg.collision) {
    // Collision - red stone appeared
    audioService.playCollision();
    updateStatus(`⚠️ 碰撞！红棋出现在 ${formatPos(msg.collisionPos)}`);
  } else {
    // Check for captures
    const newBlackCaptures = state.capturedByBlack - prevCapturedBlack;
    const newWhiteCaptures = state.capturedByWhite - prevCapturedWhite;
    const totalCaptures = newBlackCaptures + newWhiteCaptures;
    
    if (totalCaptures > 0) {
      audioService.playCapture(totalCaptures);
    } else {
      // Normal stone placement
      audioService.playStonePlace();
    }
    
    // Check for passes
    if (msg.blackMove && msg.blackMove.pass) {
      audioService.playPass();
    }
    if (msg.whiteMove && msg.whiteMove.pass) {
      audioService.playPass();
    }
  }
}

function handleTimeUpdate(msg) {
  updateTimerDisplay(msg);
}

function handleGameEnd(msg) {
  state.gameActive = false;
  state.moveSubmitted = false;
  
  document.getElementById('btn-pass').disabled = true;
  document.getElementById('btn-resign').disabled = true;
  
  const canvas = document.getElementById('game-board');
  canvas.classList.add('disabled');
  
  // Play game over sound
  const isWin = (state.myColor === msg.winner);
  audioService.playGameOver(isWin);
  
  // Show result screen
  showResultScreen(msg);
}

// ============================================================
// Game Actions
// ============================================================
async function submitMove(x, y) {
  if (state.moveSubmitted || !state.gameActive) return;
  
  state.moveSubmitted = true;
  document.getElementById('btn-pass').disabled = true;
  
  const result = await window.gameAPI.submitMove({ x, y, pass: false });
  if (!result.success) {
    state.moveSubmitted = false;
    document.getElementById('btn-pass').disabled = false;
    console.error('Move rejected:', result.error);
    audioService.playError();
    updateStatus(`落子失败: ${result.error}`);
  }
}

async function submitPass() {
  if (state.moveSubmitted || !state.gameActive) return;
  
  state.moveSubmitted = true;
  document.getElementById('btn-pass').disabled = true;
  
  const result = await window.gameAPI.submitMove({ pass: true });
  if (!result.success) {
    state.moveSubmitted = false;
    document.getElementById('btn-pass').disabled = false;
    updateStatus(`虚手失败: ${result.error}`);
  } else {
    updateStatus('已虚手，等待对手...');
    const canvas = document.getElementById('game-board');
    canvas.classList.add('waiting');
  }
}

async function resignGame() {
  if (!state.gameActive) return;
  
  if (confirm('确定要认输吗？')) {
    await window.gameAPI.resign();
  }
}

// ============================================================
// UI Helpers
// ============================================================
function createEmptyBoard() {
  const board = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    board.push(new Array(BOARD_SIZE).fill(STONE.EMPTY));
  }
  return board;
}

function updateStatus(text) {
  document.getElementById('status-text').textContent = text;
}

function formatPos(pos) {
  if (!pos) return '?';
  const letters = 'ABCDEFGHJKLMNOPQRST';
  return `${letters[pos.x]}${BOARD_SIZE - pos.y}`;
}

function formatTime(ms) {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay(timers) {
  if (!timers) return;
  
  const bt = timers.blackTimer;
  const wt = timers.whiteTimer;
  const now = Date.now();
  
  // Get my timer based on color
  const myTimer = state.myColor === 'black' ? bt : wt;
  
  if (bt) {
    const blackTimeEl = document.getElementById('black-time-main');
    const blackByoEl = document.getElementById('black-byoyomi');
    
    if (bt.inByoYomi) {
      blackTimeEl.textContent = formatTime(bt.currentByoYomiRemaining);
      blackByoEl.textContent = `读秒: ${bt.byoYomiPeriods}×30s`;
      blackByoEl.classList.add('active');
      blackTimeEl.classList.add('critical-time');
      blackTimeEl.classList.remove('low-time');
    } else {
      blackTimeEl.textContent = formatTime(bt.remainingBase);
      blackByoEl.textContent = `读秒: ${bt.byoYomiPeriods}×30s`;
      blackByoEl.classList.remove('active');
      
      if (bt.remainingBase < 60000) {
        blackTimeEl.classList.add('critical-time');
        blackTimeEl.classList.remove('low-time');
      } else if (bt.remainingBase < 300000) {
        blackTimeEl.classList.add('low-time');
        blackTimeEl.classList.remove('critical-time');
      } else {
        blackTimeEl.classList.remove('low-time', 'critical-time');
      }
    }
    
    if (bt.timedOut) {
      document.getElementById('black-player-card').classList.add('timed-out');
    }
  }
  
  if (wt) {
    const whiteTimeEl = document.getElementById('white-time-main');
    const whiteByoEl = document.getElementById('white-byoyomi');
    
    if (wt.inByoYomi) {
      whiteTimeEl.textContent = formatTime(wt.currentByoYomiRemaining);
      whiteByoEl.textContent = `读秒: ${wt.byoYomiPeriods}×30s`;
      whiteByoEl.classList.add('active');
      whiteTimeEl.classList.add('critical-time');
      whiteTimeEl.classList.remove('low-time');
    } else {
      whiteTimeEl.textContent = formatTime(wt.remainingBase);
      whiteByoEl.textContent = `读秒: ${wt.byoYomiPeriods}×30s`;
      whiteByoEl.classList.remove('active');
      
      if (wt.remainingBase < 60000) {
        whiteTimeEl.classList.add('critical-time');
        whiteTimeEl.classList.remove('low-time');
      } else if (wt.remainingBase < 300000) {
        whiteTimeEl.classList.add('low-time');
        whiteTimeEl.classList.remove('critical-time');
      } else {
        whiteTimeEl.classList.remove('low-time', 'critical-time');
      }
    }
    
    if (wt.timedOut) {
      document.getElementById('white-player-card').classList.add('timed-out');
    }
  }
  
  // Play timer warning sounds for my timer (only when in byo-yomi)
  if (myTimer && myTimer.inByoYomi && !state.moveSubmitted) {
    const remaining = myTimer.currentByoYomiRemaining;
    // Play critical warning every second in last 5 seconds
    if (remaining <= 5000 && now - state.lastByoYomiWarning >= 900) {
      audioService.playTimerCritical();
      state.lastByoYomiWarning = now;
    }
    // Play regular warning at 10, 15, 20, 25 seconds
    else if ((remaining <= 10000 && remaining > 5000) ||
             (remaining <= 15000 && remaining > 10000) ||
             (remaining <= 20000 && remaining > 15000) ||
             (remaining <= 25000 && remaining > 20000)) {
      const secondMark = Math.ceil(remaining / 5000) * 5000;
      if (remaining <= secondMark && remaining > secondMark - 1000 && now - state.lastByoYomiWarning >= 4500) {
        audioService.playTimerWarning();
        state.lastByoYomiWarning = now;
      }
    }
  }
}

function addMoveToHistory(turnResult) {
  const historyEl = document.getElementById('move-history');
  const entry = document.createElement('div');
  entry.className = 'move-entry';
  
  const turnSpan = document.createElement('span');
  turnSpan.className = 'move-turn';
  turnSpan.textContent = `#${turnResult.turn}`;
  
  const blackSpan = document.createElement('span');
  const whiteSpan = document.createElement('span');
  
  if (turnResult.collision) {
    blackSpan.className = 'move-collision';
    blackSpan.textContent = `碰撞 ${formatPos(turnResult.collisionPos)}`;
    whiteSpan.textContent = '';
  } else {
    blackSpan.className = 'move-black';
    blackSpan.textContent = turnResult.blackMove.pass ? 'Pass' : `⚫${formatPos(turnResult.blackMove)}`;
    
    whiteSpan.className = 'move-white';
    whiteSpan.textContent = turnResult.whiteMove.pass ? 'Pass' : `⚪${formatPos(turnResult.whiteMove)}`;
  }
  
  entry.appendChild(turnSpan);
  entry.appendChild(blackSpan);
  entry.appendChild(whiteSpan);
  historyEl.appendChild(entry);
  
  // Auto-scroll
  historyEl.scrollTop = historyEl.scrollHeight;
}

function showResultScreen(result) {
  const scoring = result.scoring;
  const winner = result.winner;
  
  // Title
  const titleEl = document.getElementById('result-title');
  if (result.reason === 'resign') {
    titleEl.textContent = `${winner === 'black' ? '黑方' : '白方'}胜 (对方认输)`;
  } else if (result.reason === 'timeout') {
    titleEl.textContent = '游戏结束 (超时)';
  } else {
    titleEl.textContent = winner === 'tie' ? '平局！' : `${winner === 'black' ? '黑方' : '白方'}胜！`;
  }
  
  // Scores
  document.getElementById('result-black-score').textContent = scoring.blackScore;
  document.getElementById('result-white-score').textContent = scoring.whiteScore;
  document.getElementById('result-black-detail').textContent = 
    `棋子: ${scoring.blackStones} + 领地: ${scoring.blackTerritory}`;
  document.getElementById('result-white-detail').textContent = 
    `棋子: ${scoring.whiteStones} + 领地: ${scoring.whiteTerritory}`;
  
  // Reason
  const reasons = {
    'double_pass': '双方虚手，游戏结束',
    'resign': `${winner === 'black' ? '白方' : '黑方'}认输`,
    'timeout': '超时判负',
    'disconnect': '对手断开连接'
  };
  document.getElementById('result-reason').textContent = 
    `${reasons[result.reason] || ''} | 红棋: ${scoring.redStones}`;
  
  // Highlight winner
  const blackCard = document.querySelector('.score-card.black-score');
  const whiteCard = document.querySelector('.score-card.white-score');
  blackCard.classList.toggle('winner', winner === 'black');
  whiteCard.classList.toggle('winner', winner === 'white');
  
  showScreen('result');
}

// ============================================================
// Event Listeners Setup
// ============================================================
function setupEventListeners() {
  // Home screen buttons
  document.getElementById('btn-host').addEventListener('click', () => showScreen('host'));
  document.getElementById('btn-join').addEventListener('click', () => showScreen('join'));
  document.getElementById('btn-ai').addEventListener('click', () => showScreen('ai'));
  
  // Back buttons
  document.getElementById('btn-host-back').addEventListener('click', () => showScreen('home'));
  document.getElementById('btn-join-back').addEventListener('click', () => showScreen('home'));
  document.getElementById('btn-ai-back').addEventListener('click', () => showScreen('home'));
  
  // Host game
  document.getElementById('btn-host-start').addEventListener('click', async () => {
    const name = document.getElementById('host-name').value || '黑方';
    const baseTime = parseInt(document.getElementById('host-time').value);
    const port = parseInt(document.getElementById('host-port').value) || 38765;
    
    const btn = document.getElementById('btn-host-start');
    btn.disabled = true;
    btn.textContent = '启动中...';
    
    const result = await window.gameAPI.hostGame({
      playerName: name,
      baseTime: baseTime,
      port: port,
      mode: 'human_vs_human'
    });
    
    if (result.success) {
      document.getElementById('host-waiting').style.display = 'block';
      document.getElementById('host-ip-info').textContent = 
        `地址: ${result.address}:${result.port}`;
      btn.textContent = '等待中...';
    } else {
      btn.disabled = false;
      btn.textContent = '开始等待';
      alert('启动失败: ' + result.error);
    }
  });
  
  // Join game
  document.getElementById('btn-join-connect').addEventListener('click', async () => {
    const name = document.getElementById('join-name').value || '白方';
    const host = document.getElementById('join-host').value;
    const port = parseInt(document.getElementById('join-port').value) || 38765;
    
    if (!host) {
      showJoinStatus('请输入主机地址', 'error');
      return;
    }
    
    const btn = document.getElementById('btn-join-connect');
    btn.disabled = true;
    btn.textContent = '连接中...';
    
    const result = await window.gameAPI.joinGame({
      playerName: name,
      host: host,
      port: port
    });
    
    if (result.success) {
      showJoinStatus('连接成功！等待游戏开始...', 'success');
    } else {
      btn.disabled = false;
      btn.textContent = '连接';
      showJoinStatus('连接失败: ' + result.error, 'error');
    }
  });
  
  // AI game
  document.getElementById('btn-ai-start').addEventListener('click', async () => {
    const name = document.getElementById('ai-name').value || '玩家';
    const color = document.getElementById('ai-color').value;
    const difficulty = document.getElementById('ai-difficulty').value;
    const baseTime = parseInt(document.getElementById('ai-time').value);
    
    const result = await window.gameAPI.startAIGame({
      playerName: name,
      playerColor: color,
      aiDifficulty: difficulty,
      baseTime: baseTime,
      mode: 'human_vs_ai'
    });
    
    if (!result.success) {
      alert('启动失败: ' + result.error);
    }
  });
  
  // Game controls
  document.getElementById('btn-pass').addEventListener('click', submitPass);
  document.getElementById('btn-resign').addEventListener('click', resignGame);
  
  // Result screen
  document.getElementById('btn-result-home').addEventListener('click', async () => {
    await window.gameAPI.disconnect();
    resetGameState();
    showScreen('home');
  });
  
  // Rules modal
  document.getElementById('btn-close-rules').addEventListener('click', () => {
    document.getElementById('modal-rules').style.display = 'none';
  });
  
  // Game message listener
  window.gameAPI.onGameMessage(handleGameMessage);
  
  // Connection lost
  window.gameAPI.onConnectionLost(() => {
    if (state.gameActive) {
      updateStatus('⚠️ 连接断开');
      state.gameActive = false;
    }
  });
}

function showJoinStatus(text, type) {
  const el = document.getElementById('join-status');
  el.style.display = 'block';
  el.className = `status-info ${type}`;
  el.textContent = text;
}

function resetGameState() {
  state.myColor = null;
  state.gameActive = false;
  state.board = null;
  state.turnNumber = 0;
  state.moveSubmitted = false;
  state.waitingForOpponent = false;
  state.capturedByBlack = 0;
  state.capturedByWhite = 0;
  state.blackTimer = null;
  state.whiteTimer = null;
  state.hoverPos = null;
  state.lastBlackMove = null;
  state.lastWhiteMove = null;
  state.moveHistory = [];
  boardRenderer = null;
  
  // Reset UI elements
  document.getElementById('host-waiting').style.display = 'none';
  document.getElementById('btn-host-start').disabled = false;
  document.getElementById('btn-host-start').textContent = '开始等待';
  document.getElementById('btn-join-connect').disabled = false;
  document.getElementById('btn-join-connect').textContent = '连接';
  document.getElementById('join-status').style.display = 'none';
  document.getElementById('move-history').innerHTML = '';
  document.getElementById('black-captures').textContent = '提子: 0';
  document.getElementById('white-captures').textContent = '提子: 0';
  document.getElementById('black-time-main').textContent = '30:00';
  document.getElementById('white-time-main').textContent = '30:00';
  document.getElementById('black-byoyomi').textContent = '读秒: 3×30s';
  document.getElementById('white-byoyomi').textContent = '读秒: 3×30s';
  document.getElementById('black-player-card').classList.remove('timed-out', 'active');
  document.getElementById('white-player-card').classList.remove('timed-out', 'active');
}

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  showScreen('home');
});
