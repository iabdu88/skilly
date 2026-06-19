"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressToWebP } from "@/lib/image";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";

export default function NewCoursePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);

  async function handleThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressToWebP(file);
    setThumbFile(compressed);
    setThumb(URL.createObjectURL(compressed));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("users").select("company_id").eq("id", user.id).single();

      let thumbnailUrl: string | null = null;
      if (thumbFile) {
        const path = `thumbnails/${profile!.company_id}/${Date.now()}.webp`;
        const { error: upErr } = await supabase.storage.from("course-media").upload(path, thumbFile);
        if (upErr) { setError(upErr.message); return; }
        const { data: urlData } = supabase.storage.from("course-media").getPublicUrl(path);
        thumbnailUrl = urlData.publicUrl;
      }

      const { error: insertErr } = await supabase.from("courses").insert({
        company_id: profile!.company_id,
        created_by: user.id,
        title: fd.get("title") as string,
        description: fd.get("description") as string || null,
        assigned_role: fd.get("assigned_role") as string,
        thumbnail_url: thumbnailUrl,
        is_published: false,
      });

      if (insertErr) { setError(insertErr.message); return; }
      router.push("/trainer/courses");
    });
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/trainer/courses" className="p-2 hover:bg-surface rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">New Course</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail</label>
          <label className="relative cursor-pointer">
            {thumb ? (
              <img src={thumb} alt="Thumbnail" className="w-full h-40 object-cover rounded-xl" />
            ) : (
              <div className="w-full h-40 bg-surface border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload thumbnail</span>
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={handleThumb} />
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="title">Title *</label>
          <input
            id="title" name="title" required
            className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Course title"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="description">Description</label>
          <textarea
            id="description" name="description" rows={3}
            className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Brief description of the course"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="assigned_role">Assigned Role *</label>
          <select
            id="assigned_role" name="assigned_role" required
            className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="trainer">Trainer</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create Course"}
        </button>
      </form>
    </div>
  );
}
