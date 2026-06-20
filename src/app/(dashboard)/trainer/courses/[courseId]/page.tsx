import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, Plus, BookOpen, CheckCircle, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { PublishToggle } from "@/components/training/PublishToggle";
import type { LessonProgress, User } from "@/types/database";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;
  const [user, t] = await Promise.all([getUser(), getTranslations("training")]);
  const supabase = await createClient();

  // Run course, lessons, and employees in parallel; progress waits for lesson IDs
  const [{ data: course }, { data: lessons }, { data: employees }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, is_published")
      .eq("id", courseId)
      .eq("company_id", user!.company_id!)
      .single(),
    supabase
      .from("lessons")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .order("order_index"),
    supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .eq("company_id", user!.company_id!)
      .eq("role", "employee"),
  ]);

  if (!course) notFound();

  const lessonIds = lessons?.map((l) => l.id) ?? [];
  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, user_id, status")
        .in("lesson_id", lessonIds)
    : { data: [] };

  function getStatus(lessonId: string, userId: string) {
    return (progress as LessonProgress[])?.find(
      (p) => p.lesson_id === lessonId && p.user_id === userId
    )?.status ?? "not_started";
  }

  return (
    <>
      <Header title={course.title} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Link href="/trainer/courses" className="p-2 hover:bg-surface rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">{course.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{course.description}</p>
          </div>
          <PublishToggle courseId={course.id} published={course.is_published} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">{t("lessons", { n: lessons?.length ?? 0 })}</h3>
            <Link
              href={`/trainer/courses/${courseId}/lessons/new`}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> {t("addLesson")}
            </Link>
          </div>

          <div className="space-y-2">
            {lessons?.map((lesson, idx) => (
              <Link
                key={lesson.id}
                href={`/trainer/courses/${courseId}/lessons/${lesson.id}`}
                className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground truncate">{lesson.title}</span>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
            {!lessons?.length && (
              <p className="text-sm text-muted-foreground text-center py-8">{t("noLessons")}</p>
            )}
          </div>
        </div>

        {employees && employees.length > 0 && lessons && lessons.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">{t("employeeProgress")}</h3>
            <div className="bg-surface rounded-2xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start px-4 py-3 text-muted-foreground font-medium">{t("employeeProgress")}</th>
                    {lessons.map((l) => (
                      <th key={l.id} className="px-3 py-3 text-center text-muted-foreground font-medium text-xs truncate max-w-24">
                        {l.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(employees as User[]).map((emp) => (
                    <tr key={emp.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{emp.full_name}</td>
                      {lessons.map((l) => {
                        const st = getStatus(l.id, emp.id);
                        return (
                          <td key={l.id} className="px-3 py-3 text-center">
                            {st === "completed" ? (
                              <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                            ) : st === "opened" || st === "in_progress" ? (
                              <Eye className="w-4 h-4 text-accent mx-auto" />
                            ) : (
                              <span className="w-4 h-4 rounded-full border border-border mx-auto block" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
