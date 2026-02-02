const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate and return the standings for a given season
 */
const getStandings = async (req, res) => {
  try {
    const { seasonId } = req.params;

    // 1. Get all finished matches for the season
    const matches = await prisma.match.findMany({
      where: { 
        season_id: parseInt(seasonId), 
        status: 'finished', 
        deleted_at: null 
      },
      select: { 
        home_team_id: true, 
        away_team_id: true, 
        home_score: true, 
        away_score: true 
      }
    });

    // 2. Get unique teams in the season
    const teamIds = [...new Set([
      ...matches.map(match => match.home_team_id),
      ...matches.map(match => match.away_team_id)
    ])];

    const teams = await prisma.team.findMany({
      where: {
        id: { in: teamIds },
        deleted_at: null
      },
      select: {
        id: true,
        name: true,
        short_name: true
      }
    });

    // Create a map of team data for easy lookup
    const teamMap = {};
    teams.forEach(team => {
      teamMap[team.id] = team;
    });

    // 3. Calculate statistics for each team
    const stats = {};

    // Initialize stats for each team
    teamIds.forEach(teamId => {
      stats[teamId] = {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0
      };
    });

    // Process each match to calculate stats
    matches.forEach(match => {
      const homeTeamId = match.home_team_id;
      const awayTeamId = match.away_team_id;

      // Update matches played
      stats[homeTeamId].played++;
      stats[awayTeamId].played++;

      // Update goals
      stats[homeTeamId].goals_for += match.home_score;
      stats[homeTeamId].goals_against += match.away_score;
      stats[awayTeamId].goals_for += match.away_score;
      stats[awayTeamId].goals_against += match.home_score;

      // Update goal difference
      stats[homeTeamId].goal_difference = stats[homeTeamId].goals_for - stats[homeTeamId].goals_against;
      stats[awayTeamId].goal_difference = stats[awayTeamId].goals_for - stats[awayTeamId].goals_against;

      // Determine match result and update wins/draws/losses/points
      if (match.home_score > match.away_score) {
        // Home win
        stats[homeTeamId].won++;
        stats[homeTeamId].points += 3;
        stats[awayTeamId].lost++;
      } else if (match.home_score < match.away_score) {
        // Away win
        stats[awayTeamId].won++;
        stats[awayTeamId].points += 3;
        stats[homeTeamId].lost++;
      } else {
        // Draw
        stats[homeTeamId].drawn++;
        stats[homeTeamId].points += 1;
        stats[awayTeamId].drawn++;
        stats[awayTeamId].points += 1;
      }
    });

    // 4. Get season info
    const season = await prisma.season.findUnique({
      where: { id: parseInt(seasonId) },
      select: { id: true, name: true, tournament: true }
    });

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    // 5. Format standings with team info and sort
    let standings = Object.keys(stats).map(teamId => ({
      position: 0, // Will be set after sorting
      team: teamMap[parseInt(teamId)],
      ...stats[parseInt(teamId)]
    }));

    // Sort by points, then goal difference, then goals for
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });

    // Assign positions
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    // 6. Return the response
    res.json({
      season: season,
      standings: standings
    });
  } catch (error) {
    console.error('Error calculating standings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getStandings
};