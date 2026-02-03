const express = require('express');
const router = express.Router();
const { exportStandingsPdf, exportStandingsExcel, exportMatchesPdf } = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

router.get('/standings/:seasonId/pdf', authenticateToken, exportStandingsPdf);
router.get('/standings/:seasonId/excel', authenticateToken, exportStandingsExcel);
router.get('/matches/:seasonId/pdf', authenticateToken, exportMatchesPdf);

module.exports = router;