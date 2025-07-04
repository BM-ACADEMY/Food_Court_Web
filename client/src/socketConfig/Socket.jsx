// socket.js
import { io } from "socket.io-client";

let socket;

 const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_BASE_SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
};

export default getSocket;