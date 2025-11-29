const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'blindtest'
  });

  const tables = ['events', 'teams', 'players', 'rounds', 'round_songs', 'answers', 'scores'];

  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`DESCRIBE ${table}`);
      console.log(`\n=== Table ${table} ===`);
      rows.forEach(col => {
        if (col.Field === 'tenant_id' || col.Field === 'id') {
          console.log(`${col.Field}: ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
        }
      });
    } catch (error) {
      console.log(`Erreur table ${table}:`, error.message);
    }
  }

  await connection.end();
}

checkTables().catch(console.error);