import { useState, useEffect, useRef, useCallback } from "react";
import { getApiUrl } from "../config";

export interface NotificationItem {
  id?: string;
  topic: string;
  payload: { message?: string; sender?: string; [key: string]: any };
  timestamp: string;
}

export function useNotificationWebSocket(wsUrl?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [subscribedTopics, setSubscribedTopics] = useState<Set<string>>(
    new Set(["GENERAL", "SYSTEM_ALERTS", "ITEM_UPDATES"])
  );

  const socketRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Connect WebSocket if URL is present
  const connect = useCallback(() => {
    if (!wsUrl || !wsUrl.startsWith("ws")) return setIsConnected(false);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        subscribedTopics.forEach((topic) =>
          ws.send(JSON.stringify({ action: "subscribe", topic }))
        );
      };

      ws.onmessage = (e) => {
        try {
          const item: NotificationItem = JSON.parse(e.data);
          setNotifications((prev) => [item, ...prev]);
        } catch {}
      };

      ws.onclose = () => setIsConnected(false);
    } catch {
      setIsConnected(false);
    }
  }, [wsUrl, subscribedTopics]);

  useEffect(() => {
    connect();
    return () => socketRef.current?.close();
  }, [connect]);

  // Sync across local browser tabs & server polling for dev
  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel("chat_sync");
      bcRef.current.onmessage = (e) => {
        if (e.data?.topic) setNotifications((prev) => [e.data, ...prev]);
      };
    } catch {}

    const interval = setInterval(async () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;
      try {
        const res = await fetch(getApiUrl("notifications"));
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) setNotifications(data.notifications);
        }
      } catch {}
    }, 2000);

    return () => {
      bcRef.current?.close();
      clearInterval(interval);
    };
  }, []);

  const subscribe = (topic: string) => {
    const cleanTopic = topic.trim().toUpperCase();
    if (!cleanTopic) return;
    setSubscribedTopics((prev) => new Set(prev).add(cleanTopic));
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "subscribe", topic: cleanTopic }));
    }
  };

  const broadcastLocalMessage = (item: NotificationItem) => {
    setNotifications((prev) => [item, ...prev]);
    bcRef.current?.postMessage(item);
  };

  return {
    isConnected,
    notifications,
    subscribe,
    subscribedTopics: Array.from(subscribedTopics),
    broadcastLocalMessage,
  };
}
