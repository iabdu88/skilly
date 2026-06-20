import { getTranslations } from "next-intl/server";

export default async function UnauthorizedPage() {
  const t = await getTranslations("unauthorized");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2">{t("message")}</p>
      <a href="/login" className="mt-6 text-primary underline text-sm">{t("backToLogin")}</a>
    </div>
  );
}
