import React from "react";
import Link from "next/link";
import { Shield, Sparkles, Key, Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Left panel - Branding and value props (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-background via-background to-accent/10 overflow-hidden border-r border-border">
        {/* Abstract background blur/gradient elements */}
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        {/* Logo and header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-foreground">
            Swiz<span className="text-primary">Auth</span>
          </span>
        </div>

        {/* Value props in center */}
        <div className="relative z-10 my-auto max-w-lg space-y-8">
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground leading-tight">
            The Secure Identity Layer for modern businesses.
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Protect your applications, manage users, and secure API access with our high-performance, multi-tenant authentication engine.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-accent-foreground mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Multi-Tenant Isolation</h3>
                <p className="text-sm text-muted-foreground">Rigid data segregation ensures complete tenant isolation and security.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-accent-foreground mt-0.5">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Flexible Authentication</h3>
                <p className="text-sm text-muted-foreground">Email/password, OTP challenge, and secure MFA TOTP out-of-the-box.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-accent-foreground mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Granular RBAC & Auditing</h3>
                <p className="text-sm text-muted-foreground">Role-based controls matched with real-time audit logging for compliance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} SwizAuth. All rights reserved.
        </div>
      </div>

      {/* Right panel - Dynamic Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Subtle background glow for mobile */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl lg:hidden" />
        
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
          {children}
        </div>
      </div>
    </div>
  );
}
