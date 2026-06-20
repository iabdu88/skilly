import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Award, ExternalLink } from "lucide-react";
import type { Certificate, Course } from "@/types/database";

export default async function EmployeeCertificatesPage() {
  const [user, t] = await Promise.all([getUser(), getTranslations("certificates")]);
  const supabase = await createClient();

  const { data: certs } = await supabase
    .from("certificates")
    .select("*, course:courses(title, description)")
    .eq("user_id", user!.id)
    .order("issued_at", { ascending: false });

  return (
    <>
      <Header title={t("title")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6 max-w-3xl">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("earned", { n: certs?.length ?? 0 })}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(certs as (Certificate & { course: Course })[])?.map((cert) => (
            <div key={cert.id} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{cert.course?.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("issued", { date: new Date(cert.issued_at).toLocaleDateString() })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/c/${cert.share_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t("view")}
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/c/${cert.share_token}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#0A66C2] text-white rounded-xl py-2 text-xs font-medium hover:bg-[#0A66C2]/90 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  {t("share")}
                </a>
              </div>
            </div>
          ))}

          {!certs?.length && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t("noCerts")}</p>
              <p className="text-sm mt-1">{t("noCertsHint")}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
