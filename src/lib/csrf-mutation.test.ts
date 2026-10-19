import { describe, expect, it } from "vite-plus/test";

import { isCsrfExempt, isMutatingMethod, validateCsrfMutation } from "@/lib/csrf-mutation";

describe("CSRF mutation validation", () => {
  it("treats only POST/PUT/PATCH/DELETE as mutating", () => {
    for (const m of ["POST", "put", "PATCH", "delete"]) {
      expect(isMutatingMethod(m)).toBe(true);
    }
    for (const m of ["GET", "HEAD", "OPTIONS"]) {
      expect(isMutatingMethod(m)).toBe(false);
    }
  });

  it("exempts the auth route, which runs before a session exists", () => {
    expect(isCsrfExempt("/api/auth")).toBe(true);
    expect(isCsrfExempt("/api/auth/")).toBe(true);
    expect(isCsrfExempt("/api/s3")).toBe(false);
  });

  it("lets safe methods through without a token", () => {
    expect(validateCsrfMutation("GET", "/api/s3", undefined, undefined)).toBe(true);
    expect(validateCsrfMutation("OPTIONS", "/api/s3", undefined, undefined)).toBe(true);
  });

  it("lets auth mutations through so login/signup still work", () => {
    expect(validateCsrfMutation("POST", "/api/auth", undefined, undefined)).toBe(true);
  });

  it("blocks a mutation with no token at all", () => {
    expect(validateCsrfMutation("POST", "/api/s3", undefined, undefined)).toBe(false);
  });

  it("blocks a mutation with only one half of the double submit", () => {
    expect(validateCsrfMutation("POST", "/api/s3", "cookie-token", undefined)).toBe(false);
    expect(validateCsrfMutation("POST", "/api/s3", undefined, "header-token")).toBe(false);
  });

  it("blocks a mutation when cookie and header disagree", () => {
    expect(validateCsrfMutation("POST", "/api/s3", "cookie-token", "header-token")).toBe(false);
    expect(validateCsrfMutation("POST", "/api/s3", "abc", "abcd")).toBe(false);
  });

  it("allows a mutation when cookie and header match", () => {
    expect(validateCsrfMutation("POST", "/api/s3", "shared-token", "shared-token")).toBe(true);
    expect(validateCsrfMutation("DELETE", "/api/widgets", "t", "t")).toBe(true);
  });

  it("does not exempt paths that merely start with the auth prefix text", () => {
    expect(isCsrfExempt("/api/authorize")).toBe(false);
    expect(validateCsrfMutation("POST", "/api/authorize", undefined, undefined)).toBe(false);
  });
});
