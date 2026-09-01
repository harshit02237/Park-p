const { Server } = require("socket.io");

let io;

function init(server) {
  if (io) {
    console.warn('Socket.io already initialized — skipping re-init');
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_admin", () => {
      socket.join("admin_room");
      console.log(`Socket ${socket.id} joined admin_room`);
    });

    socket.on("join_restaurant", (restaurantId) => {
      if (restaurantId) {
        socket.join(String(restaurantId));
        console.log(`Socket ${socket.id} joined restaurant ${restaurantId}`);
      }
    });

    socket.on("leave_restaurant", (restaurantId) => {
      if (restaurantId) socket.leave(String(restaurantId));
    });

    socket.on("join_user", (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        socket.join(String(userId));
        console.log(`Socket ${socket.id} joined user room ${userId}`);
      }
    });

    socket.on("join_order", (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        socket.join(String(orderId));
        console.log(`Socket ${socket.id} joined order room ${orderId}`);
      }
    });


    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    console.warn("Socket.io not initialized yet");
    return null;
  }
  return io;
}

module.exports = { init, getIO };

