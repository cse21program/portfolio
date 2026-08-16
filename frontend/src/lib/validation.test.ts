import { describe, expect, it } from "vitest";
import {
  collectErrors,
  hasErrors,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from "./validation";

describe("validateEmail", () => {
  it("requires a value", () => {
    expect(validateEmail("  ")).toBe("Email is required");
  });

  it("rejects an invalid address", () => {
    expect(validateEmail("not-an-email")).toBe("Enter a valid email address");
  });

  it("accepts a normal address", () => {
    expect(validateEmail("user@example.com")).toBeUndefined();
  });
});

describe("validateName", () => {
  it("enforces length", () => {
    expect(validateName("A")).toBe("Name must be at least 2 characters");
    expect(validateName("Ada")).toBeUndefined();
  });
});

describe("validatePassword", () => {
  it("enforces the 8–72 range", () => {
    expect(validatePassword("short")).toBe("Password must be at least 8 characters");
    expect(validatePassword("password123")).toBeUndefined();
  });
});

describe("validatePasswordMatch", () => {
  it("requires confirmation to match", () => {
    expect(validatePasswordMatch("password123", "")).toBe("Confirm your password");
    expect(validatePasswordMatch("password123", "password124")).toBe("Passwords do not match");
    expect(validatePasswordMatch("password123", "password123")).toBeUndefined();
  });
});

describe("collectErrors", () => {
  it("keeps only failing fields", () => {
    const errors = collectErrors({
      email: validateEmail("bad"),
      name: validateName("Ada"),
    });

    expect(hasErrors(errors)).toBe(true);
    expect(errors.email).toBe("Enter a valid email address");
    expect(errors.name).toBeUndefined();
  });
});
