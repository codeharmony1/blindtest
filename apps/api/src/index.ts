import http from "http";
import app from "./app";
import { initSocket } from "./ws/socket";
import { env } from "./config/env";
import { AppDataSource } from "./db/data-source";

const server = http.createServer(app);
initSocket(server);

AppDataSource.initialize()
  .then(() => {
    server.listen(env.API_PORT, env.API_HOST, () => {
      console.log(`[api] http://${env.API_HOST}:${env.API_PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB init error:", err);
    process.exit(1);
  });
