"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressToWebP } from "@/lib/image";
import { useTranslations } from "next-intl";
import { Upload, Camera } from "lucide-react";

interface Props {
  companyId: string;
  weekNumber: number;
  year: number;
}

export function OutfitUploadForm({ companyId, weekNumber, year }: Props) {
  const t = useTranslations("outfit");
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const compressed = await compressToWebP(f);
    setFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);

    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const path = `outfits/${companyId}/${weekNumber}-${year}/${user.id}.webp`;
      const { error: upErr } = await supabase.storage.from("outfits").upload(path, file, { upsert: true });
      if (upErr) { setError(upErr.message); return; }

      const { data: urlData } = supabase.storage.from("outfits").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("outfit_submissions").insert({
        company_id: companyId, user_id: user.id, image_url: urlData.publicUrl,
        week_number: weekNumber, year, is_winner: false,
      });

      if (dbErr) { setError(dbErr.message); return; }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-dashed border-border rounded-2xl p-5 space-y-4">
      <p className="text-sm font-medium text-foreground">{t("submitThisWeek")}</p>

      <label className="cursor-pointer block">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-56 object-cover rounded-xl" />
        ) : (
          <div className="w-full h-56 flex flex-col items-center justify-center gap-3 rounded-xl bg-background border border-border">
            <Camera className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("tapToSelect")}</span>
          </div>
        )}
        <input type="file" accept="image/*" capture="user" className="sr-only" onChange={handleFile} />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={!file || isPending}
        className="w-full bg-primary text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Upload className="w-4 h-4" />
        {isPending ? t("uploading") : t("submit")}
      </button>
    </form>
  );
}
