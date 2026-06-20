"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Loader2, Building2, ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { generateInviteCode } from "@/lib/actions/invite";
import { compressToWebP } from "@/lib/image";

interface Props {
  userRole: "super_admin" | "trainer";
}

export function GenerateInviteForm({ userRole }: Props) {
  const t      = useTranslations("invite");
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error,    setError]    = useState<string | null>(null);
  const [result,   setResult]   = useState<{ code: string; company_name?: string } | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressToWebP(file);
      setLogoFile(compressed);
      setLogoPreview(URL.createObjectURL(compressed));
    } catch {
      setError(t("imageError"));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    if (logoFile) formData.set("logo", logoFile);
    startTransition(async () => {
      const res = await generateInviteCode(formData);
      if ("error" in res) {
        setError(res.error ?? null);
      } else {
        setResult(res);
        (e.target as HTMLFormElement).reset();
        setLogoFile(null);
        setLogoPreview(null);
        router.refresh();
      }
    });
  }

  async function handleCopy() {
    if (!result?.code) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">{t("title")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {userRole === "super_admin" ? t("descAdmin") : t("descTrainer")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {userRole === "super_admin" ? (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="invite-company-name">
                {t("companyName")}
              </label>
              <input
                id="invite-company-name" name="company_name" type="text" required
                placeholder={t("companyNamePlaceholder")}
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t("companyLogo")} <span className="text-muted-foreground font-normal">({t("optional")})</span>
              </label>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="w-10 h-10 rounded-lg bg-white/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-0.5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  {logoFile ? t("changeLogo") : t("uploadLogo")}
                </button>
                {logoFile && (
                  <button type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {t("removeLogo")}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="invite-role">{t("role")}</label>
            <select id="invite-role" name="role" defaultValue="employee"
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="employee">{t("roleEmployee")}</option>
              <option value="manager">{t("roleManager")}</option>
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={isPending}
          className="w-full rounded-lg bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? t("generating") : t("generate")}
        </button>
      </form>

      {result && (
        <div className="space-y-2">
          {result.company_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-lg px-3 py-2">
              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{t("companyCreated", { name: result.company_name })}</span>
            </div>
          )}
          <div className="flex items-center gap-3 bg-primary/10 rounded-xl px-4 py-3 border border-primary/30">
            <span className="font-mono text-xl font-bold text-primary tracking-[0.2em] flex-1 select-all">
              {result.code}
            </span>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors shrink-0"
              style={{ color: copied ? "oklch(0.75 0.18 145)" : undefined }}
            >
              {copied
                ? <><Check className="w-4 h-4" /> {t("copied")}</>
                : <><Copy className="w-4 h-4 text-muted-foreground" /> {t("copy")}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
