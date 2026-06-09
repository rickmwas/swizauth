"use client";

import React, { startTransition, useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "../actions";
import { Shield, Loader2, AlertCircle, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, {
    success: false,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      action(formData);
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-md shadow-black/5">
      {/* Brand logo */}
      <div className="flex lg:hidden items-center justify-center space-x-3 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <Shield className="w-4.5 h-4.5" />
        </div>
        <span className="text-lg font-display font-bold tracking-tight text-foreground">
          Swiz<span className="text-primary">Auth</span>
        </span>
      </div>

      <div className="space-y-2 mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-display font-semibold tracking-tight text-foreground">
          Reset password
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your registered email address and we will send you a secure link to reset your credentials.
        </p>
      </div>

      {state.success && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Reset request received</p>
            <p className="text-xs leading-normal">
              If the email address exists in our database, a password reset link has been printed to the system logs.
            </p>
            <Link
              href="/auth/login"
              className="inline-block text-xs font-semibold text-primary hover:underline pt-1"
            >
              Back to Login &rarr;
            </Link>
          </div>
        </div>
      )}

      {state.error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error.message}</span>
        </div>
      )}

      {!state.success && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              disabled={isPending}
              placeholder="admin@yourdomain.com"
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-10 mt-2 rounded-lg bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-primary-foreground font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Remember your credentials?{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Go back
        </Link>
      </div>
    </div>
  );
}
