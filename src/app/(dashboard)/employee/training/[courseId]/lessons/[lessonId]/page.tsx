import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LessonViewer } from "@/components/training/LessonViewer";

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  const user = await getUser();
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (!lesson) notFound();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user!.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  // Mark as opened (notify trainer via DB trigger / realtime)
  if (!progress) {
    await supabase.from("lesson_progress").insert({
      user_id: user!.id,
      lesson_id: lessonId,
      status: "opened",
    });
    // Notify trainer
    const { data: trainer } = await supabase
      .from("users")
      .select("id")
      .eq("company_id", user!.company_id!)
      .eq("role", "trainer")
      .limit(1)
      .maybeSingle();
    if (trainer) {
      await supabase.from("notifications").insert({
        user_id: trainer.id,
        type: "lesson_opened",
        title: "Lesson Opened",
        body: `${user!.full_name} opened "${lesson.title}"`,
        is_read: false,
        metadata: { lesson_id: lessonId, employee_id: user!.id },
      });
    }
  }

  return (
    <>
      <Header title={lesson.title} userId={user!.id} />
      <main className="p-4 lg:p-6 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/employee/training/${courseId}`} className="p-2 hover:bg-surface rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="text-xl font-bold text-foreground">{lesson.title}</h2>
        </div>

        <LessonViewer
          lesson={lesson}
          quiz={quiz}
          userId={user!.id}
          courseId={courseId}
          trainerId={null}
          companyId={user!.company_id!}
          userName={user!.full_name}
          initialStatus={progress?.status ?? "opened"}
        />
      </main>
    </>
  );
}
