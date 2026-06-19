import { describe, it, expect } from "vitest";
import { getLevelInfo, XP_REWARDS } from "@/lib/gamification";

describe("XP_REWARDS", () => {
  it("awards 50 XP for completing a lesson", () => {
    expect(XP_REWARDS.lesson_complete).toBe(50);
  });

  it("awards more for course_complete than lesson_complete", () => {
    expect(XP_REWARDS.course_complete).toBeGreaterThan(XP_REWARDS.lesson_complete);
  });

  it("awards more for a perfect quiz than a passing quiz", () => {
    expect(XP_REWARDS.quiz_perfect).toBeGreaterThan(XP_REWARDS.quiz_pass);
  });

  it("has non-zero values for all defined actions", () => {
    Object.values(XP_REWARDS).forEach((v) => expect(v).toBeGreaterThan(0));
  });
});

describe("getLevelInfo", () => {
  it("returns level 1 (Rookie) at 0 XP", () => {
    const info = getLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.name).toBe("Rookie");
    expect(info.progress).toBe(0);
  });

  it("returns level 2 (Learner) at the 500 XP threshold", () => {
    const info = getLevelInfo(500);
    expect(info.level).toBe(2);
    expect(info.name).toBe("Learner");
  });

  it("returns level 5 (Master) at max XP", () => {
    const info = getLevelInfo(10000);
    expect(info.level).toBe(5);
    expect(info.name).toBe("Master");
  });

  it("returns 100% progress and xpToNext=0 at max level", () => {
    const info = getLevelInfo(99999);
    expect(info.progress).toBe(100);
    expect(info.xpToNext).toBe(0);
  });

  it("calculates progress correctly mid-level", () => {
    // Level 2: 500–1499. At 1000 XP: 500 into 1000-XP range = 50%
    const info = getLevelInfo(1000);
    expect(info.level).toBe(2);
    expect(info.xpInLevel).toBe(500);
    expect(info.progress).toBe(50);
  });

  it("shows correct XP needed to reach next level", () => {
    // Level 1 ends at 499. At 400 XP: 100 to go
    const info = getLevelInfo(400);
    expect(info.level).toBe(1);
    expect(info.xpToNext).toBe(100);
  });

  it("handles exactly the level boundary", () => {
    // 1499 is last XP in level 2 — progress near 100%
    const info = getLevelInfo(1499);
    expect(info.level).toBe(2);
    expect(info.xpToNext).toBe(1);
  });

  it("returns valid level for every XP_REWARD event", () => {
    let running = 0;
    for (const xp of Object.values(XP_REWARDS)) {
      running += xp;
      const info = getLevelInfo(running);
      expect(info.level).toBeGreaterThanOrEqual(1);
      expect(info.level).toBeLessThanOrEqual(5);
    }
  });
});
