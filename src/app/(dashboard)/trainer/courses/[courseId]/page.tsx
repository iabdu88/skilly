import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, Plus, BookOpen, CheckCircle, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { PublishToggle } from "@/components/training/PublishToggle";
import type { Lesson, LessonProgress, User } from "@/types/database";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;
  const user = await getUser();
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("company_id", user!.company_id!)
    .single();

  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index");

  // Employee progress per lesson
  const { data: employees } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .eq("company_id", user!.company_id!)
    .eq("role", "employee");

  const lessonIds = lessons?.map((l: Lesson) => l.id) ?? [];
  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("*")
        .in("lesson_id", lessonIds)
    : { data: [] };

  function getStatus(lessonId: string, userId: string) {
    return (progress as LessonProgress[])?.find(
      (p) => p.lesson_id === lessonId && p.user_id === userId
    )?.status ?? "not_started";
  }

  return (
    <>
      <Header title="Training Hub" userId={user!.id} />
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

        {/* Lessons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Lessons ({lessons?.length ?? 0})</h3>
            <Link
              href={`/trainer/courses/${courseId}/lessons/new`}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add Lesson
            </Link>
          </div>

          <div className="space-y-2">
            {lessons?.map((lesson: Lesson, idx: number) => (
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
              <p className="text-sm text-muted-foreground text-center py-8">No lessons yet.</p>
            )}
          </div>
        </div>

        {/* Progress table */}
        {employees && employees.length > 0 && lessons && lessons.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Employee Progress</h3>
            <div className="bg-surface rounded-2xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Employee</th>
                    {lessons.map((l: Lesson) => (
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
                      {lessons.map((l: Lesson) => {
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
