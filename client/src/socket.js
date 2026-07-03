import { io } from 'socket.io-client';
import { getToken } from './api.js';
import { getServerUrl } from './config.js';

let socket = null;

export function getSocket() {
  if (!socket) {
    const url = getServerUrl();
    const opts = { auth: { token: getToken() }, autoConnect: false };
    // En dev, url === '' -> même origine (proxy Vite) ; en prod -> serveur configuré.
    socket = url ? io(url, opts) : io(opts);
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getToken() };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}
