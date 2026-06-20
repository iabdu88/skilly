"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChatMessage, User } from "@/types/database";

interface Props {
  initialMessages: (ChatMessage & { user: User })[];
  userId: string;
  companyId: string;
  userName: string;
  avatarUrl: string | null | undefined;
}

export function ChatRoom({ initialMessages, userId, companyId, userName, avatarUrl }: Props) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${companyId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `company_id=eq.${companyId}` },
        async (payload) => {
          const { data: user } = await supabase
            .from("users")
            .select("id, full_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();
          setMessages((prev) => [...prev, { ...(payload.new as ChatMessage), user: user as User }]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    await supabase.from("chat_messages").insert({ company_id: companyId, user_id: userId, content });
    setSending(false);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.user_id === userId;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
              {msg.user?.avatar_url ? (
                <img src={msg.user.avatar_url} alt={msg.user?.full_name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{msg.user?.full_name?.charAt(0) ?? "?"}</span>
                </div>
              )}
              <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!isMe && <span className="text-xs text-muted-foreground px-1">{msg.user?.full_name}</span>}
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  isMe ? "bg-primary text-white rounded-tr-sm" : "bg-surface border border-border text-foreground rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage}
        className="border-t border-border p-3 flex items-center gap-2 bg-surface/50 backdrop-blur sticky bottom-0"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          className="flex-1 rounded-xl bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
