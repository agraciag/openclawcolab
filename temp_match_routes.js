const express = require("express");
const router = express.Router();
const { 
  getAllMatches, 
  getMatchById, 
  createMatch, 
  updateMatch, 
  deleteMatch, 
  updateMatchStatus,
  getMatchEvents,
  createMatchEvent,
  updateMatchEvent,
  deleteMatchEvent,
  getLineups,
  createLineup,
  updateLineupEntry,
  deleteLineupEntry,
  getMatchCalendar,
  getUpcomingMatches,
  getRecentMatches
} = require("../controllers/matchController");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

// Public routes
router.get("/", getAllMatches);
router.get("/:id", getMatchById);

// Protected routes (require authentication)
router.post("/", authenticateToken, authorizeRole(["admin", "operator"]), createMatch);
router.put("/:id", authenticateToken, authorizeRole(["admin", "operator"]), updateMatch);
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), deleteMatch);

// Special route for updating match status
router.patch("/:id/status", authenticateToken, authorizeRole(["admin", "operator"]), updateMatchStatus);

// Routes for match events
router.get("/:matchId/events", getMatchEvents);
router.post("/:matchId/events", authenticateToken, authorizeRole(["admin", "operator"]), createMatchEvent);
router.put("/:matchId/events/:id", authenticateToken, authorizeRole(["admin", "operator"]), updateMatchEvent);
router.delete("/:matchId/events/:id", authenticateToken, authorizeRole(["admin"]), deleteMatchEvent);

// Routes for match lineups
router.get("/:matchId/lineups", getLineups);
router.post("/:matchId/lineups", authenticateToken, authorizeRole(["admin", "operator"]), createLineup);
router.put("/:matchId/lineups/:id", authenticateToken, authorizeRole(["admin", "operator"]), updateLineupEntry);
router.delete("/:matchId/lineups/:id", authenticateToken, authorizeRole(["admin", "operator"]), deleteLineupEntry);

// Routes for match calendar and lists
router.get("/calendar", getMatchCalendar);
router.get("/upcoming", getUpcomingMatches);
router.get("/recent", getRecentMatches);

module.exports = router;