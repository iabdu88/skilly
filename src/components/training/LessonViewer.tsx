"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Zap } from "lucide-react";
import type { Lesson, Quiz, QuizQuestion } from "@/types/database";
import { awardXP } from "@/lib/actions/xp";
import { Confetti } from "@/components/ui/Confetti";

interface Props {
  lesson: Lesson;
  quiz: Quiz | null;
  userId: string;
  courseId: string;
  trainerId: string | null;
  companyId: string;
  userName: string;
  initialStatus: string;
}

interface XpToast {
  xp: number;
  badges: { name: string; icon: string }[];
}

export function LessonViewer({ lesson, quiz, userId, courseId, trainerId, companyId, userName, initialStatus }: Props) {
  const [status,    setStatus]    = useState(initialStatus);
  const [quizStep,  setQuizStep]  = useState<"idle" | "active" | "done">("idle");
  const [answers,   setAnswers]   = useState<number[]>([]);
  const [score,     setScore]     = useState<number | null>(null);
  const [toast,     setToast]     = useState<XpToast | null>(null);
  const [confetti,  setConfetti]  = useState(false);
  const [isPending, start]        = useTransition();

  const questions: QuizQuestion[] = quiz?.questions ?? [];

  function showXpToast(xp: number, badges: { name: string; icon: string }[]) {
    if (xp === 0) return;
    setToast({ xp, badges });
    setConfetti(true);
    setTimeout(() => setToast(null), 4000);
  }

  function markComplete() {
    start(async () => {
      const supabase = createClient();
      await supabase
        .from("lesson_progress")
        .upsert({ user_id: userId, lesson_id: lesson.id, status: "completed" }, { onConflict: "user_id,lesson_id" });
      setStatus("completed");

      // Notify trainer
      if (trainerId) {
        await supabase.from("notifications").insert({
          user_id: trainerId,
          type: "lesson_completed",
          title: "Lesson Completed",
          body: `${userName} completed "${lesson.title}"`,
          is_read: false,
          metadata: { lesson_id: lesson.id, employee_id: userId },
        });
      }

      // Check if all lessons in course are done
      const { data: allLessons } = await supabase.from("lessons").select("id").eq("course_id", courseId);
      const { data: allProgress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, status")
        .eq("user_id", userId)
        .in("lesson_id", allLessons?.map((l) => l.id) ?? []);

      const allDone = allLessons?.every((l) =>
        allProgress?.some((p) => p.lesson_id === l.id && p.status === "completed")
      );

      if (allDone) {
        const token = crypto.randomUUID();
        await supabase.from("certificates").insert({ user_id: userId, course_id: courseId, share_token: token });
      }

      // Award XP
      const type = allDone ? "course_complete" : "lesson_complete";
      const result = await awardXP(type, { lesson_id: lesson.id, course_id: courseId });

      // Also award lesson XP if course is complete (both events)
      if (allDone) {
        const lessonResult = await awardXP("lesson_complete", { lesson_id: lesson.id });
        showXpToast(result.xp + lessonResult.xp, [...result.newBadges, ...lessonResult.newBadges]);
      } else {
        showXpToast(result.xp, result.newBadges);
      }
    });
  }

  function submitQuiz() {
    if (!quiz) return;
    const correct = questions.filter((q, i) => q.correct_index === answers[i]).length;
    const perfect = correct === questions.length;
    setScore(correct);
    setQuizStep("done");

    start(async () => {
      const supabase = createClient();
      await supabase.from("quiz_attempts").insert({
        quiz_id: quiz.id,
        user_id: userId,
        score: correct,
        total: questions.length,
      });

      const type = perfect ? "quiz_perfect" : "quiz_pass";
      const result = await awardXP(type, { quiz_id: quiz.id });
      showXpToast(result.xp, result.newBadges);
    });
  }

  return (
    <div className="space-y-6">
      <Confetti trigger={confetti} />

      {/* XP Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 border border-primary/20">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">+{toast.xp} XP earned!</p>
            {toast.badges.length > 0 && (
              <p className="text-white/70 text-xs mt-0.5">
                {toast.badges.map((b) => `${b.icon} ${b.name}`).join(" · ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Video */}
      {lesson.video_url && (
        <div className="aspect-video rounded-2xl overflow-hidden bg-black">
          <iframe src={lesson.video_url} className="w-full h-full" allowFullScreen title={lesson.title} />
        </div>
      )}

      {/* Content */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">{lesson.content}</p>
      </div>

      {/* Quiz */}
      {quiz && quizStep === "idle" && (
        <button
          onClick={() => setQuizStep("active")}
          className="w-full border border-primary text-primary rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/10 transition-colors"
        >
          Take Quiz ({questions.length} questions)
        </button>
      )}

      {quiz && quizStep === "active" && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
          <h3 className="font-semibold text-foreground">{quiz.title}</h3>
          {questions.map((q, qi) => (
            <div key={q.id} className="space-y-2">
              <p className="text-sm font-medium text-foreground">{qi + 1}. {q.question}</p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => { const a = [...answers]; a[qi] = oi; setAnswers(a); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-colors ${
                      answers[qi] === oi
                        ? "border-primary bg-primary/20 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={submitQuiz}
            disabled={answers.length < questions.length || answers.some((a) => a === undefined)}
            className="w-full bg-primary text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-primary/90 disabled:opacity-40"
          >
            Submit Quiz
          </button>
        </div>
      )}

      {quiz && quizStep === "done" && score !== null && (
        <div className="bg-card rounded-2xl border border-border p-5 text-center space-y-1">
          <p className="text-2xl font-bold text-foreground">{score}/{questions.length}</p>
          <p className="text-muted-foreground text-sm">
            {score === questions.length ? "Perfect score! 🎉 +100 XP" : `+30 XP · Keep practicing!`}
          </p>
        </div>
      )}

      {/* Complete button */}
      {status !== "completed" ? (
        <button
          onClick={markComplete}
          disabled={isPending}
          className="w-full bg-green-600 text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-green-600/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {isPending ? "Saving…" : "Mark as Complete (+50 XP)"}
        </button>
      ) : (
        <div className="flex items-center gap-2 justify-center text-green-400 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Lesson Completed
        </div>
      )}
    </div>
  );
}
