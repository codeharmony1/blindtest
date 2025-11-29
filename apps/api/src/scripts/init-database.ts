/**
 * Script d'initialisation de la base de données
 * Crée automatiquement toutes les tables à partir des entités TypeORM
 *
 * Usage:
 * - En développement: npm run init:db -w @blindtest/api
 * - En production: docker exec blindtest-api node dist/scripts/init-database.js
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';

// Import de toutes les entités
import { Organizer } from '../db/entities/Organizer';
import { Event } from '../db/entities/Event';
import { EventStaff } from '../db/entities/EventStaff';
import { Team } from '../db/entities/Team';
import { Player } from '../db/entities/Player';
import { Round } from '../db/entities/Round';
import { RoundSong } from '../db/entities/RoundSong';
import { Answer } from '../db/entities/Answer';
import { Score } from '../db/entities/Score';
import { Tenant } from '../db/entities/Tenant';
import { TenantUser } from '../db/entities/TenantUser';
import { TenantSession } from '../db/entities/TenantSession';
import { Payment } from '../db/entities/Payment';
import { SuperAdmin } from '../db/entities/SuperAdmin';
import { AuditLog } from '../db/entities/AuditLog';
import { PasswordResetToken } from '../db/entities/PasswordResetToken';

async function initDatabase() {
  console.log('==============================================');
  console.log('  Initialisation de la base de données');
  console.log('==============================================\n');

  console.log(`📦 Base de données: ${env.DB_NAME}`);
  console.log(`🔗 Serveur: ${env.DB_HOST}:${env.DB_PORT}`);
  console.log(`👤 Utilisateur: ${env.DB_USER}\n`);

  // Créer une DataSource temporaire avec synchronize: true
  const InitDataSource = new DataSource({
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    synchronize: true, // ⚠️ Active la création automatique des tables
    logging: true,
    entities: [
      Organizer,
      Event,
      EventStaff,
      Team,
      Player,
      Round,
      RoundSong,
      Answer,
      Score,
      Tenant,
      TenantUser,
      TenantSession,
      Payment,
      SuperAdmin,
      AuditLog,
      PasswordResetToken,
    ],
  });

  try {
    console.log('⏳ Connexion à la base de données...\n');
    await InitDataSource.initialize();
    console.log('✅ Connexion établie\n');

    console.log('⏳ Création/mise à jour des tables...\n');
    // Le simple fait d'initialiser avec synchronize: true crée les tables
    await InitDataSource.synchronize();

    console.log('\n✅ Tables créées avec succès!\n');

    // Lister les tables créées
    const tables = await InitDataSource.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [env.DB_NAME]);

    console.log('📋 Tables disponibles:');
    console.log('==============================================');
    tables.forEach((table: any, index: number) => {
      console.log(`${index + 1}. ${table.TABLE_NAME}`);
    });
    console.log('==============================================\n');

    console.log('🎉 Initialisation terminée avec succès!\n');
    console.log('Prochaines étapes:');
    console.log('1. Créer un super-admin: npm run create:super-admin');
    console.log('2. Démarrer l\'application: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error);

    if (error instanceof Error) {
      console.error('\n📝 Détails:', error.message);

      // Messages d'erreur courants
      if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Solution: Vérifiez que MariaDB/MySQL est démarré');
        console.error('   docker ps | grep mariadb');
      } else if (error.message.includes('Access denied')) {
        console.error('\n💡 Solution: Vérifiez vos identifiants DB dans le fichier .env');
        console.error('   DB_USER, DB_PASS, DB_NAME');
      } else if (error.message.includes('Unknown database')) {
        console.error('\n💡 Solution: Créez d\'abord la base de données:');
        console.error('   CREATE DATABASE ' + env.DB_NAME + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
      }
    }

    process.exit(1);
  } finally {
    if (InitDataSource.isInitialized) {
      await InitDataSource.destroy();
      console.log('🔌 Connexion fermée\n');
    }
  }
}

// Exécuter le script
initDatabase();
