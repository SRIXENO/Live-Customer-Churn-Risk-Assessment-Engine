import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [status, setStatus] = useState('offline');
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    window.__xenoSocket = socket;
    socket.on('connect', () => setStatus('online'));
    socket.on('disconnect', () => setStatus('reconnecting'));
    socket.on('connect_error', () => setStatus('offline'));
    return () => {
      window.__xenoSocket = null;
      socket.close();
    };
  }, []);

  return <SocketContext.Provider value={{ status, socket: socketRef.current }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext) || { status: 'offline', socket: null };
