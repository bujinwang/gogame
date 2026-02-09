/**
 * Preload script - Context bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gameAPI', {
  // Game actions - WebSocket (LAN)
  hostGame: (settings) => ipcRenderer.invoke('host-game', settings),
  joinGame: (settings) => ipcRenderer.invoke('join-game', settings),
  
  // Game actions - WebRTC (P2P)
  hostWebRTCGame: (settings) => ipcRenderer.invoke('host-webrtc-game', settings),
  joinWebRTCGame: (settings) => ipcRenderer.invoke('join-webrtc-game', settings),
  
  // Game actions - AI
  startAIGame: (settings) => ipcRenderer.invoke('start-ai-game', settings),
  
  // In-game actions
  submitMove: (move) => ipcRenderer.invoke('submit-move', move),
  resign: () => ipcRenderer.invoke('resign'),
  sendChat: (message) => ipcRenderer.invoke('send-chat', message),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  getLocalIPs: () => ipcRenderer.invoke('get-local-ips'),

  // Event listeners
  onGameMessage: (callback) => {
    ipcRenderer.on('game-message', (event, data) => callback(data));
  },
  onServerLog: (callback) => {
    ipcRenderer.on('server-log', (event, msg) => callback(msg));
  },
  onConnectionLost: (callback) => {
    ipcRenderer.on('connection-lost', () => callback());
  },

  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('game-message');
    ipcRenderer.removeAllListeners('server-log');
    ipcRenderer.removeAllListeners('connection-lost');
  }
});
