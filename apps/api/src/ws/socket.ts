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
      (data: { eventCode: string; roundId: string; songId: string }) => {
        io.to(`event:${data.eventCode}`).emit("round_ended", {
          roundId: data.roundId,
          songId: data.songId,
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
  });
}
