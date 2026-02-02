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