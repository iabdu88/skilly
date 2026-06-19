import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"];
const PROTECTED_ROUTES = ["/super-admin", "/trainer", "/manager", "/employee"];

test.describe("Public routes return 200", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} is accessible without auth`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    });
  }
});

test.describe("Protected routes redirect unauthenticated users", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Edge cases", () => {
  test("/ redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/unauthorized page renders without auth", async ({ page }) => {
    const response = await page.goto("/unauthorized");
    // Either renders (200) or redirects — should not 500
    expect(response?.status()).not.toBe(500);
  });
});
