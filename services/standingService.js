const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get standings data for a specific season
 * @param {number} seasonId - The ID of the season
 * @returns {Promise<Array>} Array of team standings
 */
const getStandingsData = async (seasonId) => {
  // Get all matches for the season
  const matches = await prisma.match.findMany({
    where: {
      season_id: parseInt(seasonId),
      status: 'finished' // Only finished matches count towards standings
    },
    include: {
      home_team: true,
      away_team: true
    }
  });

  // Calculate standings based on matches
  const teamStats = {};

  matches.forEach(match => {
    const homeTeamId = match.home_team_id;
    const awayTeamId = match.away_team_id;
    
    // Initialize team stats if not exists
    if (!teamStats[homeTeamId]) {
      teamStats[homeTeamId] = {
        teamId: homeTeamId,
        teamName: match.home_team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0
      };
    }
    
    if (!teamStats[awayTeamId]) {
      teamStats[awayTeamId] = {
        teamId: awayTeamId,
        teamName: match.away_team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0
      };
    }
    
    // Update stats for home team
    teamStats[homeTeamId].played += 1;
    teamStats[homeTeamId].goalsFor += match.home_score;
    teamStats[homeTeamId].goalsAgainst += match.away_score;
    
    // Update stats for away team
    teamStats[awayTeamId].played += 1;
    teamStats[awayTeamId].goalsFor += match.away_score;
    teamStats[awayTeamId].goalsAgainst += match.home_score;
    
    // Determine match result and assign points
    if (match.home_score > match.away_score) {
      // Home win
      teamStats[homeTeamId].won += 1;
      teamStats[homeTeamId].points += 3;
      teamStats[awayTeamId].lost += 1;
    } else if (match.away_score > match.home_score) {
      // Away win
      teamStats[awayTeamId].won += 1;
      teamStats[awayTeamId].points += 3;
      teamStats[homeTeamId].lost += 1;
    } else {
      // Draw
      teamStats[homeTeamId].drawn += 1;
      teamStats[homeTeamId].points += 1;
      teamStats[awayTeamId].drawn += 1;
      teamStats[awayTeamId].points += 1;
    }
  });

  // Calculate goal difference
  Object.values(teamStats).forEach(team => {
    team.goalDiff = team.goalsFor - team.goalsAgainst;
  });

  // Convert to array and sort by points (descending), then goal difference (descending)
  const standings = Object.values(teamStats)
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points; // Sort by points descending
      }
      return b.goalDiff - a.goalDiff; // Then by goal difference descending
    });

  return standings;
};

module.exports = {
  getStandingsData
};