import { Router } from "express";
import multer from "multer";
import csv from "csv-parse";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Round } from "../../db/entities/Round";
import { RoundSong } from "../../db/entities/RoundSong";
import { Score } from "../../db/entities/Score";
import { Team } from "../../db/entities/Team";
import { Answer } from "../../db/entities/Answer";
import { Tenant } from "../../db/entities/Tenant";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/rounds/:roundId/import-csv - Import playlist CSV
router.post("/rounds/:roundId/import-csv", upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: "NO_FILE", message: "CSV file required" }
      });
    }

    const roundRepo = AppDataSource.getRepository(Round);
    const songRepo = AppDataSource.getRepository(RoundSong);

    const round = await roundRepo.findOne({
      where: { id: String(req.params.roundId) },
      relations: ["event", "event.tenant"]
    });
    if (!round) {
      return res.status(404).json({ error: { code: "ROUND_NOT_FOUND" } });
    }

    // Parse CSV
    const csvContent = req.file.buffer.toString('utf-8');
    const records: any[] = [];

    await new Promise((resolve, reject) => {
      csv.parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
      .on('data', (data) => records.push(data))
      .on('error', (err) => reject(err))
      .on('end', () => resolve(records));
    });

    if (records.length === 0) {
      return res.status(400).json({
        error: { code: "EMPTY_CSV", message: "No valid records found in CSV" }
      });
    }

    // Validate CSV format - Accept either old format (title, artist) or new format (title, singer, band)
    const firstRecord = records[0];
    const hasOldFormat = 'title' in firstRecord && 'artist' in firstRecord;
    const hasNewFormat = 'title' in firstRecord && ('singer' in firstRecord || 'band' in firstRecord);

    if (!hasOldFormat && !hasNewFormat) {
      return res.status(400).json({
        error: {
          code: "INVALID_CSV_FORMAT",
          message: `Missing required columns. Expected either: [title, artist] or [title, singer, band]`,
          expectedColumns: {
            format1: ['title', 'artist', 'aliases (optional)', 'duration (optional)'],
            format2: ['title', 'singer', 'band', 'aliases (optional)']
          }
        }
      });
    }

    // Clear existing songs if requested
    const { clearExisting } = req.body;
    if (clearExisting === 'true') {
      await songRepo.delete({ round_id: round.id });
    }

    // Vérification des limites du plan DEMO
    const event = round.event as Event;
    if (event && event.tenant_id) {
      const tenant = await AppDataSource.getRepository(Tenant).findOne({
        where: { id: event.tenant_id }
      });

      if (tenant && tenant.subscription_plan === 'DEMO' && tenant.max_songs_per_event) {
        // Compter le nombre de chansons existantes pour cet événement
        const existingSongsCount = await AppDataSource.getRepository(RoundSong)
          .createQueryBuilder("song")
          .innerJoin("song.round", "round")
          .where("round.event_id = :eventId", { eventId: event.id })
          .getCount();

        // Vérifier si l'import dépasserait la limite
        const totalAfterImport = existingSongsCount + records.length;
        if (totalAfterImport > tenant.max_songs_per_event) {
          return res.status(403).json({
            error: {
              code: "SONG_LIMIT_REACHED",
              message: `Plan DEMO limité à ${tenant.max_songs_per_event} chansons par événement. Import refusé car vous avez ${existingSongsCount} chansons et tentez d'en ajouter ${records.length} (total: ${totalAfterImport}). Passez à un plan payant pour ajouter plus de chansons.`,
              limit: tenant.max_songs_per_event,
              current: existingSongsCount,
              attempted: records.length,
              wouldBe: totalAfterImport
            }
          });
        }
      }
    }

    // Import songs
    const importedSongs = [];
    let idx = await songRepo.count({ where: { round_id: round.id } }) + 1;

    for (const record of records) {
      const { title, artist, singer, band, aliases, duration } = record;

      // Determine artist field: use new format (singer/band) if available, otherwise fall back to old format (artist)
      let artistField = '';
      if (singer || band) {
        // New format: combine singer and band
        const parts = [];
        if (singer && singer.trim()) parts.push(singer.trim());
        if (band && band.trim()) parts.push(band.trim());
        artistField = parts.join(' - ');
      } else if (artist) {
        // Old format: use artist directly
        artistField = artist.trim();
      }

      if (!title || !artistField) {
        console.warn('Skipping invalid record:', record);
        continue;
      }

      // Parse aliases - support both | and , as separators
      let aliasesArray: string[] = [];
      if (aliases && typeof aliases === 'string') {
        // Try pipe separator first, then comma
        if (aliases.includes('|')) {
          aliasesArray = aliases.split('|').map(a => a.trim()).filter(a => a.length > 0);
        } else {
          aliasesArray = aliases.split(',').map(a => a.trim()).filter(a => a.length > 0);
        }
      }

      // Parse duration
      let durationSeconds: number | null = null;
      if (duration) {
        const parsed = parseInt(String(duration), 10);
        if (!isNaN(parsed) && parsed > 0) {
          durationSeconds = parsed;
        }
      }

      const song = songRepo.create({
        round_id: round.id,
        idx: idx++,
        mode: "prepared" as any,
        title_official: title.trim(),
        artist_official: artistField,
        aliases_json: aliasesArray.length > 0 ? JSON.stringify(aliasesArray) : undefined,
        duration_s: durationSeconds,
        status: "pending" as any
      });

      const saved = await songRepo.save(song);
      importedSongs.push({
        id: saved.id,
        idx: saved.idx,
        title: saved.title_official || '',
        artist: saved.artist_official || '',
        aliases: aliasesArray,
        duration: saved.duration_s
      });
    }

    return res.json({
      roundId: round.id,
      imported: importedSongs.length,
      songs: importedSongs,
      message: `${importedSongs.length} songs imported successfully`
    });

  } catch (error) {
    console.error('CSV Import error:', error);
    return res.status(500).json({
      error: { code: "IMPORT_ERROR", message: String(error) }
    });
  }
});

// GET /api/events/:code/export-scores - Export scores CSV
router.get("/events/:code/export-scores", async (req, res) => {
  try {
    const eventRepo = AppDataSource.getRepository(Event);
    const scoreRepo = AppDataSource.getRepository(Score);
    const teamRepo = AppDataSource.getRepository(Team);
    const answerRepo = AppDataSource.getRepository(Answer);

    const event = await eventRepo.findOne({ where: { code: req.params.code } });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Get all data
    const teams = await teamRepo.find({
      where: { event_id: event.id },
      relations: ['players']
    });

    const scores = await scoreRepo.find({ where: { event_id: event.id } });
    const answers = teams.length > 0
      ? await answerRepo.find({
          where: { team_id: teams.map(t => t.id) as any },
          relations: ['song']
        })
      : [];

    // Build CSV data
    const csvData = teams.map((team: any) => {
      const teamScore = scores.find(s => s.team_id === team.id);
      const teamAnswers = answers.filter(a => a.team_id === team.id);
      const playersCount = team.players?.length || 0;
      const totalParticipants = playersCount + (team.manual_participants_count || 0);

      return {
        'Équipe': team.name,
        'Score Total': teamScore?.total_points || 0,
        'Joueurs Connectés': playersCount,
        'Participants Manuels': team.manual_participants_count || 0,
        'Total Participants': totalParticipants,
        'Capitaine ID': team.captain_player_id || '',
        'Réponses Soumises': teamAnswers.length,
        'Points Moyens par Réponse': teamAnswers.length > 0
          ? Math.round((teamAnswers.reduce((sum, a) => sum + a.points, 0) / teamAnswers.length) * 100) / 100
          : 0,
        'Créée le': team.created_at.toISOString()
      };
    });

    // Sort by score descending
    csvData.sort((a: any, b: any) => b['Score Total'] - a['Score Total']);

    // Add rankings
    csvData.forEach((row: any, index: number) => {
      row['Rang'] = index + 1;
    });

    // Convert to CSV string
    const headers = Object.keys(csvData[0] || {});
    const csvRows = [
      headers.join(','),
      ...csvData.map((row: any) =>
        headers.map(header => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    const csvString = csvRows.join('\n');

    // Set headers for file download
    const filename = `blindtest_scores_${event.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Add BOM for proper UTF-8 encoding in Excel
    res.write('\uFEFF');
    res.write(csvString);
    res.end();

  } catch (error) {
    console.error('CSV Export error:', error);
    return res.status(500).json({
      error: { code: "EXPORT_ERROR", message: String(error) }
    });
  }
});

// GET /api/events/:code/export-detailed-scores - Export detailed scores with answers
router.get("/events/:code/export-detailed-scores", async (req, res) => {
  try {
    const eventRepo = AppDataSource.getRepository(Event);
    const teamRepo = AppDataSource.getRepository(Team);
    const answerRepo = AppDataSource.getRepository(Answer);

    const event = await eventRepo.findOne({ where: { code: req.params.code } });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Get detailed answer data
    const answers = await answerRepo.find({
      relations: ['team', 'song'],
      where: { team: { event_id: event.id } },
      order: { submitted_at: 'ASC' }
    });

    const csvData = answers.map(answer => ({
      'Équipe': answer.team?.name || 'Unknown',
      'Chanson ID': answer.song?.id || '',
      'Titre Officiel': answer.song?.title_official || '',
      'Artiste Officiel': answer.song?.artist_official || '',
      'Réponse Fournie': answer.text_raw,
      'Soumise le': answer.submitted_at.toISOString(),
      'Titre Correct': answer.match_title ? 'Oui' : 'Non',
      'Artiste Correct': answer.match_artist ? 'Oui' : 'Non',
      'Points Obtenus': answer.points
    }));

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csvRows = [
      headers.join(','),
      ...csvData.map((row: any) =>
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    const csvString = csvRows.join('\n');
    const filename = `blindtest_detailed_${event.code}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.write('\uFEFF');
    res.write(csvString);
    res.end();

  } catch (error) {
    console.error('Detailed CSV Export error:', error);
    return res.status(500).json({
      error: { code: "EXPORT_ERROR", message: String(error) }
    });
  }
});

export default router;