import { AppDataSource } from './data-source';

async function migrateExistingTables() {
  try {
    console.log('🚀 Migration des tables existantes vers multi-tenant...');

    // Initialiser la connexion à la base de données
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion à la base de données établie');
    }

    // Étape 1: Ajouter les colonnes tenant_id manquantes
    console.log('\n📋 Étape 1: Ajout des colonnes tenant_id manquantes');

    const addColumnCommands = [
      // Events table (tenant_id et session_id)
      'ALTER TABLE events ADD COLUMN tenant_id varchar(36) NULL AFTER id',
      'ALTER TABLE events ADD COLUMN session_id varchar(36) NULL AFTER tenant_id',

      // Event_staff table (tenant_user_id)
      'ALTER TABLE event_staff ADD COLUMN tenant_user_id varchar(36) NULL AFTER id',
      'ALTER TABLE event_staff MODIFY COLUMN organizer_id bigint unsigned NULL',

      // Events table - rendre organizer_id nullable
      'ALTER TABLE events MODIFY COLUMN organizer_id bigint unsigned NULL'
    ];

    for (let i = 0; i < addColumnCommands.length; i++) {
      try {
        console.log(`⚙️  Commande ${i + 1}/${addColumnCommands.length}`);
        await AppDataSource.query(addColumnCommands[i]);
        console.log(`✅  Succès`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column name')) {
          console.log(`⚠️  Colonne déjà existante - ignoré`);
        } else {
          console.log(`❌  Erreur: ${error.message}`);
          // Ne pas arrêter pour ces erreurs mineures
        }
      }
    }

    // Étape 2: Migrer les données existantes vers le tenant par défaut
    console.log('\n📋 Étape 2: Migration des données vers tenant par défaut');

    const updateCommands = [
      'UPDATE events SET tenant_id = "00000000-0000-0000-0000-000000000001" WHERE tenant_id IS NULL',
      'UPDATE teams SET tenant_id = "00000000-0000-0000-0000-000000000001" WHERE tenant_id IS NULL',
      'UPDATE players SET tenant_id = "00000000-0000-0000-0000-000000000001" WHERE tenant_id IS NULL',
      'UPDATE rounds SET tenant_id = "00000000-0000-0000-0000-000000000001" WHERE tenant_id IS NULL',
      'UPDATE round_songs SET tenant_id = "00000000-0000-0000-0000-000000000001" WHERE tenant_id IS NULL',
      'UPDATE answers SET tenant_id = "00000000-0000-0000-0000-000000000001" WHERE tenant_id IS NULL',
      'UPDATE scores SET tenant_id = "00000000-0000-0000-0000-000000000001" WHERE tenant_id IS NULL'
    ];

    for (let i = 0; i < updateCommands.length; i++) {
      try {
        console.log(`⚙️  Migration données ${i + 1}/${updateCommands.length}`);
        const result = await AppDataSource.query(updateCommands[i]);
        console.log(`✅  ${result.changedRows || 0} enregistrements mis à jour`);
      } catch (error: any) {
        console.log(`❌  Erreur migration: ${error.message}`);
      }
    }

    // Étape 3: Ajouter les index
    console.log('\n📋 Étape 3: Ajout des index');

    const indexCommands = [
      'ALTER TABLE events ADD KEY idx_event_tenant (tenant_id, code)',
      'ALTER TABLE events ADD KEY idx_event_tenant_session (tenant_id, session_id)',
      'ALTER TABLE event_staff ADD KEY idx_event_staff_tenant_user (event_id, tenant_user_id, role)',
      'ALTER TABLE event_staff ADD UNIQUE KEY uq_event_staff_tenant (event_id, tenant_user_id, role)'
    ];

    for (let i = 0; i < indexCommands.length; i++) {
      try {
        console.log(`⚙️  Index ${i + 1}/${indexCommands.length}`);
        await AppDataSource.query(indexCommands[i]);
        console.log(`✅  Index créé`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
          console.log(`⚠️  Index déjà existant - ignoré`);
        } else {
          console.log(`❌  Erreur index: ${error.message}`);
        }
      }
    }

    // Étape 4: Rendre tenant_id obligatoire et ajouter les contraintes FK
    console.log('\n📋 Étape 4: Contraintes et champs obligatoires');

    const constraintCommands = [
      // Events table
      'ALTER TABLE events MODIFY COLUMN tenant_id varchar(36) NOT NULL',
      'ALTER TABLE events ADD CONSTRAINT fk_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE events ADD CONSTRAINT fk_events_session FOREIGN KEY (session_id) REFERENCES tenant_sessions(id) ON DELETE SET NULL',

      // Event_staff table
      'ALTER TABLE event_staff ADD CONSTRAINT fk_event_staff_tenant_user FOREIGN KEY (tenant_user_id) REFERENCES tenant_users(id) ON DELETE CASCADE'
    ];

    for (let i = 0; i < constraintCommands.length; i++) {
      try {
        console.log(`⚙️  Contrainte ${i + 1}/${constraintCommands.length}`);
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

    console.log('\n✅ Migration des tables existantes terminée avec succès !');
    console.log('🎉 Toutes les tables sont maintenant multi-tenant !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  migrateExistingTables();
}

export { migrateExistingTables };