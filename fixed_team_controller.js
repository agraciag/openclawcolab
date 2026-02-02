const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Get all teams
const getAllTeams = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, country, city } = req.query;
    
    // Build where clause based on filters
    const whereClause = {
      deleted_at: null, // Only show non-deleted teams
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(country && { country: { contains: country, mode: "insensitive" } }),
      ...(city && { city: { contains: city, mode: "insensitive" } })
    };

    // Get teams with pagination
    const teams = await prisma.team.findMany({
      where: whereClause,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { name: "asc" }
    });

    // Get total count for pagination metadata
    const totalTeams = await prisma.team.count({ where: whereClause });

    res.json({
      data: teams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTeams / parseInt(limit)),
        totalTeams,
        hasNextPage: parseInt(page) * parseInt(limit) < totalTeams,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Get all teams error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get team by ID
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id), deleted_at: null },
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                display_name: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Get team by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new team
const createTeam = async (req, res) => {
  try {
    const {
      name,
      display_name,
      short_name,
      country,
      city,
      founded_year,
      primary_color,
      secondary_color,
      bio,
      stadium_name,
      website
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Check if team with same name already exists
    const existingTeam = await prisma.team.findFirst({
      where: { name: { equals: name, mode: "insensitive" } }
    });

    if (existingTeam) {
      return res.status(409).json({ error: "A team with this name already exists" });
    }

    // Create the team
    const team = await prisma.team.create({
      data: {
        name,
        display_name,
        short_name,
        country,
        city,
        founded_year,
        primary_color,
        secondary_color,
        bio,
        stadium_name,
        website
      }
    });

    res.status(201).json({
      message: "Team created successfully",
      team
    });
  } catch (error) {
    console.error("Create team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a team
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      display_name,
      short_name,
      country,
      city,
      founded_year,
      primary_color,
      secondary_color,
      bio,
      stadium_name,
      website
    } = req.body;

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTeam) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if another team with same name already exists (excluding current team)
    if (name) {
      const duplicateNameTeam = await prisma.team.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          id: { not: parseInt(id) }
        }
      });

      if (duplicateNameTeam) {
        return res.status(409).json({ error: "Another team with this name already exists" });
      }
    }

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(display_name !== undefined && { display_name }),
        ...(short_name !== undefined && { short_name }),
        ...(country !== undefined && { country }),
        ...(city !== undefined && { city }),
        ...(founded_year !== undefined && { founded_year }),
        ...(primary_color !== undefined && { primary_color }),
        ...(secondary_color !== undefined && { secondary_color }),
        ...(bio !== undefined && { bio }),
        ...(stadium_name !== undefined && { stadium_name }),
        ...(website !== undefined && { website })
      }
    });

    res.json({
      message: "Team updated successfully",
      team: updatedTeam
    });
  } catch (error) {
    console.error("Update team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a team (soft delete)
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTeam) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Perform soft delete by setting deleted_at
    const deletedTeam = await prisma.team.update({
      where: { id: parseInt(id) },
      data: { deleted_at: new Date() }
    });

    res.json({
      message: "Team deleted successfully",
      team: deletedTeam
    });
  } catch (error) {
    console.error("Delete team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get head-to-head statistics between two teams
const getHeadToHead = async (req, res) => {
  try {
    const { teamId, opponentId } = req.params;

    // Validate that both teamId and opponentId are provided
    if (!teamId || !opponentId) {
      return res.status(400).json({ error: "Both teamId and opponentId are required" });
    }

    // Validate that teamId and opponentId are different
    if (parseInt(teamId) === parseInt(opponentId)) {
      return res.status(400).json({ error: "teamId and opponentId must be different" });
    }

    // Find all matches between both teams
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { home_team_id: parseInt(teamId), away_team_id: parseInt(opponentId) },
          { home_team_id: parseInt(opponentId), away_team_id: parseInt(teamId) }
        ],
        status: 'finished', // Using 'finished' as per the schema instead of 'completed'
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
      orderBy: { match_date: 'desc' }
    });

    // Calculate statistics
    let team1Wins = 0, team2Wins = 0, draws = 0;
    let team1Goals = 0, team2Goals = 0;

    matches.forEach(match => {
      const isTeam1Home = match.home_team_id === parseInt(teamId);
      const t1Score = isTeam1Home ? match.home_score : match.away_score;
      const t2Score = isTeam1Home ? match.away_score : match.home_score;

      team1Goals += t1Score;
      team2Goals += t2Score;

      if (t1Score > t2Score) team1Wins++;
      else if (t2Score > t1Score) team2Wins++;
      else draws++;
    });

    // Get team details
    const team1 = await prisma.team.findUnique({
      where: { id: parseInt(teamId), deleted_at: null },
      select: {
        id: true,
        name: true,
        short_name: true
      }
    });

    const team2 = await prisma.team.findUnique({
      where: { id: parseInt(opponentId), deleted_at: null },
      select: {
        id: true,
        name: true,
        short_name: true
      }
    });

    if (!team1 || !team2) {
      return res.status(404).json({ error: "One or both teams not found" });
    }

    // Format last matches (up to 10)
    const lastMatches = matches.slice(0, 10).map(match => ({
      id: match.id,
      date: match.match_date.toISOString().split('T')[0],
      homeTeam: {
        id: match.home_team.id,
        name: match.home_team.name
      },
      awayTeam: {
        id: match.away_team.id,
        name: match.away_team.name
      },
      homeScore: match.home_score,
      awayScore: match.away_score,
      venue: {
        name: match.venue ? match.venue.name : null
      }
    }));

    // Return summary + last 10 matches
    res.json({
      team1,
      team2,
      summary: { 
        totalMatches: matches.length, 
        team1Wins, 
        team2Wins, 
        draws, 
        team1Goals, 
        team2Goals 
      },
      lastMatches
    });
  } catch (error) {
    console.error("Get head-to-head error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getHeadToHead
};