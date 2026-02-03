/**
 * Service for managing match state in memory
 */

// In-memory storage for match states
const activeMatches = new Map();

/**
 * Initialize match state
 * @param {number} matchId - The ID of the match
 * @returns {Object} Initial match state
 */
const initializeMatchState = (matchId) => {
  const initialState = {
    matchId,
    status: 'not_started', // 'not_started', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_2', 'penalties', 'finished'
  
    clock: {
      minutes: 0,
      seconds: 0,
      addedTime: 0,       // Tiempo añadido
      isRunning: false,
      period: 'pre_match' // 'pre_match', 'first_half', 'second_half', 'extra_time_1', 'extra_time_2'
    },
  
    score: {
      home: 0,
      away: 0
    },
  
    // Eventos recientes para animaciones del overlay
    lastEvent: null
  };

  activeMatches.set(matchId, initialState);
  return initialState;
};

/**
 * Get match state
 * @param {number} matchId - The ID of the match
 * @returns {Object} Current match state
 */
const getMatchState = (matchId) => {
  return activeMatches.get(matchId) || initializeMatchState(matchId);
};

/**
 * Update match clock
 * @param {number} matchId - The ID of the match
 * @param {Object} data - Clock data
 * @param {string} data.action - 'start', 'stop', 'set'
 * @param {number} data.minutes - Minutes (optional)
 * @param {number} data.seconds - Seconds (optional)
 * @param {number} data.addedTime - Added time (optional)
 * @returns {Object} Updated match state
 */
const updateMatchClock = (matchId, data) => {
  const state = getMatchState(matchId);
  
  if (data.action === 'start') {
    state.clock.isRunning = true;
  } else if (data.action === 'stop') {
    state.clock.isRunning = false;
  } else if (data.action === 'set') {
    if (data.minutes !== undefined) state.clock.minutes = data.minutes;
    if (data.seconds !== undefined) state.clock.seconds = data.seconds;
    if (data.addedTime !== undefined) state.clock.addedTime = data.addedTime;
  }
  
  activeMatches.set(matchId, state);
  return state;
};

/**
 * Update match period
 * @param {number} matchId - The ID of the match
 * @param {string} period - New period
 * @returns {Object} Updated match state
 */
const updateMatchPeriod = (matchId, period) => {
  const state = getMatchState(matchId);
  
  state.status = period;
  
  // Update period based on status
  switch(period) {
    case 'first_half':
      state.clock.period = 'first_half';
      if (state.clock.minutes === 0 && state.clock.seconds === 0) {
        state.clock.isRunning = true; // Auto-start clock for first half
      }
      break;
    case 'half_time':
      state.clock.period = 'half_time';
      state.clock.isRunning = false; // Stop clock during half time
      break;
    case 'second_half':
      state.clock.period = 'second_half';
      state.clock.isRunning = true; // Auto-start clock for second half
      break;
    case 'extra_time_1':
      state.clock.period = 'extra_time_1';
      state.clock.isRunning = true;
      break;
    case 'extra_time_2':
      state.clock.period = 'extra_time_2';
      state.clock.isRunning = true;
      break;
    case 'penalties':
      state.clock.period = 'penalties';
      state.clock.isRunning = false; // Penalties don't use regular clock
      break;
    case 'finished':
      state.clock.period = 'post_match';
      state.clock.isRunning = false;
      break;
    default:
      state.clock.period = 'pre_match';
      state.clock.isRunning = false;
  }
  
  activeMatches.set(matchId, state);
  return state;
};

/**
 * Add match event (goal, card, substitution, etc.)
 * @param {number} matchId - The ID of the match
 * @param {Object} eventData - Event data
 * @param {string} eventData.type - 'goal', 'yellow_card', 'red_card', 'substitution', 'var'
 * @param {string} eventData.team - 'home' or 'away'
 * @param {number} eventData.playerId - ID of involved player
 * @param {number} [eventData.playerOutId] - ID of player going out (for substitutions)
 * @param {number} [eventData.minute] - Minute of event (defaults to current clock)
 * @param {string} [eventData.description] - Description of event
 * @returns {Object} Updated match state
 */
const addMatchEvent = async (matchId, eventData) => {
  const state = getMatchState(matchId);
  
  // Update score if it's a goal
  if (eventData.type === 'goal') {
    if (eventData.team === 'home') {
      state.score.home += 1;
    } else if (eventData.team === 'away') {
      state.score.away += 1;
    }
  }
  
  // Set the last event for overlay animations
  state.lastEvent = {
    type: eventData.type,
    team: eventData.team,
    playerId: eventData.playerId,
    playerOutId: eventData.playerOutId,
    minute: eventData.minute || state.clock.minutes,
    timestamp: Date.now(),
    showUntil: Date.now() + 8000, // Show animation for 8 seconds
    description: eventData.description
  };
  
  activeMatches.set(matchId, state);
  return state;
};

module.exports = {
  getMatchState,
  updateMatchClock,
  updateMatchPeriod,
  addMatchEvent,
  initializeMatchState,
  activeMatches // Export for server access if needed
};