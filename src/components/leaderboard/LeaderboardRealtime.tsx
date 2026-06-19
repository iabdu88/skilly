"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { getLevelInfo } from "@/lib/gamification";

interface LeaderUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
}

interface Props {
  initialUsers: LeaderUser[];
  currentUserId: string;
  companyId: string;
}

export function LeaderboardRealtime({ initialUsers, currentUserId, companyId }: Props) {
  const [users, setUsers] = useState<LeaderUser[]>(initialUsers);
  const [toast, setToast] = useState<{ text: string; up: boolean } | null>(null);
  const prevRankRef = useRef<number>(-1);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`lb-${companyId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
        (payload) => {
          const updated = payload.new as LeaderUser & { company_id?: string };
          if (updated.company_id !== companyId) return;
          setUsers((prev) =>
            [...prev.map((u) => (u.id === updated.id ? { ...u, points: updated.points } : u))].sort(
              (a, b) => b.points - a.points
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  // Show toast on rank change (skip initial render)
  useEffect(() => {
    const myRank = users.findIndex((u) => u.id === currentUserId) + 1;
    if (myRank === 0) return;
    if (prevRankRef.current > 0 && myRank !== prevRankRef.current) {
      const up = myRank < prevRankRef.current;
      setToast({ text: up ? `You moved up to #${myRank}! 🎉` : `You dropped to #${myRank}`, up });
      setTimeout(() => setToast(null), 3500);
    }
    prevRankRef.current = myRank;
  }, [users, currentUserId]);

  const myRank = users.findIndex((u) => u.id === currentUserId) + 1;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      {/* Rank banner */}
      {myRank > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-accent shrink-0" />
          <p className="text-sm text-foreground">
            Your rank: <span className="font-bold text-accent">#{myRank}</span>
            {myRank === 1 && " 🏆 You're #1!"}
          </p>
        </div>
      )}

      {/* Rank-change toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium border ${
            toast.up
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {toast.up ? <TrendingUp className="w-4 h-4 shrink-0" /> : <TrendingDown className="w-4 h-4 shrink-0" />}
          {toast.text}
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {users.map((u, idx) => {
          const isMe = u.id === currentUserId;
          const lvl = getLevelInfo(u.points);
          return (
            <div
              key={u.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                isMe ? "bg-primary/10 border-primary/30" : "bg-card border-border"
              }`}
            >
              <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                {idx < 3 ? medals[idx] : `#${idx + 1}`}
              </span>
              {u.avatar_url ? (
                <img src={u.avatar_url} alt={u.full_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{u.full_name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                  {u.full_name} {isMe && "(You)"}
                </p>
                <p className="text-[10px] text-muted-foreground" style={{ color: lvl.color }}>
                  {lvl.emoji} Lv.{lvl.level} {lvl.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Trophy className="w-3.5 h-3.5 text-accent" />
                <span className="text-sm font-semibold text-foreground">{u.points.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
