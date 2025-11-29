const { AppDataSource } = require('./dist/db/data-source');

async function checkTables() {
  try {
    await AppDataSource.initialize();

    const tables = ['events', 'teams', 'players', 'rounds', 'round_songs', 'answers', 'scores'];

    for (const table of tables) {
      try {
        const result = await AppDataSource.query(`DESCRIBE ${table}`);
        console.log(`\n=== Table ${table} ===`);
        result.forEach(col => {
          if (col.Field === 'tenant_id' || col.Field === 'id') {
            console.log(`${col.Field}: ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
          }
        });
      } catch (error) {
        console.log(`Erreur table ${table}:`, error.message);
      }
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

checkTables();