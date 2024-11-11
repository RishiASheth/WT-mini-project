const WebSocket = require('ws');

// Store connected clients
const clients = {
  streamers: null, // Only one active streamer
  viewers: new Set()
};

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Identify client type (streamer or viewer)
      if (data.type === 'streamer') {
        console.log('Streamer connected');
        if (clients.streamers) {
          // Notify the old streamer of being disconnected
          clients.streamers.close();
        }
        clients.streamers = ws;

        ws.on('close', () => {
          console.log('Streamer disconnected');
          clients.streamers = null;
          // Notify all viewers that the stream ended
          clients.viewers.forEach((viewer) => {
            if (viewer.readyState === WebSocket.OPEN) {
              viewer.send(JSON.stringify({ type: 'end-stream' }));
            }
          });
        });
      } else if (data.type === 'viewer') {
        console.log('Viewer connected');
        clients.viewers.add(ws);

        ws.on('close', () => {
          console.log('Viewer disconnected');
          clients.viewers.delete(ws);
        });

        // Notify the viewer if there's no active streamer
        if (!clients.streamers) {
          ws.send(JSON.stringify({ type: 'no-stream' }));
        }
      }
    } catch (e) {
      // Relay binary data from streamer to viewers
      if (ws === clients.streamers) {
        clients.viewers.forEach((viewer) => {
          if (viewer.readyState === WebSocket.OPEN) {
            try {
              viewer.send(message); // Relay screen-sharing data
            } catch (error) {
              console.error('Error sending binary data to viewer:', error);
            }
          }
        });
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server running on ws://localhost:8080');
