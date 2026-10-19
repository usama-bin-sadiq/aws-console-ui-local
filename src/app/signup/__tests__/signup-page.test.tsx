import { describe, expect, it, vi } from "vite-plus/test";
import { render } from "@testing-library/react";
import SignupPage from "../page";

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
describe("Signup page", () => {
  it("renders", () => {
    const { container } = render(<SignupPage />);
    expect(container.innerHTML.includes("Sign up")).toBe(true);
  });
});
