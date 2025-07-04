// let io;

// const initSocket = (server) => {
//   const socketIO = require("socket.io")(server, {
//     cors: {
//       origin: "*", // Set your frontend origin in production
//     },
//   });

//   io = socketIO;

//   // Store connected restaurant sockets (optional)
//   const restaurantSockets = {};

//   socketIO.on("connection", (socket) => {
//     console.log("Client connected:", socket.id);

//     // Join restaurant-specific room
//     socket.on("joinRestaurantRoom", (restaurantId) => {
//       restaurantSockets[restaurantId] = socket.id;
//       socket.join(restaurantId);
//     });

//     socket.on("disconnect", () => {
//       console.log("Client disconnected:", socket.id);
//       // Optional cleanup
//     });
//   });
// };

// // Export both initializer and `io` instance to emit events from controllers
// module.exports = {
//   initSocket,
//   getIO: () => io,
// };



// let io;

// const initSocket = (server) => {
//   const socketIO = require("socket.io")(server, {
//     cors: {
//       origin: [
//         process.env.DEV_FRONTEND_URL, // e.g., http://localhost:5173
//         "https://pegasus2025.com",
//         "https://www.pegasus2025.com"
//       ],
//       credentials: true,
//     },
//   });

//   io = socketIO;

//   socketIO.on("connection", (socket) => {
//     console.log("✅ Socket connected:", socket.id);

//     socket.on("joinRestaurantRoom", (restaurantId) => {
//       socket.join(restaurantId);
//       console.log(`📡 Restaurant ${restaurantId} joined room`);
//     });

//     socket.on("disconnect", () => {
//       console.log("⚠️ Socket disconnected:", socket.id);
//     });
//   });
// };

// const getIO = () => io;

// module.exports = { initSocket, getIO };




let io;

const initSocket = async (server) => {
  const { createAdapter } = require("@socket.io/redis-adapter");
  const { createClient } = require("redis");

  const socketIO = require("socket.io")(server, {
    cors: {
      origin: [
        process.env.DEV_FRONTEND_URL,
        "https://pegasus2025.com",
        "https://www.pegasus2025.com"
      ],
      credentials: true,
    },
  });

  // Redis pub/sub setup
  const pubClient = createClient({ url: "redis://127.0.0.1:6379" });
  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  socketIO.adapter(createAdapter(pubClient, subClient));

  io = socketIO;

  socketIO.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("joinRestaurantRoom", (restaurantId) => {
      socket.join(restaurantId);
      console.log(`📡 Restaurant ${restaurantId} joined room`);
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Socket disconnected:", socket.id);
    });
  });
};

const getIO = () => io;

module.exports = { initSocket, getIO };
