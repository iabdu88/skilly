import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/",
  "/unauthorized",
  "/c/",
];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  function redirectWith(destination: string) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    const res = NextResponse.redirect(url);
    // Auth cookies set by Supabase (sb-* refresh/access tokens) must be
    // forwarded onto the redirect response. Without this, a just-refreshed
    // token would be lost and the user would be logged out on the next request.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value, { path: cookie.path });
    });
    return res;
  }

  const isAuthPage = ["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname);

  if (!user && !isPublic) return redirectWith("/login");
  if (user && isAuthPage) return redirectWith("/");

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-.*).*)"],
};
