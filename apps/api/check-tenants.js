const mysql = require('mysql2/promise');

async function checkTenantTables() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'blindtest'
  });

  try {
    // Vérifier si les tables tenants existent
    const [tables] = await connection.execute("SHOW TABLES LIKE 'tenants'");
    console.log('Tables tenants trouvées:', tables.length);

    if (tables.length > 0) {
      const [rows] = await connection.execute('DESCRIBE tenants');
      console.log('\n=== Table tenants ===');
      rows.forEach(col => {
        if (col.Field === 'id') {
          console.log(`${col.Field}: ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
        }
      });
    }

    // Vérifier event_staff
    const [eventStaffRows] = await connection.execute('DESCRIBE event_staff');
    console.log('\n=== Table event_staff ===');
    eventStaffRows.forEach(col => {
      if (col.Field === 'id' || col.Field === 'tenant_user_id' || col.Field === 'organizer_id') {
        console.log(`${col.Field}: ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
      }
    });

    // Vérifier la table events
    const [eventsRows] = await connection.execute('DESCRIBE events');
    console.log('\n=== Table events (tenant_id) ===');
    eventsRows.forEach(col => {
      if (col.Field === 'id' || col.Field === 'tenant_id' || col.Field === 'session_id') {
        console.log(`${col.Field}: ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
      }
    });

  } catch (error) {
    console.error('Erreur:', error.message);
  }

  await connection.end();
}

checkTenantTables().catch(console.error);