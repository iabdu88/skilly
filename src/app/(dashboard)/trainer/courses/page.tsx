import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { Plus, BookOpen, Users } from "lucide-react";
import type { Course } from "@/types/database";

export default async function TrainerCoursesPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, lessons(count)")
    .eq("company_id", user!.company_id!)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header title="Training Hub" userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Courses</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{courses?.length ?? 0} courses total</p>
          </div>
          <Link
            href="/trainer/courses/new"
            className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Course
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course: Course & { lessons: { count: number }[] }) => (
            <Link
              key={course.id}
              href={`/trainer/courses/${course.id}`}
              className="bg-surface border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors group"
            >
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-32 object-cover rounded-xl mb-3"
                />
              ) : (
                <div className="w-full h-32 bg-primary/10 rounded-xl mb-3 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary/40" />
                </div>
              )}
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {course.title}
              </h3>
              {course.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {course.lessons?.[0]?.count ?? 0} lessons
                </span>
                <span className={`px-2 py-0.5 rounded-full ${course.is_published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {course.is_published ? "Published" : "Draft"}
                </span>
                <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {course.assigned_role.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}

          {!courses?.length && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No courses yet</p>
              <p className="text-sm mt-1">Create your first course to get started.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
