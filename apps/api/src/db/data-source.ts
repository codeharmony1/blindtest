import { DataSource } from "typeorm";
import { env } from "../config/env";
import { Organizer } from "./entities/Organizer";
import { Event } from "./entities/Event";
import { EventStaff } from "./entities/EventStaff";
import { Team } from "./entities/Team";
import { Player } from "./entities/Player";
import { Round } from "./entities/Round";
import { RoundSong } from "./entities/RoundSong";
import { Answer } from "./entities/Answer";
import { Score } from "./entities/Score";

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
    Organizer,
    Event,
    EventStaff,
    Team,
    Player,
    Round,
    RoundSong,
    Answer,
    Score,
  ],
  migrations: [],
});
