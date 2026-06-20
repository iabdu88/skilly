import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import type { Course, LessonProgress } from "@/types/database";

export default async function EmployeeTrainingPage() {
  const [user, t] = await Promise.all([getUser(), getTranslations("training")]);
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, lessons(id)")
    .eq("company_id", user!.company_id!)
    .eq("is_published", true)
    .in("assigned_role", ["employee"]);

  const courseIds = courses?.map((c: Course) => c.id) ?? [];
  const { data: progress } = courseIds.length
    ? await supabase.from("lesson_progress").select("*").eq("user_id", user!.id)
    : { data: [] };

  function courseProgress(lessons: { id: string }[]) {
    const total = lessons.length;
    if (!total) return { done: 0, total: 0, pct: 0 };
    const done = lessons.filter((l) =>
      (progress as LessonProgress[])?.some((p) => p.lesson_id === l.id && p.status === "completed")
    ).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  }

  return (
    <>
      <Header title={t("myCourses")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("myCourses")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("coursesAvailable", { n: courses?.length ?? 0 })}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course: Course & { lessons: { id: string }[] }) => {
            const { done, total, pct } = courseProgress(course.lessons ?? []);
            const completed = pct === 100;
            return (
              <Link
                key={course.id}
                href={`/employee/training/${course.id}`}
                className="bg-surface border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors"
              >
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-32 object-cover rounded-xl mb-3" />
                ) : (
                  <div className="w-full h-32 bg-primary/10 rounded-xl mb-3 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-primary/40" />
                  </div>
                )}
                <h3 className="font-semibold text-foreground line-clamp-1">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                )}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{t("lessonsCount", { done, total })}</span>
                    <span className="flex items-center gap-1">
                      {completed ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Clock className="w-3 h-3" />}
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}

          {!courses?.length && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t("noCoursesYet")}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
