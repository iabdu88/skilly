"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lightbulb, Send } from "lucide-react";

export default function SuggestionsPage() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);

    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("company_id").eq("id", user.id).single();

      const { error: err } = await supabase.from("suggestions").insert({
        company_id: profile!.company_id,
        user_id: user.id,
        content: text.trim(),
      });
      if (err) { setError(err.message); return; }
      setSent(true);
      setText("");
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Lightbulb className="w-10 h-10 text-accent mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground">Share a Suggestion</h2>
          <p className="text-sm text-muted-foreground mt-1">Your feedback helps improve the platform.</p>
        </div>

        {sent ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <p className="text-green-400 font-semibold">Thank you! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">Your suggestion was submitted.</p>
            <button onClick={() => setSent(false)} className="mt-4 text-sm text-primary hover:underline">
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Your suggestion…"
              required
              className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={!text.trim() || isPending}
              className="w-full bg-primary text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isPending ? "Sending…" : "Submit Suggestion"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
