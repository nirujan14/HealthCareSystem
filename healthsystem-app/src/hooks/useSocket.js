import { useEffect, useRef } from "react";
import io from "socket.io-client";

// ✅ pick API URL from env
const API_BASE = process.env.EXPO_PUBLIC_API_URL;

export default function useSocket(patientId, onEvents = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!patientId) return;
    const socket = io(API_BASE, { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("identify", patientId);
    });

    Object.entries(onEvents).forEach(([name, handler]) => {
      socket.on(name, handler);
    });

    ref.current = socket;
    return () => socket.disconnect();
  }, [patientId]);

  return ref.current;
}
