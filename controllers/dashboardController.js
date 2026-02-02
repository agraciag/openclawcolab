const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get global statistics for the dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    // Totals
    const teams = await prisma.team.count({ where: { deleted_at: null } });
    const players = await prisma.player.count({ where: { deleted_at: null } });
    const matches = await prisma.match.count({ where: { deleted_at: null } });
    const tournaments = await prisma.tournament.count({ where: { deleted_at: null } });
    const venues = await prisma.venue.count({ where: { deleted_at: null } });

    // Total goals - we need to count goal events from matchEvents
    const goalEvents = await prisma.matchEvent.findMany({
      where: {
        event_type: {
          code: 'goal'
        }
      },
      include: {
        match: {
          where: {
            deleted_at: null
          }
        }
      }
    });
    const goals = goalEvents.length;

    // Recent matches (last 5 finished)
    const recentMatches = await prisma.match.findMany({
      where: { 
        status: 'finished', 
        deleted_at: null 
      },
      orderBy: { match_date: 'desc' },
      take: 5,
      include: { 
        home_team: { select: { name: true } }, 
        away_team: { select: { name: true } } 
      }
    });

    // Upcoming matches (next 5 scheduled)
    const upcomingMatches = await prisma.match.findMany({
      where: { 
        status: 'scheduled', 
        deleted_at: null 
      },
      orderBy: { match_date: 'asc' },
      take: 5,
      include: { 
        home_team: { select: { name: true } }, 
        away_team: { select: { name: true } } 
      }
    });

    // Live matches (currently in progress)
    const liveMatches = await prisma.match.findMany({
      where: { 
        status: 'in_progress', 
        deleted_at: null 
      },
      include: { 
        home_team: { select: { name: true } }, 
        away_team: { select: { name: true } } 
      }
    });

    // Top scorers
    const goalEventsGrouped = await prisma.matchEvent.groupBy({
      by: ['player_id'],
      where: { 
        event_type: {
          code: 'goal'
        },
        match: {
          deleted_at: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Get player details for top scorers
    const topScorerDetails = [];
    for (const goalEvent of goalEventsGrouped) {
      if (goalEvent.player_id) {
        const player = await prisma.player.findUnique({
          where: { id: goalEvent.player_id },
          include: {
            team: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (player) {
          topScorerDetails.push({
            player: player.name,
            team: player.team ? player.team.name : 'N/A',
            goals: goalEvent._count.id
          });
        }
      }
    }

    // Format recent matches
    const formattedRecentMatches = recentMatches.map(match => ({
      id: match.id,
      home_team: match.home_team.name,
      away_team: match.away_team.name,
      score: `${match.home_score}-${match.away_score}`,
      date: match.match_date.toISOString().split('T')[0],
      status: match.status
    }));

    // Format upcoming matches
    const formattedUpcomingMatches = upcomingMatches.map(match => ({
      id: match.id,
      home_team: match.home_team.name,
      away_team: match.away_team.name,
      date: match.match_date.toISOString().split('T')[0],
      status: match.status
    }));

    // Format live matches
    const formattedLiveMatches = liveMatches.map(match => ({
      id: match.id,
      home_team: match.home_team.name,
      away_team: match.away_team.name,
      score: match.home_score !== null && match.away_score !== null 
             ? `${match.home_score}-${match.away_score}` 
             : 'vs',
      date: match.match_date.toISOString().split('T')[0],
      status: match.status
    }));

    // Send response
    res.json({
      totals: {
        teams,
        players,
        matches,
        goals,
        tournaments,
        venues
      },
      recent_matches: formattedRecentMatches,
      upcoming_matches: formattedUpcomingMatches,
      live_matches: formattedLiveMatches,
      top_scorers: topScorerDetails
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats
};