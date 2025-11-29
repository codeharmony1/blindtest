import { AppDataSource } from './src/db/data-source';

async function checkTenantIds() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const songs = await AppDataSource.query(`
      SELECT id, round_id, tenant_id, title_official
      FROM round_songs
      WHERE id IN (2, 25, 26, 27)
      ORDER BY id ASC
    `);

    console.log(`=== Tenant IDs for test songs ===\n`);

    songs.forEach((song: any) => {
      console.log(`ID: ${song.id} | Tenant: ${song.tenant_id || 'NULL'} | Title: ${song.title_official}`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTenantIds();
