/**
 * 同步围棋 (Simultaneous Go)
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 */
const dgram = require('dgram');
const os = require('os');

const DISCOVERY_PORT = 38766;
const BROADCAST_INTERVAL = 2000; // Broadcast every 2 seconds
const ROOM_TIMEOUT = 6000;       // Room expires after 6 seconds without broadcast

class LANDiscovery {
  constructor() {
    this.broadcastSocket = null;
    this.listenSocket = null;
    this.broadcastTimer = null;
    this.roomCleanupTimer = null;
    this.discoveredRooms = new Map(); // key: `${host}:${port}` -> room info
    this.onRoomFound = null;
    this.onRoomLost = null;
  }

  /**
   * Get all local IPv4 addresses
   * @returns {string[]}
   */
  _getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
    return ips;
  }

  /**
   * Get broadcast addresses for all network interfaces
   * @returns {string[]}
   */
  _getBroadcastAddresses() {
    const interfaces = os.networkInterfaces();
    const broadcasts = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal && iface.netmask) {
          // Calculate broadcast address from IP and netmask
          const ipParts = iface.address.split('.').map(Number);
          const maskParts = iface.netmask.split('.').map(Number);
          const broadcastParts = ipParts.map((ip, i) => (ip | (~maskParts[i] & 255)));
          broadcasts.push(broadcastParts.join('.'));
        }
      }
    }
    // Always include the generic broadcast address
    if (!broadcasts.includes('255.255.255.255')) {
      broadcasts.push('255.255.255.255');
    }
    return broadcasts;
  }

  /**
   * Start broadcasting room availability (used by host)
   * @param {object} roomInfo - { hostName, port, baseTime }
   */
  startBroadcast(roomInfo) {
    this.stopBroadcast();

    try {
      this.broadcastSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      
      this.broadcastSocket.on('error', (err) => {
        console.error('[Discovery] Broadcast socket error:', err.message);
      });

      this.broadcastSocket.bind(() => {
        this.broadcastSocket.setBroadcast(true);

        const localIPs = this._getLocalIPs();
        const broadcastAddresses = this._getBroadcastAddresses();
        const message = JSON.stringify({
          type: 'gogame-room',
          version: 1,
          hostName: roomInfo.hostName,
          hostIPs: localIPs,
          port: roomInfo.port,
          baseTime: roomInfo.baseTime,
          timestamp: Date.now()
        });

        const buf = Buffer.from(message);

        // Broadcast immediately, then on interval
        const doBroadcast = () => {
          for (const addr of broadcastAddresses) {
            try {
              this.broadcastSocket.send(buf, 0, buf.length, DISCOVERY_PORT, addr);
            } catch (e) {
              // Ignore send errors for individual broadcast addresses
            }
          }
        };

        doBroadcast();
        this.broadcastTimer = setInterval(doBroadcast, BROADCAST_INTERVAL);
        console.log('[Discovery] Broadcasting room on port', DISCOVERY_PORT);
      });
    } catch (err) {
      console.error('[Discovery] Failed to start broadcast:', err.message);
    }
  }

  /**
   * Stop broadcasting
   */
  stopBroadcast() {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = null;
    }
    if (this.broadcastSocket) {
      try { this.broadcastSocket.close(); } catch (e) { /* ignore */ }
      this.broadcastSocket = null;
    }
  }

  /**
   * Start scanning for rooms (used by joiner)
   * @param {function} onRoomFound - Called when a new room is discovered: (room) => {}
   * @param {function} onRoomLost - Called when a room is no longer available: (roomKey) => {}
   */
  startScan(onRoomFound, onRoomLost) {
    this.stopScan();

    this.onRoomFound = onRoomFound;
    this.onRoomLost = onRoomLost;
    this.discoveredRooms.clear();

    try {
      this.listenSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      this.listenSocket.on('error', (err) => {
        console.error('[Discovery] Listen socket error:', err.message);
      });

      this.listenSocket.on('message', (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type !== 'gogame-room' || data.version !== 1) return;

          // Use the sender's actual IP (rinfo.address) as the primary host
          const hostIP = rinfo.address;
          const roomKey = `${hostIP}:${data.port}`;

          const room = {
            key: roomKey,
            hostName: data.hostName,
            host: hostIP,
            hostIPs: data.hostIPs || [hostIP],
            port: data.port,
            baseTime: data.baseTime,
            lastSeen: Date.now()
          };

          const isNew = !this.discoveredRooms.has(roomKey);
          this.discoveredRooms.set(roomKey, room);

          if (isNew && this.onRoomFound) {
            this.onRoomFound(room);
          }
        } catch (e) {
          // Ignore malformed packets
        }
      });

      this.listenSocket.bind(DISCOVERY_PORT, () => {
        console.log('[Discovery] Scanning for rooms on port', DISCOVERY_PORT);
      });

      // Periodically clean up stale rooms
      this.roomCleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, room] of this.discoveredRooms) {
          if (now - room.lastSeen > ROOM_TIMEOUT) {
            this.discoveredRooms.delete(key);
            if (this.onRoomLost) {
              this.onRoomLost(key);
            }
          }
        }
      }, ROOM_TIMEOUT / 2);
    } catch (err) {
      console.error('[Discovery] Failed to start scan:', err.message);
    }
  }

  /**
   * Stop scanning for rooms
   */
  stopScan() {
    if (this.roomCleanupTimer) {
      clearInterval(this.roomCleanupTimer);
      this.roomCleanupTimer = null;
    }
    if (this.listenSocket) {
      try { this.listenSocket.close(); } catch (e) { /* ignore */ }
      this.listenSocket = null;
    }
    this.discoveredRooms.clear();
    this.onRoomFound = null;
    this.onRoomLost = null;
  }

  /**
   * Get currently discovered rooms
   * @returns {object[]}
   */
  getRooms() {
    return Array.from(this.discoveredRooms.values());
  }

  /**
   * Clean up all resources
   */
  destroy() {
    this.stopBroadcast();
    this.stopScan();
  }
}

module.exports = LANDiscovery;
