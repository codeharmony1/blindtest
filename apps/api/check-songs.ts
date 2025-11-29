import { AppDataSource } from './src/db/data-source';

async function checkSongs() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const songs = await AppDataSource.query(`
      SELECT id, round_id, idx, title_official, artist_official, status
      FROM round_songs
      WHERE round_id = 2
      ORDER BY idx ASC
    `);

    console.log(`=== Chansons dans le round 2 (${songs.length} total) ===\n`);

    songs.forEach((song: any) => {
      console.log(`ID: ${song.id.toString().padEnd(4)} | ${song.title_official} - ${song.artist_official}`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSongs();
