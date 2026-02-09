/**
 * Signaling Handler - Manages WebSocket signaling for WebRTC connection establishment
 */

const { WebSocket } = require('ws');
const { MSG, createMessage, parseMessage } = require('../../shared/protocol');

class SignalingHandler {
  constructor() {
    this.ws = null;
    this.onMessageCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.sessionId = null;
    this.playerName = null;
  }

  /**
   * Connect to the signaling server
   * @param {string} host - Signaling server host
   * @param {number} port - Signaling server port
   * @param {string} playerName - Player's name
   * @param {string} sessionId - Optional session ID to join
   * @returns {Promise<boolean>} - Connection success
   */
  async connect(host, port, playerName, sessionId = null) {
    return new Promise((resolve, reject) => {
      try {
        this.playerName = playerName;
        this.sessionId = sessionId;
        
        // Connect to WebSocket server
        this.ws = new WebSocket(`ws://${host}:${port}`);
        
        this.ws.on('open', () => {
          console.log('Signaling connection opened');
          
          // Send join message
          const joinMessage = {
            type: MSG.JOIN,
            playerName: this.playerName,
            sessionId: this.sessionId
          };
          
          this.ws.send(createMessage(joinMessage.type, {
            playerName: joinMessage.playerName,
            sessionId: joinMessage.sessionId
          }));
          
          if (this.onConnectionStateChangeCallback) {
            this.onConnectionStateChangeCallback('connected');
          }
          
          resolve(true);
        });
        
        this.ws.on('message', (data) => {
          const message = parseMessage(data.toString());
          this._handleMessage(message);
        });
        
        this.ws.on('close', () => {
          console.log('Signaling connection closed');
          if (this.onConnectionStateChangeCallback) {
            this.onConnectionStateChangeCallback('disconnected');
          }
        });
        
        this.ws.on('error', (error) => {
          console.error('Signaling connection error:', error);
          if (this.onConnectionStateChangeCallback) {
            this.onConnectionStateChangeCallback('error');
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send message through signaling channel
   * @param {object} message - Message to send
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(createMessage(message.type, message));
    } else {
      console.warn('Signaling channel not open, cannot send message');
    }
  }

  /**
   * Set callback for incoming messages
   * @param {function} callback - Function to call when message received
   */
  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  /**
   * Set callback for connection state changes
   * @param {function} callback - Function to call when connection state changes
   */
  onConnectionStateChange(callback) {
    this.onConnectionStateChangeCallback = callback;
  }

  /**
   * Close the signaling connection
   */
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Handle incoming messages from signaling server
   * @param {object} message - Received message
   */
  _handleMessage(message) {
    // Forward WebRTC signaling messages to WebRTC manager
    if (['offer', 'answer', 'ice-candidate'].includes(message.type)) {
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
      return;
    }
    
    // Handle game-specific signaling messages
    switch (message.type) {
      case MSG.JOINED:
        console.log('Joined session:', message.sessionId);
        this.sessionId = message.sessionId;
        break;
        
      case 'session-created':
        console.log('Session created:', message.sessionId);
        this.sessionId = message.sessionId;
        break;
        
      case 'peer-joined':
        console.log('Peer joined session:', message.peerName);
        // This would trigger WebRTC connection establishment
        break;
        
      default:
        // Forward other messages to the application
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
    }
  }
}

module.exports = SignalingHandler;