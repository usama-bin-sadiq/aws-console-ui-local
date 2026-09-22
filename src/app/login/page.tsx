"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ─── Local types ──────────────────────────────────────────────────────────────
type AuthMode = "signin" | "signup" | "forgot" | "reset";

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Tab state for sign-in (Root user vs IAM user)
  const [signInTab, setSignInTab] = useState<"root" | "iam">("root");

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setEmail("");
    setConfirmPassword("");
    setAccountName("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
  };

  // ─── Sign In ──────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(username, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Sign Up ──────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", username, password, email, accountName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed");

      // Auto sign-in after signup
      await signIn(username, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password ──────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", username, newPassword: "temppass123" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password reset failed");
      setMode("reset");
    } catch (err: any) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset Password ───────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", username, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password reset failed");

      // Sign in with new password
      await signIn(username, newPassword);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f2f3f3", fontFamily: "'Amazon Ember', Arial, sans-serif" }}>
      {/* AWS yellow bar */}
      <div style={{ height: "4px", background: "linear-gradient(90deg, #FF9900 0%, #FFAD33 50%, #FF9900 100%)" }} />

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 4px)", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* AWS Logo */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <svg viewBox="0 0 100 30" width="100" height="30">
              <text x="10" y="24" fontFamily="'Amazon Ember', Arial, sans-serif" fontSize="26" fontWeight="bold" fill="#232F3E">aws</text>
              <path d="M5 28 Q50 34 95 28" stroke="#FF9900" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {/* Main Card */}
          <div style={{ background: "#fff", borderRadius: "4px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", padding: "32px" }}>
            {/* ── Sign In ─────────────────────────────────────────────── */}
            {mode === "signin" && (
              <>
                <h1 style={{ fontSize: "24px", fontWeight: "400", color: "#16191f", marginBottom: "24px", textAlign: "center" }}>
                  Sign in
                </h1>

                {error && (
                  <div style={{ background: "#fdf7f7", border: "1px solid #d91515", borderRadius: "4px", padding: "12px", marginBottom: "16px", color: "#d91515", fontSize: "14px" }}>
                    {error}
                  </div>
                )}

                {/* Root / IAM Tabs */}
                <div style={{ display: "flex", borderBottom: "2px solid #d5dbdb", marginBottom: "24px" }}>
                  <button
                    onClick={() => { setSignInTab("root"); setError(""); }}
                    style={{
                      flex: 1, padding: "12px", background: "none", border: "none", borderBottom: signInTab === "root" ? "2px solid #ff9900" : "2px solid transparent",
                      marginBottom: "-2px", fontSize: "14px", fontWeight: signInTab === "root" ? "700" : "400",
                      color: signInTab === "root" ? "#16191f" : "#545b64", cursor: "pointer",
                    }}
                  >
                    Root user
                  </button>
                  <button
                    onClick={() => { setSignInTab("iam"); setError(""); }}
                    style={{
                      flex: 1, padding: "12px", background: "none", border: "none", borderBottom: signInTab === "iam" ? "2px solid #ff9900" : "2px solid transparent",
                      marginBottom: "-2px", fontSize: "14px", fontWeight: signInTab === "iam" ? "700" : "400",
                      color: signInTab === "iam" ? "#16191f" : "#545b64", cursor: "pointer",
                    }}
                  >
                    IAM user
                  </button>
                </div>

                <form onSubmit={handleSignIn}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>
                      {signInTab === "root" ? "Root user email address" : "IAM user name"}
                    </label>
                    <input
                      type={signInTab === "root" ? "email" : "text"}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={signInTab === "root" ? "root@localhost" : "Enter IAM user name"}
                      required
                      style={{
                        width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px",
                        outline: "none", boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      style={{
                        width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px",
                        outline: "none", boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%", padding: "10px", fontSize: "14px", fontWeight: "400", color: "#16191f",
                      background: loading ? "#f2f3f3" : "linear-gradient(to bottom, #f7dfa5, #f0c14b)", border: "1px solid #a88734",
                      borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <div style={{ textAlign: "right", marginTop: "12px" }}>
                  <button onClick={() => { setMode("forgot"); resetForm(); }} style={{ background: "none", border: "none", color: "#0073bb", fontSize: "13px", cursor: "pointer" }}>
                    Forgot password?
                  </button>
                </div>

                <div style={{ textAlign: "center", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #d5dbdb" }}>
                  <span style={{ fontSize: "14px", color: "#16191f" }}>First time signing in? </span>
                  <button onClick={() => { setMode("signup"); resetForm(); }} style={{ background: "none", border: "none", color: "#0073bb", fontSize: "14px", cursor: "pointer" }}>
                    Create an AWS account
                  </button>
                </div>
              </>
            )}

            {/* ── Sign Up ─────────────────────────────────────────────── */}
            {mode === "signup" && (
              <>
                <h1 style={{ fontSize: "24px", fontWeight: "400", color: "#16191f", marginBottom: "24px", textAlign: "center" }}>
                  Create an AWS account
                </h1>

                {error && (
                  <div style={{ background: "#fdf7f7", border: "1px solid #d91515", borderRadius: "4px", padding: "12px", marginBottom: "16px", color: "#d91515", fontSize: "14px" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSignUp}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>Username</label>
                    <input
                      type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username" required
                      style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>Email</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email" required
                      style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>Password</label>
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password" required
                      style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>Confirm password</label>
                    <input
                      type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password" required
                      style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <button
                    type="submit" disabled={loading}
                    style={{
                      width: "100%", padding: "10px", fontSize: "14px", fontWeight: "400", color: "#16191f",
                      background: loading ? "#f2f3f3" : "linear-gradient(to bottom, #f7dfa5, #f0c14b)", border: "1px solid #a88734",
                      borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Creating account..." : "Create AWS account"}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #d5dbdb" }}>
                  <span style={{ fontSize: "14px", color: "#16191f" }}>Already have an account? </span>
                  <button onClick={() => { setMode("signin"); resetForm(); }} style={{ background: "none", border: "none", color: "#0073bb", fontSize: "14px", cursor: "pointer" }}>
                    Sign in
                  </button>
                </div>
              </>
            )}

            {/* ── Forgot Password ──────────────────────────────────────── */}
            {mode === "forgot" && (
              <>
                <h1 style={{ fontSize: "24px", fontWeight: "400", color: "#16191f", marginBottom: "24px", textAlign: "center" }}>
                  Password assistance
                </h1>

                {error && (
                  <div style={{ background: "#fdf7f7", border: "1px solid #d91515", borderRadius: "4px", padding: "12px", marginBottom: "16px", color: "#d91515", fontSize: "14px" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleForgotPassword}>
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>Enter your root user email address or IAM user name</label>
                    <input
                      type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username" required
                      style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <button
                    type="submit" disabled={loading}
                    style={{
                      width: "100%", padding: "10px", fontSize: "14px", fontWeight: "400", color: "#16191f",
                      background: loading ? "#f2f3f3" : "linear-gradient(to bottom, #f7dfa5, #f0c14b)", border: "1px solid #a88734",
                      borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Sending..." : "Continue"}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #d5dbdb" }}>
                  <button onClick={() => { setMode("signin"); resetForm(); }} style={{ background: "none", border: "none", color: "#0073bb", fontSize: "14px", cursor: "pointer" }}>
                    Back to sign in
                  </button>
                </div>
              </>
            )}

            {/* ── Reset Password ─────────────────────────────────────────── */}
            {mode === "reset" && (
              <>
                <h1 style={{ fontSize: "24px", fontWeight: "400", color: "#16191f", marginBottom: "24px", textAlign: "center" }}>
                  Reset password
                </h1>

                {error && (
                  <div style={{ background: "#fdf7f7", border: "1px solid #d91515", borderRadius: "4px", padding: "12px", marginBottom: "16px", color: "#d91515", fontSize: "14px" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>New password</label>
                    <input
                      type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password" required
                      style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#16191f", marginBottom: "4px" }}>Confirm new password</label>
                    <input
                      type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password" required
                      style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #aab7b8", borderRadius: "4px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#0073bb"; e.target.style.boxShadow = "0 0 0 2px rgba(0,115,187,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#aab7b8"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <button
                    type="submit" disabled={loading}
                    style={{
                      width: "100%", padding: "10px", fontSize: "14px", fontWeight: "400", color: "#16191f",
                      background: loading ? "#f2f3f3" : "linear-gradient(to bottom, #f7dfa5, #f0c14b)", border: "1px solid #a88734",
                      borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Resetting..." : "Reset password"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "#879596" }}>
            LocalStack/MinStack Emulator — No real AWS charges
          </div>
        </div>
      </div>
    </div>
  );
}