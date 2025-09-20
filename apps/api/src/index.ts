import http from 'http';
import app from './app';
import { initSocket } from './ws/socket';
import { env } from './config/env';

const server = http.createServer(app);
initSocket(server);

server.listen(env.API_PORT, env.API_HOST, () => {
  console.log(`[api] http://${env.API_HOST}:${env.API_PORT}`);
});
