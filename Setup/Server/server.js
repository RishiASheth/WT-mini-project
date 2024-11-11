const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Store clients
const clients = {
  streamer: null,  // Single active streamer
  viewers: new Set() // Multiple viewers
};

// Send a JSON message to a client
function sendJSON(client, data) {
  if (client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending JSON message:', error);
    }
  }
}

// Broadcast to all viewers
function broadcastToViewers(data) {
  clients.viewers.forEach((viewer) => {
    if (viewer.readyState === WebSocket.OPEN) {
      try {
        viewer.send(data); // Binary or string
      } catch (error) {
        console.error('Error broadcasting to viewer:', error);
      }
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New client connected.');

  ws.on('message', (message) => {
    try {
      // Handle JSON messages
      const data = JSON.parse(message);

      if (data.type === 'streamer') {
        // Handle streamer connection
        if (clients.streamer) {
          // Disconnect existing streamer
          console.log('Existing streamer replaced.');
          sendJSON(clients.streamer, { type: 'disconnect', reason: 'New streamer connected' });
          clients.streamer.close();
        }

        clients.streamer = ws;
        console.log('Streamer connected.');

        // Streamer disconnection handling
        ws.on('close', () => {
          console.log('Streamer disconnected.');
          clients.streamer = null;
          // Notify viewers the stream ended
          broadcastToViewers(JSON.stringify({ type: 'end-stream' }));
        });

        ws.on('error', (error) => {
          console.error('Streamer error:', error);
        });

      } else if (data.type === 'viewer') {
        // Handle viewer connection
        clients.viewers.add(ws);
        console.log('Viewer connected.');

        // Notify viewer if no streamer is active
        if (!clients.streamer) {
          sendJSON(ws, { type: 'no-stream' });
        }

        ws.on('close', () => {
          console.log('Viewer disconnected.');
          clients.viewers.delete(ws);
        });

        ws.on('error', (error) => {
          console.error('Viewer error:', error);
          clients.viewers.delete(ws); // Cleanup
        });
      } else {
        console.error('Unknown client type:', data.type);
        sendJSON(ws, { type: 'error', message: 'Unknown client type' });
      }
    } catch (e) {
      // Handle binary data or invalid JSON
      if (ws === clients.streamer) {
        // Relay binary data from streamer to viewers
        broadcastToViewers(message);
      } else {
        console.error('Received invalid JSON or unsupported message type:', e);
        sendJSON(ws, { type: 'error', message: 'Invalid data format' });
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
    if (ws === clients.streamer) {
      console.log('Streamer disconnected.');
      clients.streamer = null;
      // Notify viewers the stream ended
      broadcastToViewers(JSON.stringify({ type: 'end-stream' }));
    } else if (clients.viewers.has(ws)) {
      clients.viewers.delete(ws);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server running on ws://localhost:8080');
