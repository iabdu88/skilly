import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // cookies() throws in Vercel build workers (no request scope) — fall back to default
  let locale = "en";
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("locale")?.value === "ar") locale = "ar";
  } catch {
    // static-generation context: no request available, use default locale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
