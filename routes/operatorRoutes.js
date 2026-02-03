const express = require('express');
const router = express.Router();
const { 
  getMatchStateHandler,
  startMatchHandler,
  changePeriodHandler,
  controlClockHandler,
  registerEventHandler
} = require('../controllers/operatorController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/operator/match/:id/state - Obtiene el estado actual del partido
router.get('/match/:id/state', authenticateToken, getMatchStateHandler);

// POST /api/operator/match/:id/start - Inicia el partido (primera parte)
router.post('/match/:id/start', authenticateToken, startMatchHandler);

// POST /api/operator/match/:id/period - Cambia el período
router.post('/match/:id/period', authenticateToken, changePeriodHandler);

// POST /api/operator/match/:id/clock - Controla el reloj
router.post('/match/:id/clock', authenticateToken, controlClockHandler);

// POST /api/operator/match/:id/event - Registra un evento
router.post('/match/:id/event', authenticateToken, registerEventHandler);

module.exports = router;