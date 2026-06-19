"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, X, Check } from "lucide-react";

interface Notif {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  userId: string;
  initialUnread: number;
  initialNotifications: Notif[];
}

export function NotificationBell({ userId, initialUnread, initialNotifications }: Props) {
  const [unread, setUnread]   = useState(initialUnread);
  const [notifs, setNotifs]   = useState<Notif[]>(initialNotifications);
  const [open, setOpen]       = useState(false);
  const [pulse, setPulse]     = useState(false);
  const panelRef              = useRef<HTMLDivElement>(null);

  // Subscribe to new notifications in real time
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifs-${userId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notif;
          setNotifs((prev) => [n, ...prev].slice(0, 20));
          setUnread((c) => c + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Close panel when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function markAllRead() {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-xl hover:bg-muted transition-colors ${pulse ? "animate-bounce" : ""}`}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-[10px] font-bold text-black flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-border">
            {notifs.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</li>
            ) : (
              notifs.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${!n.is_read ? "bg-primary/5" : ""}`}>
                  <p className={`text-sm font-medium ${n.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
