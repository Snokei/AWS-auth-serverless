import React, { useState } from "react";
import { useNotificationWebSocket } from "../hooks/useNotificationWebSocket";
import { getApiUrl } from "../config";
import { Send, Hash, Radio, User, MessageCircle } from "lucide-react";

interface NotificationCenterProps {
  wsUrl?: string;
  userName?: string;
}

export default function NotificationCenter({ wsUrl, userName }: NotificationCenterProps) {
  const { isConnected, notifications, subscribe, subscribedTopics, broadcastLocalMessage } =
    useNotificationWebSocket(wsUrl);

  const [newTopic, setNewTopic] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState(subscribedTopics[0] || "GENERAL");

  const senderName = userName || "User";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    const topic = newTopic.trim().toUpperCase();
    subscribe(topic);
    setActiveChannel(topic);
    setNewTopic("");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const text = chatMessage.trim();
    setChatMessage("");

    const itemPayload = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      topic: activeChannel,
      payload: { sender: senderName, message: text },
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(getApiUrl("notifications/publish"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: activeChannel, payload: itemPayload.payload }),
      });
      const data = await res.json();
      broadcastLocalMessage(res.ok && data.notification ? data.notification : itemPayload);
    } catch {
      broadcastLocalMessage(itemPayload);
    }
  };

  const channelMessages = notifications.filter(
    (item) => item.topic.toUpperCase() === activeChannel.toUpperCase()
  );

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm text-xs overflow-hidden flex flex-col md:flex-row min-h-[460px]">
      {/* Channels Sidebar */}
      <div className="w-full md:w-52 bg-zinc-50 border-r border-zinc-200 p-4 space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-indigo-600" />
              Channels
            </span>
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
              title={isConnected ? "WebSocket Connected" : "Local Mode"}
            />
          </div>

          <div className="space-y-1">
            {subscribedTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveChannel(topic)}
                className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs cursor-pointer ${
                  activeChannel === topic ? "bg-indigo-600 text-white font-semibold" : "text-zinc-700 hover:bg-zinc-200/60"
                }`}
              >
                <Hash className="w-3.5 h-3.5 opacity-70" />
                <span>{topic}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubscribe} className="flex gap-1 pt-1">
            <input
              type="text"
              placeholder="New topic..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-zinc-300 rounded-md text-[11px]"
            />
            <button type="submit" className="px-2.5 py-1 bg-zinc-900 text-white rounded-md font-medium text-[11px] cursor-pointer">
              +
            </button>
          </form>
        </div>

        <div className="pt-3 border-t border-zinc-200 text-zinc-500 text-[11px] flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-zinc-400" />
          <span className="truncate">{senderName}</span>
        </div>
      </div>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col justify-between bg-white">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-zinc-900 text-sm">#{activeChannel}</h2>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            {isConnected ? "AWS WS Live" : "Local Sync Mode"}
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto max-h-[320px] space-y-3">
          {channelMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 text-zinc-400 space-y-1">
              <MessageCircle className="w-7 h-7 opacity-30 text-indigo-500" />
              <p className="font-medium text-zinc-600">No messages in #{activeChannel}</p>
            </div>
          ) : (
            channelMessages.slice().reverse().map((msg, idx) => {
              const sender = msg.payload?.sender || "System";
              const isSelf = sender === senderName;
              return (
                <div key={msg.id || idx} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-semibold text-zinc-700 text-[10px]">{sender}</span>
                    <span className="text-[9px] text-zinc-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className={`max-w-md px-3 py-1.5 rounded-lg text-xs ${isSelf ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                    {msg.payload?.message || JSON.stringify(msg.payload)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-100 flex gap-2">
          <input
            type="text"
            placeholder={`Message #${activeChannel}...`}
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
          />
          <button type="submit" disabled={!chatMessage.trim()} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
