const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get matches for a specific season
 * @param {number} seasonId - The ID of the season
 * @returns {Promise<Array>} Array of matches
 */
const getMatchesBySeason = async (seasonId) => {
  const matches = await prisma.match.findMany({
    where: {
      season_id: parseInt(seasonId)
    },
    include: {
      home_team: true,
      away_team: true,
      venue: true
    },
    orderBy: {
      match_date: 'asc'
    }
  });

  return matches;
};

module.exports = {
  getMatchesBySeason
};