const { 
  getMatchState, 
  updateMatchClock, 
  updateMatchPeriod, 
  addMatchEvent,
  initializeMatchState
} = require('../services/matchStateService');

/**
 * Get the current state of a match
 */
const getMatchStateHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);
    
    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    
    const state = getMatchState(matchId);
    
    res.json(state);
  } catch (error) {
    console.error('Error getting match state:', error);
    res.status(500).json({ error: 'Failed to get match state' });
  }
};

/**
 * Start a match (begin first half)
 */
const startMatchHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);
    
    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    
    // Update period to first half
    const state = updateMatchPeriod(matchId, 'first_half');
    
    res.json({ success: true, state });
  } catch (error) {
    console.error('Error starting match:', error);
    res.status(500).json({ error: 'Failed to start match' });
  }
};

/**
 * Change the current period of the match
 */
const changePeriodHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.body;
    const matchId = parseInt(id);
    
    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    
    if (!period) {
      return res.status(400).json({ error: 'Period is required' });
    }
    
    const validPeriods = ['not_started', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_2', 'penalties', 'finished'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: `Invalid period. Valid values: ${validPeriods.join(', ')}` });
    }
    
    const state = updateMatchPeriod(matchId, period);
    
    res.json({ success: true, state });
  } catch (error) {
    console.error('Error changing period:', error);
    res.status(500).json({ error: 'Failed to change period' });
  }
};

/**
 * Control the match clock
 */
const controlClockHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, minutes, seconds, addedTime } = req.body;
    const matchId = parseInt(id);
    
    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }
    
    const validActions = ['start', 'stop', 'set'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Valid values: ${validActions.join(', ')}` });
    }
    
    const clockData = { action };
    if (minutes !== undefined) clockData.minutes = minutes;
    if (seconds !== undefined) clockData.seconds = seconds;
    if (addedTime !== undefined) clockData.addedTime = addedTime;
    
    const state = updateMatchClock(matchId, clockData);
    
    res.json({ success: true, state });
  } catch (error) {
    console.error('Error controlling clock:', error);
    res.status(500).json({ error: 'Failed to control clock' });
  }
};

/**
 * Register a match event (goal, card, substitution, etc.)
 */
const registerEventHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const eventData = req.body;
    const matchId = parseInt(id);
    
    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    
    if (!eventData.type) {
      return res.status(400).json({ error: 'Event type is required' });
    }
    
    if (!eventData.team) {
      return res.status(400).json({ error: 'Team is required' });
    }
    
    if (!eventData.playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }
    
    const validTypes = ['goal', 'yellow_card', 'red_card', 'substitution', 'var'];
    if (!validTypes.includes(eventData.type)) {
      return res.status(400).json({ error: `Invalid event type. Valid values: ${validTypes.join(', ')}` });
    }
    
    const validTeams = ['home', 'away'];
    if (!validTeams.includes(eventData.team)) {
      return res.status(400).json({ error: `Invalid team. Valid values: ${validTeams.join(', ')}` });
    }
    
    // Add the event to the match state
    const state = await addMatchEvent(matchId, eventData);
    
    res.json({ success: true, state });
  } catch (error) {
    console.error('Error registering event:', error);
    res.status(500).json({ error: 'Failed to register event' });
  }
};

module.exports = {
  getMatchStateHandler,
  startMatchHandler,
  changePeriodHandler,
  controlClockHandler,
  registerEventHandler
};