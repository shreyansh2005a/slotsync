/**
 * Real-Time Socket.IO Coordination Room
 */

let ioInstance = null;

const initializeSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Join role room or user room
    socket.on('join_user_room', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('join_role_room', (role) => {
      if (role) socket.join(`role:${role}`);
    });

    socket.on('join_drive_room', (driveId) => {
      if (driveId) socket.join(`drive:${driveId}`);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

const getIo = () => ioInstance;

const broadcastToRole = (role, event, data) => {
  if (ioInstance) {
    ioInstance.to(`role:${role}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
};

const broadcastDriveUpdate = (driveId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`drive:${driveId}`).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIo,
  broadcastToRole,
  emitToUser,
  broadcastDriveUpdate
};
