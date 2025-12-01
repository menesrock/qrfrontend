import io, { Socket } from 'socket.io-client';

// For Expo web, we need to use hardcoded values
// Use environment variable in production, fallback to localhost for development
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

export default initializeSocket;
