import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Circle, Lock } from "lucide-react";
import { notFound } from "next/navigation";
import type { Lesson, LessonProgress } from "@/types/database";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function EmployeeCourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;
  const [user, t] = await Promise.all([getUser(), getTranslations("training")]);
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("is_published", true)
    .single();

  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index");

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user!.id)
    .in("lesson_id", lessons?.map((l: Lesson) => l.id) ?? []);

  function getStatus(lessonId: string) {
    return (progress as LessonProgress[])?.find((p) => p.lesson_id === lessonId)?.status;
  }

  return (
    <>
      <Header title={course.title} userId={user!.id} />
      <main className="p-4 lg:p-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/employee/training" className="p-2 hover:bg-surface rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">{course.title}</h2>
            {course.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
          </div>
        </div>

        <div className="space-y-2">
          {lessons?.map((lesson: Lesson, idx: number) => {
            const status = getStatus(lesson.id);
            const prevCompleted = idx === 0 || getStatus(lessons[idx - 1].id) === "completed";
            const locked = !prevCompleted;

            return (
              <div key={lesson.id}>
                {locked ? (
                  <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3 opacity-50">
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">{lesson.title}</span>
                  </div>
                ) : (
                  <Link
                    href={`/employee/training/${courseId}/lessons/${lesson.id}`}
                    className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
                  >
                    {status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 text-sm font-medium text-foreground">{lesson.title}</span>
                    {status === "completed" && <span className="text-xs text-green-400">{t("done")}</span>}
                    {status === "in_progress" && <span className="text-xs text-accent">{t("inProgress")}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
