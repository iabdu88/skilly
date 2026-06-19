"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { redeemInviteCode } from "@/lib/actions/invite";

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError]  = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await redeemInviteCode(formData);
      if ("error" in result) setError((result as { error: string }).error ?? null);
      else if ("success" in result) setSentTo((result as { success: boolean; email: string }).email ?? null);
    });
  }

  if (sentTo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-2">
            <MailCheck className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
            <p className="text-muted-foreground text-sm mt-2">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-foreground">{sentTo}</span>.
              Click it to activate your account, then come back to sign in.
            </p>
          </div>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-primary text-white font-semibold py-2.5 text-sm text-center hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">You need an invite code to join Skilly.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 space-y-4 border border-border">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="full_name">Full Name</label>
            <input id="full_name" name="full_name" type="text" required autoComplete="name" placeholder="Your full name"
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com"
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="new-password" placeholder="At least 6 characters"
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="code">Invite Code</label>
            <input id="code" name="code" type="text" required autoCapitalize="characters" placeholder="e.g. ABCD1234"
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono uppercase tracking-widest" />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={isPending}
            className="w-full rounded-lg bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
