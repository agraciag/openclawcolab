const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Get all matches with pagination and filtering
const getAllMatches = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, season_id, team_id, status, date_from, date_to } = req.query;
    
    // Build where clause based on filters
    const whereClause = {
      deleted_at: null, // Only show non-deleted matches
      ...(search && { 
        OR: [
          { home_team: { name: { contains: search, mode: "insensitive" } } },
          { away_team: { name: { contains: search, mode: "insensitive" } } },
          { venue: { name: { contains: search, mode: "insensitive" } } }
        ]
      }),
      ...(season_id && { season_id: parseInt(season_id) }),
      ...(status && { status: { contains: status, mode: "insensitive" } }),
      ...(date_from && { match_date: { gte: new Date(date_from) } }),
      ...(date_to && { match_date: { lte: new Date(date_to) } }),
      // Filter by team (either home or away)
      ...(team_id && {
        OR: [
          { home_team_id: parseInt(team_id) },
          { away_team_id: parseInt(team_id) }
        ]
      })
    };

    // Get matches with pagination
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        home_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        away_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true
          }
        },
        season: {
          select: {
            id: true,
            name: true,
            tournament: {
              select: {
                name: true
              }
            }
          }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { match_date: "desc" }
    });

    // Get total count for pagination metadata
    const totalMatches = await prisma.match.count({ where: whereClause });

    res.json({
      data: matches,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMatches / parseInt(limit)),
        totalMatches,
        hasNextPage: parseInt(page) * parseInt(limit) < totalMatches,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Get all matches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get match by ID with teams, venue, events, and lineups
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the match with related data
    const match = await prisma.match.findUnique({
      where: { id: parseInt(id), deleted_at: null },
      include: {
        home_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        away_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true
          }
        },
        season: {
          select: {
            id: true,
            name: true,
            tournament: {
              select: {
                name: true
              }
            }
          }
        },
        events: {
          include: {
            player: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            },
            event_type: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: { minute: "asc" }
        },
        lineupEntries: {
          include: {
            player: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                display_name: true
              }
            },
            position: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json(match);
  } catch (error) {
    console.error("Get match by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new match
const createMatch = async (req, res) => {
  try {
    const {
      season_id,
      home_team_id,
      away_team_id,
      venue_id,
      match_date,
      round,
      matchday,
      attendance,
      referee,
      notes
    } = req.body;

    // Validate required fields
    if (!season_id || !home_team_id || !away_team_id || !match_date) {
      return res.status(400).json({ error: "Season ID, home team ID, away team ID, and match date are required" });
    }

    // Check if season exists
    const season = await prisma.season.findUnique({
      where: { id: parseInt(season_id), deleted_at: null }
    });

    if (!season) {
      return res.status(404).json({ error: "Season not found" });
    }

    // Check if teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: parseInt(home_team_id), deleted_at: null } }),
      prisma.team.findUnique({ where: { id: parseInt(away_team_id), deleted_at: null } })
    ]);

    if (!homeTeam) {
      return res.status(404).json({ error: "Home team not found" });
    }

    if (!awayTeam) {
      return res.status(404).json({ error: "Away team not found" });
    }

    if (home_team_id === away_team_id) {
      return res.status(400).json({ error: "Home team and away team cannot be the same" });
    }

    // Check if venue exists if provided
    if (venue_id) {
      const venue = await prisma.venue.findUnique({
        where: { id: parseInt(venue_id), deleted_at: null }
      });

      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }
    }

    // Create the match
    const match = await prisma.match.create({
      data: {
        season_id: parseInt(season_id),
        home_team_id: parseInt(home_team_id),
        away_team_id: parseInt(away_team_id),
        venue_id: venue_id ? parseInt(venue_id) : null,
        match_date: new Date(match_date),
        round: round || null,
        matchday: matchday ? parseInt(matchday) : null,
        attendance: attendance ? parseInt(attendance) : null,
        referee: referee || null,
        notes: notes || null
      }
    });

    res.status(201).json({
      message: "Match created successfully",
      match
    });
  } catch (error) {
    console.error("Create match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a match
const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      season_id,
      home_team_id,
      away_team_id,
      venue_id,
      match_date,
      status,
      home_score,
      away_score,
      round,
      matchday,
      attendance,
      referee,
      notes
    } = req.body;

    // Check if match exists
    const existingMatch = await prisma.match.findUnique({
      where: { id: parseInt(id), deleted_at: null }
    });

    if (!existingMatch) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Check if teams exist if provided
    if (home_team_id) {
      const homeTeam = await prisma.team.findUnique({
        where: { id: parseInt(home_team_id), deleted_at: null }
      });

      if (!homeTeam) {
        return res.status(404).json({ error: "Home team not found" });
      }
    }

    if (away_team_id) {
      const awayTeam = await prisma.team.findUnique({
        where: { id: parseInt(away_team_id), deleted_at: null }
      });

      if (!awayTeam) {
        return res.status(404).json({ error: "Away team not found" });
      }

      if (home_team_id === away_team_id) {
        return res.status(400).json({ error: "Home team and away team cannot be the same" });
      }
    }

    // Check if venue exists if provided
    if (venue_id) {
      const venue = await prisma.venue.findUnique({
        where: { id: parseInt(venue_id), deleted_at: null }
      });

      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }
    }

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id: parseInt(id) },
      data: {
        ...(season_id !== undefined && { season_id: parseInt(season_id) }),
        ...(home_team_id !== undefined && { home_team_id: parseInt(home_team_id) }),
        ...(away_team_id !== undefined && { away_team_id: parseInt(away_team_id) }),
        ...(venue_id !== undefined && { venue_id: parseInt(venue_id) }),
        ...(match_date !== undefined && { match_date: new Date(match_date) }),
        ...(status !== undefined && { status }),
        ...(home_score !== undefined && { home_score: parseInt(home_score) }),
        ...(away_score !== undefined && { away_score: parseInt(away_score) }),
        ...(round !== undefined && { round }),
        ...(matchday !== undefined && { matchday: parseInt(matchday) }),
        ...(attendance !== undefined && { attendance: parseInt(attendance) }),
        ...(referee !== undefined && { referee }),
        ...(notes !== undefined && { notes })
      }
    });

    res.json({
      message: "Match updated successfully",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Update match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a match (soft delete)
const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if match exists
    const existingMatch = await prisma.match.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMatch) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Perform soft delete by setting deleted_at
    const deletedMatch = await prisma.match.update({
      where: { id: parseInt(id) },
      data: { deleted_at: new Date() }
    });

    res.json({
      message: "Match deleted successfully",
      match: deletedMatch
    });
  } catch (error) {
    console.error("Delete match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update match status
const updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if match exists
    const existingMatch = await prisma.match.findUnique({
      where: { id: parseInt(id), deleted_at: null }
    });

    if (!existingMatch) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Validate status
    const validStatuses = ["scheduled", "live", "finished", "postponed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be one of: " + validStatuses.join(", ") });
    }

    // Update the match status
    const updatedMatch = await prisma.match.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({
      message: "Match status updated successfully",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Update match status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get lineups for a match
const getLineups = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Get the match to verify it exists
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId), deleted_at: null },
      include: {
        home_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        away_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Get all lineup entries for the match
    const lineupEntries = await prisma.lineupEntry.findMany({
      where: {
        match_id: parseInt(matchId),
        deleted_at: null
      },
      include: {
        player: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        position: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      },
      orderBy: [
        { is_starter: "desc" }, // Starters first
        { shirt_number: "asc" }
      ]
    });

    // Organize the lineup entries by team
    const homeStarters = lineupEntries.filter(entry => 
      entry.team_id === match.home_team.id && entry.is_starter);
    const homeSubstitutes = lineupEntries.filter(entry => 
      entry.team_id === match.home_team.id && !entry.is_starter);
    const awayStarters = lineupEntries.filter(entry => 
      entry.team_id === match.away_team.id && entry.is_starter);
    const awaySubstitutes = lineupEntries.filter(entry => 
      entry.team_id === match.away_team.id && !entry.is_starter);

    // Format the response
    const response = {
      home_team: {
        team: match.home_team,
        starters: homeStarters.map(entry => ({
          player: entry.player,
          position: entry.position,
          shirt_number: entry.shirt_number
        })),
        substitutes: homeSubstitutes.map(entry => ({
          player: entry.player,
          position: entry.position,
          shirt_number: entry.shirt_number
        }))
      },
      away_team: {
        team: match.away_team,
        starters: awayStarters.map(entry => ({
          player: entry.player,
          position: entry.position,
          shirt_number: entry.shirt_number
        })),
        substitutes: awaySubstitutes.map(entry => ({
          player: entry.player,
          position: entry.position,
          shirt_number: entry.shirt_number
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Get lineups error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create/update lineup for a match
const createLineup = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { team_id, players } = req.body;

    // Validate required fields
    if (!team_id || !players || !Array.isArray(players)) {
      return res.status(400).json({ error: "Team ID and players array are required" });
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId), deleted_at: null }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: parseInt(team_id), deleted_at: null }
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Validate that the team is one of the match teams
    if (team_id !== match.home_team_id && team_id !== match.away_team_id) {
      return res.status(400).json({ error: "Team is not participating in this match" });
    }

    // Validate players belong to the team and check for duplicates
    const playerIds = players.map(p => p.player_id);
    if (new Set(playerIds).size !== playerIds.length) {
      return res.status(400).json({ error: "Duplicate players in lineup" });
    }

    // Check if players belong to the team through PlayerTeam relationship
    const playerTeams = await prisma.playerTeam.findMany({
      where: {
        team_id: parseInt(team_id),
        player_id: { in: playerIds },
        OR: [
          { end_date: null },
          { end_date: { gte: match.match_date } }
        ]
      }
    });

    const validPlayerIds = playerTeams.map(pt => pt.player_id);
    const invalidPlayers = playerIds.filter(id => !validPlayerIds.includes(id));

    if (invalidPlayers.length > 0) {
      return res.status(400).json({ 
        error: `Players with IDs ${invalidPlayers.join(', ')} do not belong to this team` 
      });
    }

    // Count starters and substitutes
    const startersCount = players.filter(p => p.is_starter).length;
    const substitutesCount = players.filter(p => !p.is_starter).length;

    if (startersCount > 11) {
      return res.status(400).json({ error: "Maximum 11 starters allowed" });
    }

    if (substitutesCount > 9) {
      return res.status(400).json({ error: "Maximum 9 substitutes allowed" });
    }

    // Delete existing lineup for this team in this match
    await prisma.lineupEntry.updateMany({
      where: {
        match_id: parseInt(matchId),
        team_id: parseInt(team_id),
        deleted_at: null
      },
      data: {
        deleted_at: new Date()
      }
    });

    // Create new lineup entries
    const lineupPromises = players.map(playerData => {
      return prisma.lineupEntry.create({
        data: {
          match_id: parseInt(matchId),
          team_id: parseInt(team_id),
          player_id: parseInt(playerData.player_id),
          position_id: playerData.position_id ? parseInt(playerData.position_id) : null,
          is_starter: playerData.is_starter,
          shirt_number: playerData.shirt_number ? parseInt(playerData.shirt_number) : null
        }
      });
    });

    const newLineupEntries = await Promise.all(lineupPromises);

    res.status(201).json({
      message: "Lineup created successfully",
      lineup: newLineupEntries
    });
  } catch (error) {
    console.error("Create lineup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a lineup entry
const updateLineupEntry = async (req, res) => {
  try {
    const { matchId, id } = req.params;
    const { position_id, is_starter, shirt_number } = req.body;

    // Check if lineup entry exists
    const existingEntry = await prisma.lineupEntry.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: "Lineup entry not found" });
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId), deleted_at: null }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Check if the entry belongs to this match
    if (existingEntry.match_id !== parseInt(matchId)) {
      return res.status(400).json({ error: "Lineup entry does not belong to this match" });
    }

    // Validate position if provided
    if (position_id) {
      const position = await prisma.position.findUnique({
        where: { id: parseInt(position_id) }
      });

      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
    }

    // Update the lineup entry
    const updatedEntry = await prisma.lineupEntry.update({
      where: { id: parseInt(id) },
      data: {
        ...(position_id !== undefined && { position_id: parseInt(position_id) }),
        ...(is_starter !== undefined && { is_starter }),
        ...(shirt_number !== undefined && { shirt_number: parseInt(shirt_number) })
      }
    });

    res.json({
      message: "Lineup entry updated successfully",
      entry: updatedEntry
    });
  } catch (error) {
    console.error("Update lineup entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a lineup entry
const deleteLineupEntry = async (req, res) => {
  try {
    const { matchId, id } = req.params;

    // Check if lineup entry exists
    const existingEntry = await prisma.lineupEntry.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: "Lineup entry not found" });
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId), deleted_at: null }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Check if the entry belongs to this match
    if (existingEntry.match_id !== parseInt(matchId)) {
      return res.status(400).json({ error: "Lineup entry does not belong to this match" });
    }

    // Soft delete the lineup entry
    const deletedEntry = await prisma.lineupEntry.update({
      where: { id: parseInt(id) },
      data: { deleted_at: new Date() }
    });

    res.json({
      message: "Lineup entry removed successfully",
      entry: deletedEntry
    });
  } catch (error) {
    console.error("Delete lineup entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================
// MATCH EVENTS
// ============================================

// Get all events for a match
const getMatchEvents = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId), deleted_at: null }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Get all events for the match
    const events = await prisma.matchEvent.findMany({
      where: {
        match_id: parseInt(matchId)
      },
      include: {
        player: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            display_name: true
          }
        },
        secondary_player: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            display_name: true
          }
        },
        event_type: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            affects_score: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        }
      },
      orderBy: [
        { period: "asc" },
        { minute: "asc" },
        { second: "asc" }
      ]
    });

    res.json({
      match_id: parseInt(matchId),
      home_score: match.home_score,
      away_score: match.away_score,
      events
    });
  } catch (error) {
    console.error("Get match events error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a match event
const createMatchEvent = async (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      team_id,
      event_type_id,
      player_id,
      secondary_player_id,
      minute,
      second,
      period,
      details,
      notes
    } = req.body;

    // Validate required fields
    if (!team_id || !event_type_id || !minute) {
      return res.status(400).json({ error: "Team ID, event type ID, and minute are required" });
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId), deleted_at: null }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Validate match is in play
    if (match.status === "finished" || match.status === "cancelled") {
      return res.status(400).json({ error: "Cannot add events to a finished or cancelled match" });
    }

    // Check if team exists and is in this match
    const team = await prisma.team.findUnique({
      where: { id: parseInt(team_id), deleted_at: null }
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (team_id !== match.home_team_id && team_id !== match.away_team_id) {
      return res.status(400).json({ error: "Team is not participating in this match" });
    }

    // Check if event type exists
    const eventType = await prisma.eventType.findUnique({
      where: { id: parseInt(event_type_id) }
    });

    if (!eventType) {
      return res.status(404).json({ error: "Event type not found" });
    }

    // Validate player if required by event type
    if (eventType.requires_player && !player_id) {
      return res.status(400).json({ error: "This event type requires a player" });
    }

    // Check if player exists and is in lineup
    if (player_id) {
      const player = await prisma.player.findUnique({
        where: { id: parseInt(player_id), deleted_at: null }
      });

      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      // Check if player is in lineup for this team
      const lineupEntry = await prisma.lineupEntry.findFirst({
        where: {
          match_id: parseInt(matchId),
          team_id: parseInt(team_id),
          player_id: parseInt(player_id),
          deleted_at: null
        }
      });

      if (!lineupEntry) {
        return res.status(400).json({ error: "Player is not in the lineup for this team" });
      }
    }

    // Create the event
    const event = await prisma.matchEvent.create({
      data: {
        match_id: parseInt(matchId),
        team_id: parseInt(team_id),
        event_type_id: parseInt(event_type_id),
        player_id: player_id ? parseInt(player_id) : null,
        secondary_player_id: secondary_player_id ? parseInt(secondary_player_id) : null,
        minute: parseInt(minute),
        second: second ? parseInt(second) : 0,
        period: period ? parseInt(period) : 1,
        details: details || {},
        notes
      }
    });

    // Update match score if event affects score
    if (eventType.affects_score === 1) {
      const updateData = {};
      if (team_id === match.home_team_id) {
        updateData.home_score = match.home_score + 1;
      } else {
        updateData.away_score = match.away_score + 1;
      }

      await prisma.match.update({
        where: { id: parseInt(matchId) },
        data: updateData
      });

      event.home_score = updateData.home_score;
      event.away_score = updateData.away_score;
    }

    res.status(201).json({
      message: "Event created successfully",
      event: {
        ...event,
        event_type: eventType,
        team
      }
    });
  } catch (error) {
    console.error("Create match event error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a match event
const updateMatchEvent = async (req, res) => {
  try {
    const { matchId, id } = req.params;
    const {
      minute,
      second,
      period,
      details,
      notes,
      is_cancelled,
      cancelled_reason
    } = req.body;

    // Check if event exists
    const existingEvent = await prisma.matchEvent.findUnique({
      where: { id: parseInt(id) },
      include: { event_type: true }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId), deleted_at: null }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Check if event belongs to this match
    if (existingEvent.match_id !== parseInt(matchId)) {
      return res.status(400).json({ error: "Event does not belong to this match" });
    }

    // Handle score reversal if cancelling a goal
    if (existingEvent.event_type.affects_score === 1 && is_cancelled === true) {
      const updateData = {};
      if (existingEvent.team_id === match.home_team_id) {
        updateData.home_score = Math.max(0, match.home_score - 1);
      } else {
        updateData.away_score = Math.max(0, match.away_score - 1);
      }

      await prisma.match.update({
        where: { id: parseInt(matchId) },
        data: updateData
      });
    }

    // Update the event
    const updatedEvent = await prisma.matchEvent.update({
      where: { id: parseInt(id) },
      data: {
        ...(minute !== undefined && { minute: parseInt(minute) }),
        ...(second !== undefined && { second: parseInt(second) }),
        ...(period !== undefined && { period: parseInt(period) }),
        ...(details !== undefined && { details }),
        ...(notes !== undefined && { notes }),
        ...(is_cancelled !== undefined && { is_cancelled }),
        ...(cancelled_reason !== undefined && { cancelled_reason })
      },
      include: {
        player: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        event_type: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: "Event updated successfully",
      event: updatedEvent
    });
  } catch (error) {
    console.error("Update match event error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a match event
const deleteMatchEvent = async (req, res) => {
  try {
    const { matchId, id } = req.params;

    // Check if event exists
    const existingEvent = await prisma.matchEvent.findUnique({
      where: { id: parseInt(id) },
      include: { event_type: true }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId), deleted_at: null }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Check if event belongs to this match
    if (existingEvent.match_id !== parseInt(matchId)) {
      return res.status(400).json({ error: "Event does not belong to this match" });
    }

    // Reverse score if deleting a goal
    if (existingEvent.event_type.affects_score === 1) {
      const updateData = {};
      if (existingEvent.team_id === match.home_team_id) {
        updateData.home_score = Math.max(0, match.home_score - 1);
      } else {
        updateData.away_score = Math.max(0, match.away_score - 1);
      }

      await prisma.match.update({
        where: { id: parseInt(matchId) },
        data: updateData
      });
    }

    // Delete the event
    await prisma.matchEvent.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      message: "Event deleted successfully"
    });
  } catch (error) {
    console.error("Delete match event error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get matches grouped by date for calendar view
const getMatchCalendar = async (req, res) => {
  try {
    const { month, seasonId } = req.query;
    
    // Parse month or use current
    let startDate, endDate;
    if (month) {
      // Parse month in format YYYY-MM
      const [year, monthNum] = month.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1); // Month is 0-indexed
      endDate = new Date(year, monthNum, 0); // Last day of the month
    } else {
      // Use current month if no month specified
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // Build where clause
    const whereClause = {
      match_date: {
        gte: startDate,
        lte: new Date(endDate.setHours(23, 59, 59, 999))
      },
      deleted_at: null
    };
    
    // Add season filter if provided
    if (seasonId) {
      whereClause.season_id = parseInt(seasonId);
    }
    
    // Get matches with related data
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        home_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        away_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { match_date: "asc" }
    });
    
    // Group matches by date
    const calendar = {};
    matches.forEach(match => {
      const dateStr = match.match_date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!calendar[dateStr]) {
        calendar[dateStr] = [];
      }
      
      calendar[dateStr].push({
        id: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        time: match.match_date.toTimeString().substring(0, 5), // HH:MM format
        venue: match.venue,
        status: match.status
      });
    });
    
    res.json(calendar);
  } catch (error) {
    console.error("Get match calendar error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get upcoming matches
const getUpcomingMatches = async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get upcoming matches (date >= today AND status = 'scheduled')
    const matches = await prisma.match.findMany({
      where: {
        match_date: { gte: today },
        status: 'scheduled',
        deleted_at: null
      },
      include: {
        home_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        away_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { match_date: "asc" },
      take: 10 // Limit to 10 matches
    });
    
    // Format the response
    const formattedMatches = matches.map(match => ({
      id: match.id,
      date: match.match_date.toISOString().split('T')[0], // YYYY-MM-DD format
      time: match.match_date.toTimeString().substring(0, 5), // HH:MM format
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      venue: match.venue
    }));
    
    res.json(formattedMatches);
  } catch (error) {
    console.error("Get upcoming matches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get recent matches
const getRecentMatches = async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get recent matches (where date < today OR status = 'finished')
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { match_date: { lt: today } },
          { status: 'finished' }
        ],
        deleted_at: null
      },
      include: {
        home_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        away_team: {
          select: {
            id: true,
            name: true,
            short_name: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { match_date: "desc" },
      take: 10 // Limit to 10 matches
    });
    
    // Format the response
    const formattedMatches = matches.map(match => ({
      id: match.id,
      date: match.match_date.toISOString().split('T')[0], // YYYY-MM-DD format
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      homeScore: match.home_score,
      awayScore: match.away_score,
      venue: match.venue
    }));
    
    res.json(formattedMatches);
  } catch (error) {
    console.error("Get recent matches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
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
};