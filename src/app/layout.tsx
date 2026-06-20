import type { Metadata } from "next";
import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });

// Prevent Next.js from trying to statically prerender any page at build time.
// All routes call cookies() (for locale/auth) so they're already dynamic;
// this makes that intent explicit and avoids Vercel build-worker errors.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skilly",
  description: "Employee Training & Engagement Platform",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale   = await getLocale();
  const messages = await getMessages();
  const dir      = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${jakarta.variable} dark`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
