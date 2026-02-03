const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const playerRoutes = require("./routes/playerRoutes");
const matchRoutes = require("./routes/matchRoutes");
const venueRoutes = require("./routes/venueRoutes");
const seasonRoutes = require("./routes/seasonRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/matches", matchRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/seasons", seasonRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export", exportRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Sports Manager Backend API", version: "1.0.0" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
  console.log("API endpoints:");
  console.log("  GET / - API Info");
  console.log("  GET /health - Health Check");
  console.log("  POST /api/auth/register - Register new user");
  console.log("  POST /api/auth/login - Login user");
  console.log("  GET /api/auth/profile - Get user profile (requires auth)");
  console.log("  PUT /api/auth/profile - Update user profile (requires auth)");
  console.log("  POST /api/auth/logout - Logout user (requires auth)");
  console.log("  GET /api/teams - Get all teams (public)");
  console.log("  GET /api/teams/:id - Get team by ID (public)");
  console.log("  POST /api/teams - Create new team (requires auth, admin/operator)");
  console.log("  PUT /api/teams/:id - Update team (requires auth, admin/operator)");
  console.log("  DELETE /api/teams/:id - Delete team (requires auth, admin)");
  console.log("  GET /api/players - Get all players (public)");
  console.log("  GET /api/players/:id - Get player by ID (public)");
  console.log("  POST /api/players - Create new player (requires auth, admin/operator)");
  console.log("  PUT /api/players/:id - Update player (requires auth, admin/operator)");
  console.log("  DELETE /api/players/:id - Delete player (requires auth, admin)");
    console.log("  GET /api/tournaments - Get all tournaments (public)");
    console.log("  GET /api/matches - Get all matches (public)");
    console.log("  GET /api/matches/:id - Get match by ID (public)");
    console.log("  POST /api/matches - Create new match (requires auth, admin/operator)");
    console.log("  PUT /api/matches/:id - Update match (requires auth, admin/operator)");
    console.log("  DELETE /api/matches/:id - Delete match (requires auth, admin)");
    console.log("  PATCH /api/matches/:id/status - Update match status (requires auth, admin/operator)");
    console.log("  GET /api/venues - Get all venues (public)");
    console.log("  GET /api/venues/:id - Get venue by ID (public)");
    console.log("  POST /api/venues - Create new venue (requires auth, admin/operator)");
    console.log("  PUT /api/venues/:id - Update venue (requires auth, admin/operator)");
    console.log("  DELETE /api/venues/:id - Delete venue (requires auth, admin)");
    console.log("  GET /api/seasons - Get all seasons (public)");
    console.log("  GET /api/seasons/:id - Get season by ID (public)");
    console.log("  POST /api/seasons - Create new season (requires auth, admin/operator)");
    console.log("  PUT /api/seasons/:id - Update season (requires auth, admin/operator)");
    console.log("  DELETE /api/seasons/:id - Delete season (requires auth, admin)");
     console.log("  GET /api/tournaments/:id - Get tournament by ID (public)");
     console.log("  POST /api/tournaments - Create new tournament (requires auth, admin/operator)");
     console.log("  PUT /api/tournaments/:id - Update tournament (requires auth, admin/operator)");
     console.log("  DELETE /api/tournaments/:id - Delete tournament (requires auth, admin)");
     console.log("  GET /api/export/standings/:seasonId/pdf - Export standings as PDF (requires auth)");
     console.log("  GET /api/export/standings/:seasonId/excel - Export standings as Excel (requires auth)");
     console.log("  GET /api/export/matches/:seasonId/pdf - Export matches as PDF (requires auth)");
});

module.exports = app;
