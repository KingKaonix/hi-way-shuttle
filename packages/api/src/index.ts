import http from 'http';
import app from './app';
import { config } from './config';
import { setupWebSocket } from './ws';

const server = http.createServer(app);

// WebSocket
setupWebSocket(server);

server.listen(config.port, () => {
  console.log(`🚐 Hi-Way-Shuttle v2 running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/health`);
  console.log(`   API:    http://localhost:${config.port}/api`);
  console.log(`   WS:     ws://localhost:${config.port}/ws`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced exit after 5s timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
