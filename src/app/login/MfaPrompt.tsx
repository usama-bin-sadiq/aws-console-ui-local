"use client";

import { apiFetch } from "@/lib/api-client";
import { FormField, Input, Button, SpaceBetween, Box } from "@cloudscape-design/components";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Inline MFA challenge used by both login screens.
 * Posts action:"verifyMFASignin" directly to /api/auth. The server sets the
 * authenticated session cookies before the user is routed to the console home.
 * Relies on the `.aws-*` classes defined by the hosting page's <style> block.
 */
export default function MfaPrompt({
  username,
  sessionToken,
}: {
  username: string;
  sessionToken: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter your MFA code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verifyMFASignin",
          username,
          sessionToken,
          code: code.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setError(data.error || "MFA verification failed.");
        return;
      }
      router.push("/");
    } catch {
      setError("MFA verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="aws-field">
        <label className="aws-label" htmlFor="mfa-code">
          MFA code
        </label>
        <input
          id="mfa-code"
          className="aws-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter MFA code"
        />
      </div>
      {error && (
        <div className="aws-error" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="aws-btn aws-btn-primary" disabled={loading}>
        Sign in
      </button>
    </form>
  );
}
