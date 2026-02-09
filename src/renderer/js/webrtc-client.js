/**
 * 同步围棋 (Simultaneous Go)
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin) | Version: 三宝001版
 * All rights reserved.
 */
class WebRTCClient {
  constructor() {
    this.peerConnection = null;
    this.dataChannel = null;
    this.onMessageCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.isHost = false;
    
    // STUN servers for NAT traversal
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }

  /**
   * Create a new peer connection (for the offerer/host)
   * @returns {Promise<object>} - The offer SDP
   */
  async createPeerConnection() {
    this.isHost = true;
    this.peerConnection = new RTCPeerConnection(this.configuration);

    // Set up event handlers
    this._setupPeerConnectionEvents();

    // Create data channel for game communication
    this.dataChannel = this.peerConnection.createDataChannel('game-data', {
      ordered: true,
      negotiated: false
    });

    this._setupDataChannelEvents();

    // Create offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    return offer;
  }

  /**
   * Handle incoming offer (for the answerer/joiner)
   * @param {object} offer - SDP offer from remote peer
   * @returns {Promise<object>} - The answer SDP
   */
  async handleOffer(offer) {
    this.isHost = false;
    this.peerConnection = new RTCPeerConnection(this.configuration);

    // Set up event handlers
    this._setupPeerConnectionEvents();

    // Listen for data channel
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this._setupDataChannelEvents();
    };

    // Set remote description
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Create answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    return answer;
  }

  /**
   * Handle answer from remote peer
   * @param {object} answer - SDP answer
   */
  async handleAnswer(answer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle ICE candidate from remote peer
   * @param {object} candidate - ICE candidate
   */
  async handleIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  /**
   * Send message through data channel
   * @param {object} message - Message to send
   */
  sendMessage(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    } else {
      console.warn('Data channel not open, cannot send message');
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
   * Set callback for ICE candidates
   * @param {function} callback - Function to call when ICE candidate is generated
   */
  onIceCandidate(callback) {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }

  /**
   * Check if data channel is open
   * @returns {boolean}
   */
  isConnected() {
    return this.dataChannel && this.dataChannel.readyState === 'open';
  }

  /**
   * Close the peer connection
   */
  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  /**
   * Set up peer connection event handlers
   */
  _setupPeerConnectionEvents() {
    this.peerConnection.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', this.peerConnection.connectionState);
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.iceConnectionState);
      }
    };

    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection.signalingState);
    };
  }

  /**
   * Set up data channel event handlers
   */
  _setupDataChannelEvents() {
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback('connected');
      }
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback('disconnected');
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback('error');
      }
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebRTCClient;
}
