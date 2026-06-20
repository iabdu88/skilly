"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function toggle() {
    const next = locale === "en" ? "ar" : "en";
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      title={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
      className="flex items-center gap-1.5 text-sm font-medium"
    >
      <Globe className="h-4 w-4" />
      <span>{locale === "en" ? "عربي" : "EN"}</span>
    </Button>
  );
}
