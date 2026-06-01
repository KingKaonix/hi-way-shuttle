import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface Client {
  ws: WebSocket;
  userId?: number;
  role?: string;
  driverId?: number;
}

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map<WebSocket, Client>();

  wss.on('connection', (ws) => {
    const client: Client = { ws };
    clients.set(ws, client);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(client, msg);
      } catch { /* ignore malformed */ }
    });

    ws.on('close', () => clients.delete(ws));
  });

  function handleMessage(client: Client, msg: any) {
    switch (msg.type) {
      case 'auth':
        client.userId = msg.userId;
        client.role = msg.role;
        client.driverId = msg.driverId;
        wsSend(client.ws, { type: 'auth:ok' });
        break;
      case 'driver:location':
        // Broadcast driver location to relevant clients
        broadcast({ type: 'driver:location', driverId: client.driverId, lat: msg.lat, lng: msg.lng });
        break;
      case 'trip:status':
        broadcast({ type: 'trip:status', tripId: msg.tripId, status: msg.status });
        break;
    }
  }

  function wsSend(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function broadcast(data: any) {
    for (const [, client] of clients) {
      wsSend(client.ws, data);
    }
  }

  return { broadcast, wss };
}
