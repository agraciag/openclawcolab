const express = require('express');
const router = express.Router();
const { getStandings } = require('../controllers/standingsController');

// GET /api/seasons/:seasonId/standings - Tabla de posiciones calculada
router.get('/:seasonId/standings', getStandings);

module.exports = router;