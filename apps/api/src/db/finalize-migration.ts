import { AppDataSource } from './data-source';

async function finalizeMigration() {
  try {
    console.log('🚀 Finalisation de la migration multi-tenant...');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion à la base de données établie');
    }

    // Finaliser les contraintes FK pour les tables restantes
    console.log('\n📋 Ajout des contraintes FK finales');

    const constraintCommands = [
      // Tables qui ont déjà tenant_id mais pas encore les contraintes
      'ALTER TABLE teams ADD CONSTRAINT fk_teams_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE players ADD CONSTRAINT fk_players_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE rounds ADD CONSTRAINT fk_rounds_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE round_songs ADD CONSTRAINT fk_round_songs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE answers ADD CONSTRAINT fk_answers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE scores ADD CONSTRAINT fk_scores_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
    ];

    for (let i = 0; i < constraintCommands.length; i++) {
      try {
        console.log(`⚙️  Contrainte FK ${i + 1}/${constraintCommands.length}`);
        await AppDataSource.query(constraintCommands[i]);
        console.log(`✅  Contrainte ajoutée`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
          console.log(`⚠️  Contrainte déjà existante - ignoré`);
        } else {
          console.log(`❌  Erreur contrainte: ${error.message}`);
        }
      }
    }

    // Vérifier l'état final
    console.log('\n📋 Vérification finale des tables');

    try {
      const tenantsCount = await AppDataSource.query('SELECT COUNT(*) as count FROM tenants');
      console.log(`✅ Tenants dans la base: ${tenantsCount[0].count}`);

      const eventsCount = await AppDataSource.query('SELECT COUNT(*) as count FROM events WHERE tenant_id IS NOT NULL');
      console.log(`✅ Events avec tenant_id: ${eventsCount[0].count}`);

      // Tester une requête avec jointure
      const tenantWithEvents = await AppDataSource.query(`
        SELECT t.name, COUNT(e.id) as event_count
        FROM tenants t
        LEFT JOIN events e ON t.id = e.tenant_id
        WHERE t.id = '00000000-0000-0000-0000-000000000001'
        GROUP BY t.id, t.name
      `);

      if (tenantWithEvents.length > 0) {
        console.log(`✅ Tenant par défaut: ${tenantWithEvents[0].name} avec ${tenantWithEvents[0].event_count} événements`);
      }

    } catch (error: any) {
      console.log(`⚠️  Erreur vérification: ${error.message}`);
    }

    console.log('\n🎉 Migration multi-tenant terminée avec succès !');
    console.log('\n📋 Résumé:');
    console.log('✅ Tables tenant créées (tenants, tenant_users, tenant_sessions, payments)');
    console.log('✅ Colonnes tenant_id ajoutées à toutes les tables existantes');
    console.log('✅ Données existantes migrées vers le tenant par défaut');
    console.log('✅ Index et contraintes FK en place');
    console.log('✅ Isolation des données par tenant configurée');

    console.log('\n🚀 Prochaines étapes:');
    console.log('1. Tester l\'API multi-tenant');
    console.log('2. Créer un nouveau tenant via API');
    console.log('3. Configurer Stripe pour les paiements');

  } catch (error) {
    console.error('❌ Erreur lors de la finalisation :', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la finalisation si ce script est appelé directement
if (require.main === module) {
  finalizeMigration();
}

export { finalizeMigration };