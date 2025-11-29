import { DataSource } from "typeorm";
import { env } from "../config/env";
import { Organizer } from "./entities/Organizer";
import { Event } from "./entities/Event";
import { EventStaff } from "./entities/EventStaff";
import { Team } from "./entities/Team";
import { Table } from "./entities/Table";
import { Player } from "./entities/Player";
import { Round } from "./entities/Round";
import { RoundSong } from "./entities/RoundSong";
import { Answer } from "./entities/Answer";
import { Score } from "./entities/Score";
// Nouvelles entités multi-tenant
import { Tenant } from "./entities/Tenant";
import { TenantUser } from "./entities/TenantUser";
import { TenantSession } from "./entities/TenantSession";
import { Payment } from "./entities/Payment";
// Entités super-admin
import { SuperAdmin } from "./entities/SuperAdmin";
import { AuditLog } from "./entities/AuditLog";
// Entités auth
import { PasswordResetToken } from "./entities/PasswordResetToken";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  charset: "utf8mb4",
  synchronize: false, // DB déjà créée via script SQL
  logging: true,
  entities: [
    // Entités legacy
    Organizer,
    Event,
    EventStaff,
    Team,
    Table,
    Player,
    Round,
    RoundSong,
    Answer,
    Score,
    // Nouvelles entités multi-tenant
    Tenant,
    TenantUser,
    TenantSession,
    Payment,
    // Entités super-admin
    SuperAdmin,
    AuditLog,
    // Entités auth
    PasswordResetToken,
  ],
  migrations: ["src/db/migrations/*.ts"],
});
