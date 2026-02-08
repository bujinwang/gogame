/**
 * WebSocket message protocol definitions
 */

const MSG = {
  // Connection
  JOIN: 'join',
  JOINED: 'joined',
  
  // Game lifecycle
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  
  // Turn flow
  TURN_START: 'turn_start',
  SUBMIT_MOVE: 'submit_move',
  MOVE_ACK: 'move_ack',
  TURN_RESULT: 'turn_result',
  
  // Timer
  TIME_UPDATE: 'time_update',
  
  // Actions
  RESIGN: 'resign',
  CHAT: 'chat',
  
  // Error
  ERROR: 'error',
  
  // Reconnection
  RECONNECT: 'reconnect',
  SYNC_STATE: 'sync_state'
};

/**
 * Create a protocol message
 * @param {string} type - Message type from MSG enum
 * @param {object} payload - Message payload
 * @returns {string} JSON string
 */
function createMessage(type, payload = {}) {
  return JSON.stringify({ type, ...payload, timestamp: Date.now() });
}

/**
 * Parse a protocol message
 * @param {string} data - Raw message string
 * @returns {object} Parsed message with type and payload
 */
function parseMessage(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return { type: MSG.ERROR, error: 'Invalid message format' };
  }
}

module.exports = { MSG, createMessage, parseMessage };
