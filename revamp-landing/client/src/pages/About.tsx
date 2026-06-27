import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Award, Shield, Target, Activity, Heart, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRegisterUrl } from "@/const";

export default function About() {
  const values = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Security Integrity First",
      desc: "We verify and encrypt sensitive parameters at-rest and in-transit. Security is the main product, not a marketing checkbox."
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: "Engineering Excellence",
      desc: "Our codebase implements zero-any TypeScript validation in NestJS and strict panic-recovery HTTP router middleware in Go."
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Isolated Boundaries",
      desc: "Multi-tenant logic is integrated at the lowest database layer using unique constraints, separating organizations cleanly."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        {/* Section 1: Hero */}
        <section className="py-20 md:py-28 border-b border-border bg-[#02050c] relative">
          <div className="container mx-auto px-6 max-w-3xl">
            <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
              About the Company
            </p>
            <h1 className="text-display font-display font-bold text-foreground mb-6">
              Production Identity Infrastructure
            </h1>
            <p className="text-subheadline text-muted-foreground">
              TSAUTH was engineered to solve B2B multi-tenancy access problems. We serve high-performance auth routines to secure business operations globally.
            </p>
          </div>
        </section>

        {/* Section 2: Core Engineering Standards */}
        <section className="py-24 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-headline font-display font-bold mb-6">
                  Engineered for Operational Stability
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 font-sans">
                  Identity systems cannot afford downtime. TSAUTH separating management CRUD interfaces (NestJS admin-service on port 3001) from core token verification (Go auth-service on port 8080) guarantees that authentication checks keep running even during administrative updates.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  We deploy our Go core across multiple availability zones using fast database connection pools, reducing identity verification overhead to under 2ms.
                </p>
              </div>

              {/* Specs boxes */}
              <div className="space-y-6">
                {[
                  { num: "99.99%", title: "Operational Uptime SLA", desc: "Contractually backed availability parameters for enterprise tier accounts." },
                  { num: "2ms", title: "Identity Validation Latency", desc: "Fast-path RS256 token verification utilizing local claims verification." },
                  { num: "Zero-Any", title: "TypeScript Implementation", desc: "Strict null checks and DTO structures guarding APIs." }
                ].map((stat, idx) => (
                  <div key={idx} className="border border-border bg-[#050914] p-5 rounded-xl font-mono text-xs flex gap-5 items-start">
                    <div className="text-2xl font-bold text-primary">{stat.num}</div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{stat.title}</h4>
                      <p className="text-muted-foreground font-sans text-xs">{stat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Engineering Core Values */}
        <section className="py-24 border-b border-border bg-[#02050c]">
          <div className="container mx-auto px-6">
            <h2 className="text-headline font-display font-bold mb-12 text-center">
              System Architecture Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((val, idx) => (
                <div key={idx} className="border border-border bg-background p-6 rounded-xl hover:border-primary/30 transition-colors">
                  <div className="text-primary mb-4">
                    {val.icon}
                  </div>
                  <h3 className="text-base font-display font-bold text-foreground mb-3">{val.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: CTA */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="border border-border/80 bg-[#02050c] rounded-2xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-headline font-display font-bold mb-4">
                Partner with security infrastructure specialists
              </h2>
              <p className="text-body text-muted-foreground mb-8 max-w-xl mx-auto">
                Read our cryptographic implementation documentation or get started immediately inside our sandbox developer environment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={getRegisterUrl()} className="w-full sm:w-auto">
                  <Button className="btn-primary w-full flex items-center justify-center gap-2">
                    Create Sandbox Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Link href="/docs" className="w-full sm:w-auto">
                  <Button className="btn-secondary w-full">
                    Read Developer Specs
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
