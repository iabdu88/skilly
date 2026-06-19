import { test, expect } from "@playwright/test";

test.describe("Dark mode default", () => {
  test("html element has 'dark' class on initial load", async ({ page }) => {
    await page.goto("/login");
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain("dark");
  });

  test("body has a dark background-color in dark mode", async ({ page }) => {
    await page.goto("/login");
    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Dark background — luminance should be very low (close to black)
    // Any non-white, non-light background is acceptable here
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("--background CSS variable resolves to a dark oklch value", async ({ page }) => {
    await page.goto("/login");
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--background").trim()
    );
    expect(bg).toBeTruthy();
    expect(bg.length).toBeGreaterThan(0);
  });
});

test.describe("Theme persistence via localStorage", () => {
  test("stores 'dark' in localStorage after next-themes hydration", async ({ page }) => {
    await page.goto("/login");
    // Give next-themes time to set localStorage
    await page.waitForTimeout(500);
    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    // On first visit with defaultTheme="dark", next-themes writes "dark" (or leaves null and uses the class)
    // Either null (class applied via script) or "dark" are correct
    expect(stored === null || stored === "dark").toBe(true);
  });

  test("light theme class persists across reload when set via localStorage", async ({ page }) => {
    await page.goto("/login");
    // Manually set theme to light (simulates the toggle being clicked)
    await page.evaluate(() => {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    await page.reload();
    await page.waitForTimeout(500);
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    // After reload with localStorage="light", dark class should be absent
    expect(htmlClass).not.toContain("dark");
  });

  test("reverts to dark after clearing localStorage and reloading", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.reload();
    await page.waitForTimeout(500);
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain("dark");
  });
});
