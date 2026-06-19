"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (result?.error) setError(result.error);
      else setSent(true);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sent ? "Check your email" : "We'll send you a reset link"}
          </p>
        </div>

        {sent ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <p className="text-sm text-foreground">
              A password reset link has been sent. Check your inbox and click the link to set a new password.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-lg bg-primary text-white font-semibold py-2.5 text-sm text-center hover:bg-primary/90 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 space-y-4 border border-border">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-5">
          <Link href="/login" className="text-primary hover:underline font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
