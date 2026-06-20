"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { resetPasswordAction } from "@/lib/actions/auth";
import { SkillySvgLogo } from "@/components/brand/SkillySvgLogo";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
    const confirm  = (e.currentTarget.elements.namedItem("confirm")  as HTMLInputElement).value;

    if (password !== confirm)  { setError(t("passwordsNoMatch")); return; }
    if (password.length < 6)   { setError(t("passwordTooShort")); return; }

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result?.error) setError(result.error);
      else if (result?.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <SkillySvgLogo width={150} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("setNewPassword")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("chooseStrong")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 space-y-4 border border-border">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">{t("newPassword")}</label>
            <input id="password" name="password" type="password" required autoComplete="new-password"
              placeholder={t("passwordMin")}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="confirm">{t("confirmPassword")}</label>
            <input id="confirm" name="confirm" type="password" required autoComplete="new-password"
              placeholder={t("confirmPlaceholder")}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={isPending}
            className="w-full rounded-lg bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? t("updating") : t("updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
