"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function PublishToggle({ courseId, published }: { courseId: string; published: boolean }) {
  const [isPublished, setIsPublished] = useState(published);
  const [isPending, start] = useTransition();

  function toggle() {
    start(async () => {
      const supabase = createClient();
      await supabase.from("courses").update({ is_published: !isPublished }).eq("id", courseId);
      setIsPublished((p) => !p);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
        isPublished
          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
      }`}
    >
      {isPublished ? "Published" : "Draft"}
    </button>
  );
}
