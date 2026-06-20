"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import type { SalesEntry } from "@/types/database";

interface Props {
  companyId: string;
  date: string;
  existingEntry: SalesEntry | null;
}

export function SalesEntryForm({ companyId, date, existingEntry }: Props) {
  const t = useTranslations("sales");
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseFloat(fd.get("amount") as string);
    const notes = fd.get("notes") as string;
    setError(null);

    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (existingEntry) {
        const { error: err } = await supabase.from("sales_entries")
          .update({ amount, notes: notes || null }).eq("id", existingEntry.id);
        if (err) { setError(err.message); return; }
      } else {
        const { error: err } = await supabase.from("sales_entries").insert({
          company_id: companyId, user_id: user.id, amount, date, notes: notes || null,
        });
        if (err) { setError(err.message); return; }
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-4 space-y-4">
      <h3 className="font-semibold text-foreground">
        {existingEntry ? t("updateEntry") : t("logSales")}
      </h3>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t("salesAmount")}</label>
        <input name="amount" type="number" step="0.01" min="0" required defaultValue={existingEntry?.amount}
          className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="0.00"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t("notes")}</label>
        <textarea name="notes" rows={2} defaultValue={existingEntry?.notes ?? ""}
          className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder={t("notesPlaceholder")}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={isPending}
        className="w-full bg-primary text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t("saving") : existingEntry ? t("update") : t("log")}
      </button>
    </form>
  );
}
