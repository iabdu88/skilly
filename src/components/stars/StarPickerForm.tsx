"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Star } from "lucide-react";
import type { User } from "@/types/database";

interface Props {
  type: "week" | "month";
  period: string;
  companyId: string;
  chosenBy: string;
  employees: User[];
}

export function StarPickerForm({ type, period, companyId, chosenBy, employees }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [isPending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    start(async () => {
      const supabase = createClient();
      const emp = employees.find((e) => e.id === selected);

      await supabase.from("stars").insert({
        company_id: companyId,
        user_id: selected,
        type,
        period,
        chosen_by: chosenBy,
      });

      await supabase.from("notifications").insert({
        user_id: selected,
        type: "new_star",
        title: `⭐ Star of the ${type === "week" ? "Week" : "Month"}!`,
        body: `Congratulations ${emp?.full_name}! You are the Star of the ${type === "week" ? "Week" : "Month"} for ${period}.`,
        is_read: false,
        metadata: { period, type },
      });

      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">
        Choose Star of the {type === "week" ? "Week" : "Month"}
      </p>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        required
        className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Select employee…</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.full_name}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!selected || isPending}
        className="w-full bg-primary text-white font-semibold rounded-xl py-2 text-sm hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Star className="w-3.5 h-3.5" />
        {isPending ? "Saving…" : "Award Star"}
      </button>
    </form>
  );
}
