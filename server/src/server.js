const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { PORT, CLIENT_URL } = require('./config/env');
const { initializeSocket } = require('./services/socketService');

const startServer = async () => {
  // Connect to database
  await connectDB();

  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  initializeSocket(io);

  server.listen(PORT, () => {
    console.log(`[SlotSync API] Server listening on port ${PORT}`);
    console.log(`[SlotSync API] Live Coordination Room active via Socket.IO`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
