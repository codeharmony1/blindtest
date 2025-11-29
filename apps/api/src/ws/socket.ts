import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "../config/env";

export let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.on("connection", (socket) => {
    console.log("[ws] client connected", socket.id);

    // Client annonce l'event (room) et son rôle
    socket.on(
      "join_event",
      (payload: {
        eventCode: string;
        role: "PLAYER" | "DJ" | "ADMIN" | "DISPLAY";
        teamId?: string;
      }) => {
        const room = `event:${payload.eventCode}`;
        socket.join(room);
        if (payload.role === "DISPLAY")
          socket.join(`display:${payload.eventCode}`);
        if (payload.teamId) socket.join(`team:${payload.teamId}`);
        socket.emit("joined", { ok: true, room });
      },
    );

    // TODO: submit_answer (via WS) -> persister & émettre un ack

    // Staff controls (simplifiés)
    socket.on(
      "open_song",
      (data: {
        eventCode: string;
        roundId: string;
        songId: string;
        duration: number;
        endsAt?: string;
      }) => {
        io.to(`event:${data.eventCode}`).emit("round_started", {
          roundId: data.roundId,
          songId: data.songId,
          duration: data.duration,
          endsAt: data.endsAt,
        });
      },
    );
    socket.on(
      "close_song",
      (data: { eventCode: string; roundId: string; songId: string; title?: string; artist?: string }) => {
        io.to(`event:${data.eventCode}`).emit("round_ended", {
          roundId: data.roundId,
          songId: data.songId,
          title: data.title,
          artist: data.artist,
        });
      },
    );
    socket.on(
      "official_answer",
      (data: {
        eventCode: string;
        songId: string;
        title: string;
        artist: string;
      }) => {
        io.to(`display:${data.eventCode}`).emit("official_answer", {
          songId: data.songId,
          title: data.title,
          artist: data.artist,
        });
      },
    );
    socket.on(
      "leaderboard_update",
      (data: { eventCode: string; leaderboard: any[] }) => {
        io.to(`event:${data.eventCode}`).emit("leaderboard_update", {
          eventCode: data.eventCode,
          teams: data.leaderboard,
        });
      },
    );
    socket.on(
      "round_scores_ready",
      (data: {
        eventCode: string;
        roundNumber: number;
        roundScores: Array<{
          teamId: string;
          name: string;
          roundPoints: number;
          totalPoints: number;
          rank: number;
        }>;
      }) => {
        io.to(`event:${data.eventCode}`).emit("round_scores_ready", {
          eventCode: data.eventCode,
          roundNumber: data.roundNumber,
          roundScores: data.roundScores,
        });
      },
    );
    socket.on(
      "event_completed",
      (data: {
        eventCode: string;
        totalRounds: number;
        totalSongs: number;
        totalTeams: number;
        totalPlayers: number;
        duration: number;
        finalLeaderboard: any[];
      }) => {
        io.to(`event:${data.eventCode}`).emit("event_completed", {
          eventCode: data.eventCode,
          totalRounds: data.totalRounds,
          totalSongs: data.totalSongs,
          totalTeams: data.totalTeams,
          totalPlayers: data.totalPlayers,
          duration: data.duration,
          finalLeaderboard: data.finalLeaderboard,
        });
      },
    );

    // Événements pour le mode table
    socket.on(
      "table_created",
      (data: { eventCode: string; tableId: string; tableName: string }) => {
        io.to(`event:${data.eventCode}`).emit("table_created", {
          tableId: data.tableId,
          tableName: data.tableName,
        });
      },
    );

    socket.on(
      "team_joined_table",
      (data: {
        eventCode: string;
        teamId: string;
        teamName: string;
        tableId: string;
        tableName: string;
      }) => {
        io.to(`event:${data.eventCode}`).emit("team_joined_table", {
          teamId: data.teamId,
          teamName: data.teamName,
          tableId: data.tableId,
          tableName: data.tableName,
        });
      },
    );

    socket.on(
      "table_leaderboard_update",
      (data: { eventCode: string; tableLeaderboard: any[] }) => {
        io.to(`event:${data.eventCode}`).emit("table_leaderboard_update", {
          eventCode: data.eventCode,
          tables: data.tableLeaderboard,
        });
      },
    );

    socket.on(
      "table_scores_ready",
      (data: {
        eventCode: string;
        roundNumber: number;
        tableScores: Array<{
          tableId: string;
          tableName: string;
          roundPoints: number;
          totalPoints: number;
          rank: number;
          teamsCount: number;
        }>;
      }) => {
        io.to(`event:${data.eventCode}`).emit("table_scores_ready", {
          eventCode: data.eventCode,
          roundNumber: data.roundNumber,
          tableScores: data.tableScores,
        });
      },
    );
  });
}
