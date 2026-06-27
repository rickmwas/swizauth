import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Lock, Shield, Cpu, Key, Server, RefreshCw, Check, ArrowRight, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRegisterUrl } from "@/const";

export default function Security() {
  const specs = [
    {
      title: "Argon2id Password Hashing",
      desc: "All passwords are derivation-hashed using Argon2id, configured with parameters designed to withstand custom hardware brute-force attacks.",
      params: [
        { name: "Memory cost (m)", value: "65,536 KB" },
        { name: "Time cost (t)", value: "3 iterations" },
        { name: "Parallelism (p)", value: "4 threads" }
      ]
    },
    {
      title: "Asymmetric JWT Issuance",
      desc: "Access credentials are cryptographically signed JWTs using RS256 signatures, validated locally without database round-trips.",
      params: [
        { name: "Algorithm", value: "RS256 (RSA 2048-bit)" },
        { name: "Expiration", value: "15 minutes" },
        { name: "Audience scope", value: "X-Organization-ID" }
      ]
    },
    {
      title: "Credentials At-Rest Encryption",
      desc: "Sensitive workspace and authentication variables (MFA secrets, OAuth client secrets, API key hashes) are encrypted using AES-256.",
      params: [
        { name: "Algorithm", value: "AES-256-GCM" },
        { name: "Key rotation", value: "Annual database key cycle" },
        { name: "Salt parameters", value: "Unique initialization vectors (IV)" }
      ]
    }
  ];

  const rateLimits = [
    { endpoint: "POST /api/v1/auth/login", limit: "10 requests / minute", rationale: "Prevents credential stuffing attacks" },
    { endpoint: "POST /api/v1/auth/register", limit: "5 requests / minute", rationale: "Mitigates automated sandbox spamming" },
    { endpoint: "POST /api/v1/auth/refresh", limit: "100 requests / minute", rationale: "Accommodates dynamic client token rotations" },
    { endpoint: "API Key Authenticated Routes", limit: "1000 requests / minute", rationale: "Supports high-throughput M2M integrations" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        {/* Section 1: Hero */}
        <section className="py-20 md:py-28 border-b border-border bg-[#02050c] relative">
          <div className="container mx-auto px-6 max-w-3xl">
            <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
              Security Specifications
            </p>
            <h1 className="text-display font-display font-bold text-foreground mb-6">
              Cryptographically Hardened
            </h1>
            <p className="text-subheadline text-muted-foreground">
              TSAUTH is built on modern security standards. We detail our encryption, rate limiting, and hashing protocols explicitly.
            </p>
          </div>
        </section>

        {/* Section 2: Cryptographic Specs Grid */}
        <section className="py-24 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {specs.map((spec, idx) => (
                <div key={idx} className="border border-border bg-[#050914] p-8 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-display font-semibold mb-4 text-foreground">
                      {spec.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-sans">
                      {spec.desc}
                    </p>
                    <div className="border-t border-border/80 pt-4 space-y-3 font-mono text-xs text-muted-foreground">
                      {spec.params.map((param, pidx) => (
                        <div key={pidx} className="flex justify-between items-center">
                          <span>{param.name}</span>
                          <span className="text-primary font-bold">{param.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Token Lifecycle / Rotation Sequence Diagram */}
        <section className="py-24 border-b border-border bg-[#02050c]">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mb-16">
              <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
                Protocol Architecture
              </p>
              <h2 className="text-headline font-display font-bold mb-4">
                Refresh Token Rotation (RTR) Flow
              </h2>
              <p className="text-body text-muted-foreground">
                To prevent replay attacks, refresh tokens are rotated on every authentication cycle. Validating a previously rotated token automatically revokes the entire user session.
              </p>
            </div>

            {/* Sequence flow layout */}
            <div className="border border-border bg-black rounded-xl p-6 shadow-2xl font-mono text-xs overflow-x-auto">
              <div className="min-w-[600px] space-y-4">
                <div className="grid grid-cols-3 text-center text-muted-foreground border-b border-border pb-3 mb-6">
                  <span>Client App</span>
                  <span>Go Auth Engine</span>
                  <span>Redis & Postgres</span>
                </div>

                {[
                  { sender: "Client App", path: "POST /auth/refresh { refresh_token_A }", recipient: "Go Auth Engine", note: "Client requests token renewal" },
                  { sender: "Go Auth Engine", path: "SHA-256 check and database query", recipient: "Redis & Postgres", note: "Matches token hash & checks expiration" },
                  { sender: "Redis & Postgres", path: "Verify token state & revoke token_A", recipient: "Go Auth Engine", note: "Token A is marked rotated/revoked" },
                  { sender: "Go Auth Engine", path: "Issue Access Token + Refresh Token B", recipient: "Client App", note: "New tokens returned; Session updated" }
                ].map((step, sidx) => (
                  <div key={sidx} className="p-3 bg-[#050914] border border-border rounded-lg flex items-center justify-between gap-4">
                    <div className="w-1/4 text-primary font-bold">
                      {step.sender}
                    </div>
                    <div className="w-2/4 text-center">
                      <div className="bg-background px-3 py-1 border border-border/80 rounded inline-block text-[11px] text-foreground">
                        {step.path}
                      </div>
                      <span className="block text-[9px] text-muted-foreground mt-1">
                        &rarr; {step.note} &rarr;
                      </span>
                    </div>
                    <div className="w-1/4 text-right text-primary font-bold">
                      {step.recipient}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Redis Rate Limiting Parameters */}
        <section className="py-24 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div>
                  <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
                    Brute Force Protection
                  </p>
                  <h2 className="text-headline font-display font-bold">
                    Redis-Backed Token Buckets
                  </h2>
                </div>
                <p className="text-body text-muted-foreground">
                  Our rate limiter shields REST endpoints via Redis-backed token buckets. Limits are evaluated instantly using namespaces like <code className="text-[11px] font-mono text-primary font-bold">ratelimit:&lt;ip_or_user_id&gt;:&lt;endpoint&gt;</code>.
                </p>
                <div className="p-4 border border-border bg-[#050914] rounded-lg font-mono text-xs">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">Namespace pattern</span>
                  <code className="text-primary font-bold">ratelimit:197.210.64.12:login</code>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="border border-border/80 bg-card rounded-xl overflow-hidden shadow-xl font-mono text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#0c1222] border-b border-border">
                        <th className="p-4 font-semibold text-muted-foreground uppercase tracking-wider">REST Route</th>
                        <th className="p-4 font-semibold text-primary uppercase tracking-wider">Limit Threshold</th>
                        <th className="p-4 font-semibold text-muted-foreground uppercase tracking-wider">Security Intent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-muted-foreground">
                      {rateLimits.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#070b15] transition-colors">
                          <td className="p-4 text-foreground font-semibold">{row.endpoint}</td>
                          <td className="p-4 text-primary font-semibold">{row.limit}</td>
                          <td className="p-4 font-sans text-sm">{row.rationale}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: CTA */}
        <section className="py-24 bg-[#02050c]">
          <div className="container mx-auto px-6">
            <div className="border border-border/80 bg-background rounded-2xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-headline font-display font-bold mb-4">
                Enforce modern security policies
              </h2>
              <p className="text-body text-muted-foreground mb-8 max-w-xl mx-auto">
                Read our detailed architecture documentation or connect with a security engineer to discuss custom deployment topology options.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={getRegisterUrl()} className="w-full sm:w-auto">
                  <Button className="btn-primary w-full flex items-center justify-center gap-2">
                    Create Sandbox Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button className="btn-secondary w-full">
                    Contact Security Officer
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
