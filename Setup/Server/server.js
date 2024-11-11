const WebSocket = require('ws');

// Store clients: one streamer, multiple viewers
const clients = {
  streamer: null,  // Only one active streamer
  viewers: new Set()  // Set to store all viewers
};

// Function to send JSON data to a specific client
function sendJSON(client, data) {
  if (client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending JSON message:', error);
    }
  }
}

// Function to broadcast a message to all viewers
function broadcastToViewers(data) {
  clients.viewers.forEach((viewer) => {
    if (viewer.readyState === WebSocket.OPEN) {
      try {
        viewer.send(data);  // Send binary or JSON data
      } catch (error) {
        console.error('Error broadcasting to viewer:', error);
      }
    }
  });
}

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New client connected.');

  ws.on('message', (message) => {
    try {
      // Handle JSON messages
      const data = JSON.parse(message);

      if (data.type === 'streamer') {
        // Handle streamer connection
        if (clients.streamer) {
          // Notify viewers that a new streamer is connecting, replacing the previous one
          sendJSON(clients.streamer, { type: 'disconnect', reason: 'New streamer connected' });
          clients.streamer.close();
        }

        clients.streamer = ws;
        console.log('Streamer connected.');

        // Streamer disconnection handling
        ws.on('close', () => {
          console.log('Streamer disconnected.');
          clients.streamer = null;
          // Notify all viewers that the stream has ended
          broadcastToViewers(JSON.stringify({ type: 'end-stream' }));
        });

        ws.on('error', (error) => {
          console.error('Streamer error:', error);
        });

      } else if (data.type === 'viewer') {
        // Handle viewer connection
        clients.viewers.add(ws);
        console.log('Viewer connected.');

        // Notify viewer if there is no active streamer
        if (!clients.streamer) {
          sendJSON(ws, { type: 'no-stream' });
        }

        // Viewer disconnection handling
        ws.on('close', () => {
          console.log('Viewer disconnected.');
          clients.viewers.delete(ws);
        });

        ws.on('error', (error) => {
          console.error('Viewer error:', error);
          clients.viewers.delete(ws); // Clean up if there’s an error
        });
      } else {
        console.error('Unknown client type:', data.type);
        sendJSON(ws, { type: 'error', message: 'Unknown client type' });
      }
    } catch (e) {
      // Handle binary data from the streamer
      if (ws === clients.streamer) {
        // Relay binary data to all viewers
        broadcastToViewers(message);
      } else {
        console.error('Invalid JSON message received:', e);
        sendJSON(ws, { type: 'error', message: 'Invalid data format' });
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
    if (ws === clients.streamer) {
      console.log('Streamer disconnected.');
      clients.streamer = null;
      // Notify viewers that the stream has ended
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
