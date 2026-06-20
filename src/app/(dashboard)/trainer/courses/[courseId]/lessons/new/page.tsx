"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewLessonPage() {
  const t = useTranslations("training");
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    start(async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId);

      const { error: err } = await supabase.from("lessons").insert({
        course_id: courseId,
        title: fd.get("title") as string,
        content: fd.get("content") as string,
        video_url: (fd.get("video_url") as string) || null,
        order_index: (count ?? 0) + 1,
      });

      if (err) { setError(err.message); return; }
      router.push(`/trainer/courses/${courseId}`);
    });
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/trainer/courses/${courseId}`} className="p-2 hover:bg-surface rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">{t("newLesson")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("lessonTitleLabel")}</label>
          <input name="title" required
            className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={t("lessonTitlePlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("lessonContent")}</label>
          <textarea name="content" required rows={8}
            className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder={t("lessonContentPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("videoUrl")}</label>
          <input name="video_url" type="url"
            className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://..."
          />
        </div>

        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2">{error}</p>}

        <button type="submit" disabled={isPending}
          className="w-full bg-primary text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? t("savingLesson") : t("saveLesson")}
        </button>
      </form>
    </div>
  );
}
