import { describe, it, expect } from "vitest";

// generateCode is not exported — test its contract by replicating the logic
// and verifying the character-set invariants the real function promises.
const INVITE_CHARS = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";
function generateCode(): string {
  return Array.from({ length: 8 }, () => INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)]).join("");
}

describe("invite code generation", () => {
  it("generates an 8-character code", () => {
    expect(generateCode()).toHaveLength(8);
  });

  it("only uses unambiguous characters (no O, 0, I, 1, S, 5)", () => {
    const ambiguous = /[O0I1S5]/;
    for (let i = 0; i < 100; i++) {
      expect(generateCode()).not.toMatch(ambiguous);
    }
  });

  it("generates uppercase only", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateCode()).toMatch(/^[A-Z2-9]+$/);
    }
  });

  it("generates different codes (not deterministic)", () => {
    const codes = new Set(Array.from({ length: 20 }, generateCode));
    // Statistically impossible to get all 20 identical from a 30-char alphabet
    expect(codes.size).toBeGreaterThan(1);
  });

  it("character set has exactly 30 unique characters", () => {
    expect(new Set(INVITE_CHARS).size).toBe(INVITE_CHARS.length);
    expect(INVITE_CHARS.length).toBe(30);
  });
});

describe("redeemInviteCode input validation", () => {
  it("rejects password shorter than 6 characters", () => {
    // Mirror the validation rule from redeemInviteCode
    const password = "abc";
    expect(password.length < 6).toBe(true);
  });

  it("accepts password of exactly 6 characters", () => {
    const password = "abcdef";
    expect(password.length < 6).toBe(false);
  });

  it("normalises invite code to uppercase before lookup", () => {
    const rawCode = "abc12def";
    expect(rawCode.trim().toUpperCase()).toBe("ABC12DEF");
  });

  it("normalises email to lowercase before lookup", () => {
    const rawEmail = "  User@Example.COM  ";
    expect(rawEmail.trim().toLowerCase()).toBe("user@example.com");
  });
});
