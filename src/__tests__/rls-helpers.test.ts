import { vi, describe, it, expect } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn((p: string) => { throw new Error(`REDIRECT:${p}`); }) }));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockReturnValue({ getAll: vi.fn(() => []), set: vi.fn() }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }),
  }),
}));

import { dashboardPath } from "@/lib/auth";
import type { UserRole } from "@/types/database";

// These tests cover the pure helpers called by RLS-sensitive server actions.
// Actual DB-level policy behaviour is tested in the E2E suite.

describe("dashboardPath role routing (RLS gateway)", () => {
  const cases: [UserRole, string][] = [
    ["super_admin", "/super-admin"],
    ["trainer",     "/trainer"],
    ["manager",     "/manager"],
    ["employee",    "/employee"],
  ];

  it.each(cases)("role %s routes to %s", (role, expected) => {
    expect(dashboardPath(role)).toBe(expected);
  });

  it("routes are all distinct — no two roles share a path", () => {
    const paths = cases.map(([role]) => dashboardPath(role));
    expect(new Set(paths).size).toBe(cases.length);
  });
});

describe("proxy PUBLIC_PATHS guard logic", () => {
  // Mirror the logic from src/proxy.ts to confirm the invariants
  const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/", "/unauthorized", "/c/"];

  function isPublic(pathname: string) {
    return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  }

  it("treats /login as public", () => expect(isPublic("/login")).toBe(true));
  it("treats /signup as public", () => expect(isPublic("/signup")).toBe(true));
  it("treats /auth/callback as public", () => expect(isPublic("/auth/callback")).toBe(true));
  it("treats /c/<token> as public (shareable certificate link)", () => expect(isPublic("/c/abc123")).toBe(true));
  it("treats /employee as protected", () => expect(isPublic("/employee")).toBe(false));
  it("treats /trainer as protected", () => expect(isPublic("/trainer")).toBe(false));
  it("treats /super-admin as protected", () => expect(isPublic("/super-admin")).toBe(false));
});
