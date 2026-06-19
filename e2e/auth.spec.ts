import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the Skilly heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Welcome to Skilly/i })).toBeVisible();
  });

  test("has email and password inputs", async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("has a Sign in button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows an error for wrong credentials", async ({ page }) => {
    await page.fill('input[name="email"]', "notreal@skilly-test-bogus.example");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Wait for the async login action to complete
    await expect(page.locator("p.text-red-400, [class*='text-red']").first()).toBeVisible({ timeout: 10_000 });
  });

  test("has a link to the signup page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();
  });
});

test.describe("Unauthenticated dashboard access", () => {
  test("redirects /trainer to /login", async ({ page }) => {
    await page.goto("/trainer");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /employee to /login", async ({ page }) => {
    await page.goto("/employee");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /manager to /login", async ({ page }) => {
    await page.goto("/manager");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /super-admin to /login", async ({ page }) => {
    await page.goto("/super-admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
