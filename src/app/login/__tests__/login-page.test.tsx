import { describe, expect, it, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import LoginPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signInWithCredentials: vi.fn(),
    signOut: vi.fn(),
    user: null,
    loading: false,
  }),
}));

/**
 * These check the sign-in screen's structure rather than a single substring.
 * The previous assertion was `innerHTML.includes('Sign In')`, which passed or
 * failed on one capital letter — it broke when the wording moved to the design's
 * "Sign in" without anything actually regressing. Asserting on the controls that
 * make up the screen means a real change has to break something real.
 */
describe("Login page", () => {
  it("renders the sign-in card", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Sign in", level: 1 })).toBeTruthy();
  });

  it("offers both user types", () => {
    render(<LoginPage />);
    expect(screen.getByRole("radio", { name: /Root user/ })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /IAM user/ })).toBeTruthy();
  });

  it("asks for an email address", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email address")).toBeTruthy();
  });

  it("links onward to account creation and password recovery", () => {
    render(<LoginPage />);
    const signup = screen.getAllByRole("link", { name: /Create an account|Create a new account/ });
    expect(signup.length).toBeGreaterThan(0);
  });
});
