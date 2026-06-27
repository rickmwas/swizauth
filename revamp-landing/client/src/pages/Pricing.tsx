import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRegisterUrl } from "@/const";

export default function Pricing() {
  const plans = [
    {
      name: "Developer Sandbox",
      price: "$0",
      period: "forever",
      description: "Ideal for local testing, API prototyping, and building early MVPs.",
      features: [
        "Up to 1,000 monthly active users",
        "Single tenant organization isolation",
        "Argon2id password hashing",
        "RS256 JWT access token validation",
        "Redis-backed default rate limiting",
        "Community Slack channel support"
      ],
      cta: "Create Sandbox Account",
      featured: false
    },
    {
      name: "Production Scale",
      price: "$149",
      period: "/month",
      description: "For growing SaaS startups and multi-tenant cloud platforms.",
      features: [
        "Up to 25,000 monthly active users",
        "Unlimited isolated organizations",
        "TOTP Multi-Factor Auth (MFA)",
        "Hashed scoped API key management",
        "3-day audit logs queries retention",
        "Standard Redis rate limiting configuration",
        "Priority email support (<4 hours)"
      ],
      cta: "Launch Scale Account",
      featured: true
    },
    {
      name: "Compliance Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For corporations requiring high availability and custom SLAs.",
      features: [
        "Unlimited monthly active users",
        "Unlimited isolated organizations",
        "Dedicated PostgreSQL connection pools",
        "Custom domains & white-labeled interfaces",
        "1-year immutable audit log retention",
        "Custom Redis rate limit policies",
        "24/7 phone support & dedicated slack channel",
        "On-premise / private cloud deploy option"
      ],
      cta: "Contact Platform Team",
      featured: false
    }
  ];

  const comparisonFeatures = [
    { name: "Monthly Active Users", developer: "1,000", scale: "25,000", enterprise: "Unlimited" },
    { name: "Isolated Tenant Orgs", developer: "1 Organization", scale: "Unlimited", enterprise: "Unlimited" },
    { name: "MFA Setup (TOTP QR)", developer: "—", scale: "Included", enterprise: "Included" },
    { name: "API Key Management", developer: "Basic", scale: "Advanced Scoped", enterprise: "Advanced Scoped" },
    { name: "Audit Log Retention", developer: "—", scale: "3 Days", enterprise: "1 Year (Exportable)" },
    { name: "Database Model", developer: "Shared Database", scale: "Shared Database", enterprise: "Dedicated Pools / Private Instance" },
    { name: "Deployment Topology", developer: "Shared Cloud", scale: "Shared Cloud", enterprise: "Multi-Region / On-Premise" },
    { name: "Uptime SLA", developer: "—", scale: "99.9% availability", enterprise: "99.99% contract SLA" },
    { name: "Rate Limiting Checks", developer: "Standard limits", scale: "High volume limits", enterprise: "Custom limits" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        {/* Section 1: Hero */}
        <section className="py-20 md:py-28 border-b border-border bg-[#02050c] relative">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
              Platform Pricing
            </p>
            <h1 className="text-display font-display font-bold text-foreground mb-6">
              Predictable, Transparent Plans
            </h1>
            <p className="text-subheadline text-muted-foreground">
              Build and verify secure authentication workflows for free. Pay when you scale to production tenants.
            </p>
          </div>
        </section>

        {/* Section 2: Pricing Cards Grid */}
        <section className="py-24 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {plans.map((plan, idx) => (
                <div
                  key={idx}
                  className={`border p-8 rounded-xl flex flex-col justify-between transition-shadow duration-300 relative bg-[#050914] ${
                    plan.featured
                      ? "ring-2 ring-primary border-primary/50 shadow-xl shadow-primary/5"
                      : "border-border shadow-md"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-primary px-3.5 py-1 rounded-full shadow">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-primary-foreground uppercase">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-display font-bold text-foreground mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground min-h-[48px] leading-relaxed">
                        {plan.description}
                      </p>
                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-3xl font-display font-bold text-foreground">{plan.price}</span>
                        <span className="text-xs font-mono text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-6 mb-8 space-y-4">
                      {plan.features.map((feature, fidx) => (
                        <div key={fidx} className="flex items-start gap-3 text-xs">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground/90 font-mono leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {plan.cta === "Contact Platform Team" ? (
                      <Link href="/contact" className="w-full">
                        <Button className="w-full btn-secondary text-xs">
                          {plan.cta}
                        </Button>
                      </Link>
                    ) : (
                      <a href={getRegisterUrl()} className="w-full">
                        <Button className={`w-full text-xs ${plan.featured ? "btn-primary" : "btn-secondary"}`}>
                          {plan.cta}
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Detailed Parameter Comparison Grid */}
        <section className="py-24 border-b border-border bg-[#02050c]">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-headline font-display font-bold mb-12 text-center">
                Technical Specification Table
              </h2>
              <div className="border border-border bg-card rounded-xl overflow-hidden shadow-xl font-mono text-xs">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#0c1222] border-b border-border">
                      <th className="p-4 font-semibold text-muted-foreground uppercase tracking-wider">Parameters</th>
                      <th className="p-4 font-semibold text-primary uppercase tracking-wider">Sandbox</th>
                      <th className="p-4 font-semibold text-primary uppercase tracking-wider">Scale</th>
                      <th className="p-4 font-semibold text-primary uppercase tracking-wider">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-muted-foreground">
                    {comparisonFeatures.map((feat, idx) => (
                      <tr key={idx} className="hover:bg-[#070b15] transition-colors">
                        <td className="p-4 text-foreground font-semibold">{feat.name}</td>
                        <td className="p-4">{feat.developer}</td>
                        <td className="p-4">{feat.scale}</td>
                        <td className="p-4">{feat.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Operational FAQ */}
        <section className="py-24 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-headline font-display font-bold mb-12 text-center">
                Frequently Asked Technical Questions
              </h2>
              <div className="space-y-6">
                {[
                  { 
                    q: "What defines a Monthly Active User (MAU) in TSAUTH?", 
                    a: "An active user is any distinct user identity that validates a JWT session, logs in, registers, or rotates a refresh token during a calendar month." 
                  },
                  { 
                    q: "How does the system ensure logical database tenant isolation?", 
                    a: "Every data table contains an organization_id UUIDv7 column. Middlewares in the Go Auth Engine and NestJS API filter queries by claims parameters, preventing database boundaries leakage." 
                  },
                  { 
                    q: "Can we configure custom rate limiting thresholds on production plans?", 
                    a: "Yes. Sandbox and Scale plans run on standard Redis token buckets (Login: 10/min, Signup: 5/min, APIs: 1000/min). The Enterprise plan supports custom rate limit configurations." 
                  },
                  { 
                    q: "Is it possible to host TSAUTH inside our own private cloud?", 
                    a: "Yes. Our Enterprise plan supports direct deployments of our Go Identity Engine binary, NestJS Management API, and DB migrations into your private AWS or Azure Virtual Private Cloud." 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="border border-border bg-[#050914] p-6 rounded-xl font-mono text-xs">
                    <p className="font-semibold text-foreground mb-3 flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item.q}</span>
                    </p>
                    <p className="text-muted-foreground leading-relaxed pl-6 font-sans text-sm">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: CTA */}
        <section className="py-24 bg-[#02050c]">
          <div className="container mx-auto px-6">
            <div className="border border-border/80 bg-background rounded-2xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-headline font-display font-bold mb-4">
                Launch production auth today
              </h2>
              <p className="text-body text-muted-foreground mb-8 max-w-xl mx-auto">
                Implement multi-tenant secure isolation, RBAC controls, and active session protection with predictable pricing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={getRegisterUrl()} className="w-full sm:w-auto">
                  <Button className="btn-primary w-full flex items-center justify-center gap-2">
                    Create Free Sandbox <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button className="btn-secondary w-full">
                    Contact Enterprise Sales
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
