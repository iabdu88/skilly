import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Award } from "lucide-react";
import type { Certificate, Course, User } from "@/types/database";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select("*, user:users(full_name, avatar_url), course:courses(title, description)")
    .eq("share_token", token)
    .single();

  if (!cert) notFound();

  const certificate = cert as Certificate & { user: User; course: Course };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-surface border border-border rounded-3xl overflow-hidden">
        {/* Certificate header */}
        <div className="bg-primary p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "16px 16px",
            }}
          />
          <Award className="w-16 h-16 text-white/80 mx-auto mb-3" />
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Certificate of Completion</p>
        </div>

        <div className="p-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm">This is to certify that</p>
          <h1 className="text-3xl font-bold text-foreground">{certificate.user?.full_name}</h1>
          <p className="text-muted-foreground text-sm">has successfully completed</p>
          <h2 className="text-xl font-semibold text-primary">{certificate.course?.title}</h2>
          {certificate.course?.description && (
            <p className="text-sm text-muted-foreground">{certificate.course.description}</p>
          )}
          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            Issued on {new Date(certificate.issued_at).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>

          <div className="text-center pt-2">
            <p className="text-sm font-bold text-foreground">Skilly</p>
            <p className="text-xs text-muted-foreground">Employee Training & Engagement Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
