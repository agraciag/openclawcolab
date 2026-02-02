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
        short_name: true,
        logo_url: true
      }
    });

    const team2 = await prisma.team.findUnique({
      where: { id: parseInt(opponentId), deleted_at: null },
      select: {
        id: true,
        name: true,
        short_name: true,
        logo_url: true
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