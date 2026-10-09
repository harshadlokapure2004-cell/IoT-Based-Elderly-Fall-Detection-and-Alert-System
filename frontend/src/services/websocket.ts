import { io, Socket } from 'socket.io-client';
import type { SensorReading, FallEvent, NotificationLog } from '../types';

let socket: Socket | null = null;

export const initWebSocket = (
  onSensorUpdate?: (reading: SensorReading) => void,
  onFallEvent?: (event: FallEvent) => void,
  onNotificationSent?: (payload: { event_id: string; logs: NotificationLog[] }) => void,
  onEventUpdated?: (event: FallEvent) => void
) => {
  if (socket && socket.connected) return socket;

  const url = window.location.origin;
  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[WebSocket] Connected to Fall Detection Server ID:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.warn('[WebSocket] Disconnected from server');
  });

  if (onSensorUpdate) {
    socket.on('sensor_update', (data: SensorReading) => {
      onSensorUpdate(data);
    });
  }

  if (onFallEvent) {
    socket.on('fall_event', (data: FallEvent) => {
      onFallEvent(data);
    });
  }

  if (onNotificationSent) {
    socket.on('notification_sent', (data: { event_id: string; logs: NotificationLog[] }) => {
      onNotificationSent(data);
    });
  }

  if (onEventUpdated) {
    socket.on('event_updated', (data: FallEvent) => {
      onEventUpdated(data);
    });
  }

  return socket;
};

export const getSocket = () => socket;
