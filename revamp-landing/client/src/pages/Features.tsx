import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Shield, Users, Zap, Globe, Database, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getRegisterUrl } from "@/const";
import { Link } from "wouter";

export default function Features() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const featureCategories = [
    {
      title: "Authentication",
      description: "Enterprise-grade sign-in solutions",
      features: [
        "Passwordless authentication",
        "Single Sign-On (SSO)",
        "Multi-Factor Authentication (MFA)",
        "Passkeys & WebAuthn",
        "Social login integration",
        "Custom branding",
      ],
    },
    {
      title: "Authorization",
      description: "Fine-grained access control",
      features: [
        "Role-based access control (RBAC)",
        "Attribute-based access control (ABAC)",
        "Permission management",
        "Policy engine",
        "Resource-level permissions",
        "Dynamic policies",
      ],
    },
    {
      title: "Organizations",
      description: "Multi-tenant infrastructure",
      features: [
        "Team management",
        "Member roles & permissions",
        "Invite & onboarding",
        "Resource isolation",
        "Audit trails",
        "Custom workflows",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <img src="/manus-storage/ChatGPTImageJun10,2026,12_12_00AM_0a66c4f7.png" alt="TerraSept Auth" className="h-16 w-auto group-hover:opacity-80 transition-opacity duration-300" />
            <span className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">TerraSept Auth</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm text-primary font-medium">Features</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Pricing</Link>
            <Link href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Security</Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/about" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-300">About</Link>
            <a href={getRegisterUrl()}>
              <Button className="btn-primary">Start Free</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 lg:pt-48 pb-24 md:pb-32">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-small text-primary font-medium mb-4">FEATURES</p>
            <h1 className="text-headline font-bold mb-6">Everything you need. Nothing you don't.</h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive identity infrastructure with authentication, authorization, and organization management built for scale.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 md:py-28">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {featureCategories.map((category, idx) => (
              <div key={idx} className="card-premium group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <div className="mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                  {idx === 0 && <Lock className="w-8 h-8" />}
                  {idx === 1 && <Shield className="w-8 h-8" />}
                  {idx === 2 && <Users className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">{category.title}</h3>
                <p className="text-sm text-muted-foreground mb-6">{category.description}</p>
                <ul className="space-y-3">
                  {category.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-12 md:p-16 text-center">
            <h2 className="text-headline mb-4">Ready to explore?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start building with TerraSept Auth today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={getRegisterUrl()}>
                <Button className="btn-primary">
                  Start Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <Link href="/docs">
                <Button className="btn-secondary">View Docs</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <p className="text-xs font-semibold text-primary mb-4">PRODUCT</p>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-4">DEVELOPERS</p>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">SDKs</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-4">COMPANY</p>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-4">LEGAL</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/manus-storage/ChatGPTImageJun10,2026,12_12_00AM_0a66c4f7.png" alt="TerraSept Auth" className="h-10 w-auto" />
              <span className="text-sm font-bold">TerraSept Auth</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 TerraSept Auth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
