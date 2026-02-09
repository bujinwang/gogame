/**
 * 同步围棋 (Simultaneous Go) - Preload Script
 * Context bridge between main and renderer processes
 * 
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin)
 * Version: 三宝001版 (v1.0.0-sanbao001)
 * 
 * All rights reserved.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gameAPI', {
  // Game actions - WebSocket (LAN)
  hostGame: (settings) => ipcRenderer.invoke('host-game', settings),
  joinGame: (settings) => ipcRenderer.invoke('join-game', settings),
  
  // Game actions - WebRTC (P2P)
  hostWebRTCGame: (settings) => ipcRenderer.invoke('host-webrtc-game', settings),
  joinWebRTCGame: (settings) => ipcRenderer.invoke('join-webrtc-game', settings),
  
  // WebRTC signaling
  sendWebRTCSignal: (signal) => ipcRenderer.invoke('send-webrtc-signal', signal),
  
  // Game actions - AI
  startAIGame: (settings) => ipcRenderer.invoke('start-ai-game', settings),
  
  // LAN Room Discovery
  startRoomScan: () => ipcRenderer.invoke('start-room-scan'),
  stopRoomScan: () => ipcRenderer.invoke('stop-room-scan'),
  stopRoomBroadcast: () => ipcRenderer.invoke('stop-room-broadcast'),
  
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
  onWebRTCConnectionState: (callback) => {
    ipcRenderer.on('webrtc-connection-state', (event, state) => callback(state));
  },
  onWebRTCError: (callback) => {
    ipcRenderer.on('webrtc-error', (event, error) => callback(error));
  },
  onWebRTCSignal: (callback) => {
    ipcRenderer.on('webrtc-signal', (event, signal) => callback(signal));
  },
  onRoomFound: (callback) => {
    ipcRenderer.on('room-found', (event, room) => callback(room));
  },
  onRoomLost: (callback) => {
    ipcRenderer.on('room-lost', (event, roomKey) => callback(roomKey));
  },

  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('game-message');
    ipcRenderer.removeAllListeners('server-log');
    ipcRenderer.removeAllListeners('connection-lost');
    ipcRenderer.removeAllListeners('webrtc-connection-state');
    ipcRenderer.removeAllListeners('webrtc-error');
    ipcRenderer.removeAllListeners('room-found');
    ipcRenderer.removeAllListeners('room-lost');
  }
});
