import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export default function useRealTime(event, callback) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !callback) return;
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
}

