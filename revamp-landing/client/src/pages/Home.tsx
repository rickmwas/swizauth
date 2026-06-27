import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Lock, Shield, Users, Database, Terminal, Code, Copy, CheckSquare, 
  Cpu, Check, Server, RefreshCw, Key, ShieldAlert 
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRegisterUrl } from "@/const";

interface JsonLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  service: "auth-service" | "admin-service";
  request_id: string;
  organization_id: string;
  endpoint: string;
  status: number;
  latency_ms: number;
  message: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"next" | "go" | "express" | "fastapi">("next");
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<JsonLog[]>([]);

  // Simulation: Generate realistic JSON logs conforming to code-standards.md
  useEffect(() => {
    const generateInitialLogs = () => {
      const endpoints = [
        { path: "POST /api/v1/auth/login", service: "auth-service", status: 200, msg: "Session authenticated via Argon2id" },
        { path: "GET /api/v1/organizations/org_7a8b9c", service: "admin-service", status: 200, msg: "Loaded organization metadata" },
        { path: "POST /api/v1/auth/refresh", service: "auth-service", status: 200, msg: "Rotated session credentials" },
        { path: "POST /api/v1/mfa/verify", service: "auth-service", status: 200, msg: "MFA TOTP code verified successfully" }
      ];
      
      const initialLogs: JsonLog[] = Array.from({ length: 4 }).map((_, i) => {
        const ep = endpoints[i];
        const date = new Date(Date.now() - (4 - i) * 8000);
        return {
          timestamp: date.toISOString(),
          level: "INFO",
          service: ep.service as "auth-service" | "admin-service",
          request_id: `req_${Math.random().toString(36).substring(2, 10)}`,
          organization_id: "org_7a8b9c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
          endpoint: ep.path,
          status: ep.status,
          latency_ms: Math.floor(Math.random() * 15) + 3,
          message: ep.msg
        };
      });
      setLogs(initialLogs);
    };

    generateInitialLogs();

    const interval = setInterval(() => {
      const liveEndpoints = [
        { path: "POST /api/v1/auth/login", service: "auth-service", status: 200, msg: "Session authenticated via Argon2id" },
        { path: "GET /api/v1/organizations/org_7a8b9c", service: "admin-service", status: 200, msg: "Loaded organization metadata" },
        { path: "POST /api/v1/auth/refresh", service: "auth-service", status: 200, msg: "Rotated session credentials" },
        { path: "POST /api/v1/mfa/verify", service: "auth-service", status: 200, msg: "MFA TOTP code verified successfully" },
        { path: "POST /api/v1/api-keys", service: "admin-service", status: 201, msg: "Issued scoped API credential" },
        { path: "POST /api/v1/auth/login", service: "auth-service", status: 401, msg: "Failed login: invalid credentials" }
      ];

      const ep = liveEndpoints[Math.floor(Math.random() * liveEndpoints.length)];
      const newLog: JsonLog = {
        timestamp: new Date().toISOString(),
        level: ep.status >= 400 ? "WARN" : "INFO",
        service: ep.service as "auth-service" | "admin-service",
        request_id: `req_${Math.random().toString(36).substring(2, 10)}`,
        organization_id: "org_7a8b9c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
        endpoint: ep.path,
        status: ep.status,
        latency_ms: Math.floor(Math.random() * 20) + 2,
        message: ep.msg
      };

      setLogs(prev => [newLog, ...prev.slice(0, 3)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sdkSnippets = {
    next: {
      lang: "typescript",
      install: "npm install @tsauth/nextjs",
      desc: "Protect App Router paths using fast Edge middleware session checks.",
      code: `import { NextResponse } from "next/server";
import { verifySession } from "@tsauth/nextjs";

export async function middleware(req) {
  // Edge-compatible JWT signature verification (RS256)
  const session = await verifySession(req);
  if (!session.isValid) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}`
    },
    go: {
      lang: "go",
      install: "go get github.com/terrasept/tsauth-go",
      desc: "Fast-path token verification middleware for Gin and Chi REST servers.",
      code: `package main

import (
	"github.com/gin-gonic/gin"
	"github.com/terrasept/tsauth-go"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		// Cryptographic local signature validation
		claims, err := tsauth.VerifyToken(token)
		if err != nil {
			c.JSON(401, gin.H{"error": "UNAUTHORIZED"})
			c.Abort()
			return
		}
		c.Set("org_id", claims.OrgID)
		c.Next()
	}
}`
    },
    express: {
      lang: "javascript",
      install: "npm install @tsauth/express",
      desc: "Standard Express middleware backing cookie-based session validation.",
      code: `const express = require("express");
const { protectRoute } = require("@tsauth/express");
const app = express();

// Secure route protection checking local claims & token blacklists
app.get("/api/v1/dashboard", protectRoute({ 
  requiredPermissions: ["users.read"] 
}), (req, res) => {
  res.json({ data: "Sensitive multi-tenant dashboard assets" });
});`
    },
    fastapi: {
      lang: "python",
      install: "pip install tsauth-fastapi",
      desc: "FastAPI dependency injections for clean authorization and RBAC verification.",
      code: `from fastapi import FastAPI, Depends
from tsauth_fastapi import AuthGuard, UserClaims

app = FastAPI()
# Verify OAuth token credentials and isolate workspace parameters
auth = AuthGuard(permissions=["audit_logs.read"])

@app.get("/api/v1/audit")
def read_audit_logs(claims: UserClaims = Depends(auth)):
    return {"status": "success", "organization": claims.org_id}`
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        {/* Section 1: Hero */}
        <section className="py-24 md:py-32 border-b border-border bg-[#02050c] relative">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <p className="text-xs font-mono text-primary font-bold tracking-widest uppercase">
                  Production Identity Engine
                </p>
                <h1 className="text-display font-display font-bold text-foreground">
                  Multi-tenant Identity.<br />
                  Engineered for scale.
                </h1>
                <p className="text-subheadline text-muted-foreground max-w-xl">
                  A rigid, database-level partitioned access management system. Secure auth, fine-grained RBAC, TOTP MFA, and scoped credentials matching strict enterprise compliance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <a href={getRegisterUrl()} className="w-full sm:w-auto">
                    <Button className="btn-primary w-full flex items-center justify-center gap-2">
                      Get API Access <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                  <Link href="/docs" className="w-full sm:w-auto">
                    <Button className="btn-secondary w-full">
                      Read System Spec
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="border border-border/80 bg-card rounded-xl p-6 shadow-md shadow-black/5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono font-semibold tracking-wider text-muted-foreground uppercase">
                      Core Operations Engine
                    </span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { title: "Cryptography", val: "Argon2id / RS256 JWT" },
                      { title: "MFA Verification", val: "TOTP QR Enrollment & Recovery" },
                      { title: "Tenancy Model", val: "UUIDv7 logical partitioning" },
                      { title: "Session Driver", val: "Redis session revocation cache" }
                    ].map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-mono">
                        <span className="text-muted-foreground">{row.title}</span>
                        <span className="text-primary font-semibold">{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Tenant Isolation Visualizer */}
        <section className="py-24 md:py-32 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mb-16">
              <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
                Strict Isolation Boundaries
              </p>
              <h2 className="text-headline font-display font-bold mb-4">
                Rigid Multi-Tenant Partitioning
              </h2>
              <p className="text-body text-muted-foreground">
                TSAUTH enforces strict security separation via database-level partitioning. Every data access maps to a distinct identifier (`organization_id`), guaranteeing zero cross-tenant leakage.
              </p>
            </div>

            {/* Diagram layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch font-mono">
              {/* Box 1: HTTP Request */}
              <div className="border border-border bg-[#050914] rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                    01. Inbound Request
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-4">
                    HTTP Request Header
                  </p>
                  <pre className="p-4 bg-background rounded-lg border border-border text-[11px] text-foreground/80 overflow-x-auto leading-relaxed">
                    <code>{`GET /api/v1/users
Host: api.tsauth.com
Authorization: Bearer jwt_token
X-Organization-ID: org_7a8b9c...`}</code>
                  </pre>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  The client identifies its target tenant scope in the headers.
                </div>
              </div>

              {/* Box 2: Auth engine */}
              <div className="border border-border bg-[#050914] rounded-xl p-6 flex flex-col justify-between relative">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                    02. Engine Verification
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-4">
                    Go Auth Engine (Port 8080)
                  </p>
                  <div className="space-y-3">
                    {[
                      { step: "Signature Verification", desc: "Checks RS256 token validity" },
                      { step: "Scope Extraction", desc: "Reads claims from JWT sub & org" },
                      { step: "Blacklist Match", desc: "Queries Redis session memory" }
                    ].map((s, idx) => (
                      <div key={idx} className="p-2.5 bg-background rounded border border-border/80 text-[11px]">
                        <span className="text-primary font-bold">{s.step}: </span>
                        <span className="text-muted-foreground">{s.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Signature and authorization parameters checked in Go under 2ms.
                </div>
              </div>

              {/* Box 3: PostgreSQL Isolated DB */}
              <div className="border border-border bg-[#050914] rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                    03. Database Boundary
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-4">
                    PostgreSQL Schema Separation
                  </p>
                  <pre className="p-4 bg-background rounded-lg border border-border text-[11px] text-foreground/80 overflow-x-auto leading-relaxed">
                    <code>{`SELECT * FROM auth.users
WHERE organization_id = $1
  AND email = $2
  AND deleted_at IS NULL;`}</code>
                  </pre>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Enforces strict tenant query isolation boundaries inside the database layer.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Live JSON Activity Monitor */}
        <section className="py-24 md:py-32 border-b border-border bg-[#02050c]">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest">
                  Operational Traceability
                </p>
                <h2 className="text-headline font-display font-bold">
                  Immutable Security Audit Trails
                </h2>
                <p className="text-body text-muted-foreground">
                  TSAUTH records every important authentication event. Logs output in standard JSON format containing request traces, user contexts, endpoint latency, and status parameters.
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 border border-border/80 rounded-lg bg-card">
                    <span className="block text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Logging Format</span>
                    <b className="text-foreground">Structured JSON</b>
                  </div>
                  <div className="p-3 border border-border/80 rounded-lg bg-card">
                    <span className="block text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Target Sink</span>
                    <b className="text-foreground">Stdout stream</b>
                  </div>
                </div>
              </div>

              {/* Simulated Live Console */}
              <div className="lg:col-span-7">
                <div className="border border-border/80 bg-black rounded-xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 bg-[#080d19] border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                      <span className="text-[10px] font-mono font-semibold tracking-wider text-muted-foreground uppercase">
                        Stdout Log stream
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Service status: Active
                    </span>
                  </div>
                  <div className="p-4 md:p-6 space-y-3 max-h-[360px] overflow-y-auto font-mono text-[10px] leading-relaxed">
                    {logs.map((log) => (
                      <div key={log.timestamp} className="p-3 bg-[#060a12] border border-border/60 rounded-lg text-muted-foreground">
                        <span className="text-primary font-bold">{"{"}</span>
                        <div className="pl-4">
                          <span className="text-primary">"timestamp"</span>: <span className="text-green-400">"{log.timestamp}"</span>, <br />
                          <span className="text-primary">"level"</span>: <span className="text-green-400">"{log.level}"</span>, <br />
                          <span className="text-primary">"service"</span>: <span className="text-green-400">"{log.service}"</span>, <br />
                          <span className="text-primary">"endpoint"</span>: <span className="text-green-400">"{log.endpoint}"</span>, <br />
                          <span className="text-primary">"status"</span>: <span className="text-amber-500">{log.status}</span>, <br />
                          <span className="text-primary">"latency_ms"</span>: <span className="text-amber-500">{log.latency_ms}</span>, <br />
                          <span className="text-primary">"message"</span>: <span className="text-green-400">"{log.message}"</span>
                        </div>
                        <span className="text-primary font-bold">{"}"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Zero-Friction SDKs */}
        <section className="py-24 md:py-32 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div>
                  <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
                    Developer Integration
                  </p>
                  <h2 className="text-headline font-display font-bold">
                    Official SDK Ecosystem
                  </h2>
                </div>
                <p className="text-body text-muted-foreground">
                  Connect your codebase in minutes using native, officially supported libraries. TSAUTH handles local session caching, JWT cryptography validation, and protected routes.
                </p>

                {/* Tabs selection buttons */}
                <div className="flex flex-col gap-3 font-mono">
                  {(Object.keys(sdkSnippets) as Array<keyof typeof sdkSnippets>).map((key) => {
                    const active = activeTab === key;
                    const names = { next: "Next.js SDK", go: "Go Identity Driver", express: "Express Driver", fastapi: "FastAPI Module" };
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`text-left p-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                          active
                            ? "border-primary/50 bg-[#080e1e] text-foreground font-semibold"
                            : "border-border hover:bg-[#060a14] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {names[key]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code display block */}
              <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-xl overflow-hidden font-mono">
                <div className="flex items-center justify-between px-5 py-3 bg-[#080e1e] border-b border-border">
                  <span className="text-xs text-muted-foreground font-bold">
                    {sdkSnippets[activeTab].install}
                  </span>
                  <button
                    onClick={() => handleCopy(sdkSnippets[activeTab].code)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {copied ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="p-5 text-[11px] md:text-xs leading-relaxed overflow-x-auto bg-[#040710] border-b border-border text-primary font-bold">
                  {sdkSnippets[activeTab].desc}
                </div>
                <pre className="p-5 md:p-6 text-[11px] md:text-xs overflow-x-auto text-foreground/90 bg-[#020408] leading-relaxed">
                  <code>{sdkSnippets[activeTab].code}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Security Architecture Specifications */}
        <section className="py-24 md:py-32 border-b border-border bg-[#02050c]">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mb-16">
              <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
                Hardened Infrastructure
              </p>
              <h2 className="text-headline font-display font-bold mb-4">
                Architected for High Security
              </h2>
              <p className="text-body text-muted-foreground">
                Security is our primary concern. TSAUTH implements modern cryptographic standards and network policies to protect enterprise identity vectors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
              {[
                { icon: <Cpu className="w-5 h-5" />, title: "Argon2id Pw Hash", desc: "Parameters: m=65536, t=3, p=4. Resistance to GPU brute force." },
                { icon: <Lock className="w-5 h-5" />, title: "RS256 JWT Signed", desc: "Tokens signed utilizing asymmetric private keys, with 15-minute expirations." },
                { icon: <RefreshCw className="w-5 h-5" />, title: "Rotating Refreshes", desc: "Hashed refresh tokens stored in DB with rotating cycles and 30-day life." },
                { icon: <Key className="w-5 h-5" />, title: "AES-256-GCM rest", desc: "Sensitive parameters (MFA secrets, API keys) encrypted at-rest using AES-256." },
                { icon: <Server className="w-5 h-5" />, title: "Token rate limiter", desc: "Redis-backed bucket rate limit: Login 10 req/min, Signup 5 req/min." },
                { icon: <ShieldAlert className="w-5 h-5" />, title: "TLS 1.3 Strict", desc: "Mandatory HTTPS, HSTS, Secure cookies, CSRF boundaries, and CORS whitelist." }
              ].map((item, idx) => (
                <div key={idx} className="border border-border bg-[#050914] p-6 rounded-xl hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3 text-primary">
                    {item.icon}
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Enterprise CTA */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container mx-auto px-6">
            <div className="border border-border/80 bg-[#02050c] rounded-2xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-headline font-display font-bold mb-4">
                Secure your enterprise platform identity
              </h2>
              <p className="text-body text-muted-foreground mb-8 max-w-xl mx-auto">
                Join engineering teams deploying secure, isolated multi-tenant workspaces, fine-grained access policies, and audited credential verification.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={getRegisterUrl()} className="w-full sm:w-auto">
                  <Button className="btn-primary w-full flex items-center justify-center gap-2">
                    Start Integration <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button className="btn-secondary w-full">
                    Schedule Security Audit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
