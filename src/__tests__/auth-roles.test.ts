import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock Next.js server modules before importing auth.ts
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockReturnValue({ getAll: vi.fn(() => []), set: vi.fn() }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }),
  }),
}));

import { dashboardPath } from "@/lib/auth";
import type { UserRole } from "@/types/database";

describe("dashboardPath", () => {
  it("maps super_admin to /super-admin", () => {
    expect(dashboardPath("super_admin" as UserRole)).toBe("/super-admin");
  });

  it("maps trainer to /trainer", () => {
    expect(dashboardPath("trainer" as UserRole)).toBe("/trainer");
  });

  it("maps manager to /manager", () => {
    expect(dashboardPath("manager" as UserRole)).toBe("/manager");
  });

  it("maps employee to /employee", () => {
    expect(dashboardPath("employee" as UserRole)).toBe("/employee");
  });

  it("covers all four roles", () => {
    const roles: UserRole[] = ["super_admin", "trainer", "manager", "employee"];
    const paths = roles.map(dashboardPath);
    // Every path starts with /
    paths.forEach((p) => expect(p).toMatch(/^\//));
    // All paths are distinct
    expect(new Set(paths).size).toBe(4);
  });
});
