const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { getStandingsData } = require('../services/standingService');
const { getMatchesBySeason } = require('../services/matchService');

const exportStandingsPdf = async (req, res) => {
  try {
    const { seasonId } = req.params;

    // Obtener standings
    const standings = await getStandingsData(seasonId);

    // Crear PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=standings-${seasonId}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('Tabla de Posiciones', { align: 'center' });
    doc.moveDown();

    // Header
    doc.fontSize(10).text('# | Equipo | PJ | G | E | P | GF | GC | DG | PTS');
    doc.moveDown();

    // Rows
    standings.forEach((team, i) => {
      doc.text(`${i+1} | ${team.teamName} | ${team.played} | ${team.won} | ${team.drawn} | ${team.lost} | ${team.goalsFor} | ${team.goalsAgainst} | ${team.goalDiff} | ${team.points}`);
      doc.moveDown(0.2);
    });

    doc.end();
  } catch (error) {
    console.error('Error exporting standings to PDF:', error);
    res.status(500).json({ error: 'Failed to export standings to PDF' });
  }
};

const exportStandingsExcel = async (req, res) => {
  try {
    const { seasonId } = req.params;

    const standings = await getStandingsData(seasonId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Standings');

    // Headers
    sheet.columns = [
      { header: '#', key: 'pos', width: 5 },
      { header: 'Equipo', key: 'team', width: 25 },
      { header: 'PJ', key: 'played', width: 8 },
      { header: 'G', key: 'won', width: 8 },
      { header: 'E', key: 'drawn', width: 8 },
      { header: 'P', key: 'lost', width: 8 },
      { header: 'GF', key: 'gf', width: 8 },
      { header: 'GC', key: 'gc', width: 8 },
      { header: 'DG', key: 'gd', width: 8 },
      { header: 'PTS', key: 'pts', width: 8 }
    ];

    // Data
    standings.forEach((team, i) => {
      sheet.addRow({
        pos: i + 1,
        team: team.teamName,
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        gf: team.goalsFor,
        gc: team.goalsAgainst,
        gd: team.goalDiff,
        pts: team.points
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=standings-${seasonId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting standings to Excel:', error);
    res.status(500).json({ error: 'Failed to export standings to Excel' });
  }
};

const exportMatchesPdf = async (req, res) => {
  try {
    const { seasonId } = req.params;

    // Obtener partidos
    const matches = await getMatchesBySeason(seasonId);

    // Crear PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=matches-${seasonId}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('Lista de Partidos', { align: 'center' });
    doc.moveDown();

    // Header
    doc.fontSize(10).text('Fecha | Local | Visitante | Resultado');
    doc.moveDown();

    // Rows
    matches.forEach(match => {
      const formattedDate = new Date(match.date).toLocaleDateString();
      doc.text(`${formattedDate} | ${match.homeTeam.name} | ${match.awayTeam.name} | ${match.result || '-'}`);
      doc.moveDown(0.2);
    });

    doc.end();
  } catch (error) {
    console.error('Error exporting matches to PDF:', error);
    res.status(500).json({ error: 'Failed to export matches to PDF' });
  }
};

module.exports = {
  exportStandingsPdf,
  exportStandingsExcel,
  exportMatchesPdf
};