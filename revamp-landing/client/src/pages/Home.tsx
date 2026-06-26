import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Shield, Users, Zap, Globe, Database, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getRegisterUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [visibleCards, setVisibleCards] = useState([false, false, false]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisibleCards([true, true, true]), 300);
    return () => clearTimeout(timer);
  }, []);

  const trustBadges = [
    { icon: <Shield className="w-5 h-5" />, label: "SOC 2", description: "Type II" },
    { icon: <Lock className="w-5 h-5" />, label: "ISO 27001", description: "Certified" },
    { icon: <Zap className="w-5 h-5" />, label: "99.99%", description: "Uptime SLA" },
    { icon: <Globe className="w-5 h-5" />, label: "GDPR", description: "Compliant" },
    { icon: <Shield className="w-5 h-5" />, label: "Enterprise", description: "Grade" },
    { icon: <Users className="w-5 h-5" />, label: "Multi-Tenant", description: "Ready" },
  ];

  const features = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Authentication",
      description: "Passwordless, SSO, MFA, passkeys. Enterprise-grade sign-in.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Authorization",
      description: "Fine-grained access control. Roles, permissions, policies.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Organizations",
      description: "Multi-tenant infrastructure. Manage teams and resources.",
    },
  ];

  const architectureNodes = [
    { icon: <Users className="w-6 h-6" />, label: "Users" },
    { icon: <Database className="w-6 h-6" />, label: "Applications" },
    { icon: <Shield className="w-6 h-6" />, label: "Identity Platform" },
    { icon: <Lock className="w-6 h-6" />, label: "Policies" },
    { icon: <Database className="w-6 h-6" />, label: "Resources" },
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
            <Link href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full">
              Pricing
            </Link>
            <Link href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full">
              Security
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/about" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-300">
              About
            </Link>
            <a href={getRegisterUrl()}>
              <Button className="btn-primary">
                Start Free
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 lg:pt-48 pb-24 md:pb-32 lg:pb-40 overflow-hidden mesh-bg">
        {/* Mesh Background Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="mesh-node" />
          ))}
        </div>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <p className="text-small text-primary font-medium">ENTERPRISE IDENTITY</p>
                <h1 className="text-headline font-bold leading-tight">
                  Identity Infrastructure.{" "}
                  <span className="text-primary">Built for Trust.</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Secure authentication, authorization, and access management at scale. Trusted by enterprises worldwide.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href={getRegisterUrl()} className="w-full sm:w-auto">
                  <Button className="btn-primary w-full">
                    Start Free <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <Link href="/docs" className="w-full sm:w-auto">
                  <Button className="btn-secondary w-full">
                    View Docs
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="w-full">
                  <p className="text-xs text-muted-foreground font-medium mb-4">TRUSTED BY LEADING ENTERPRISES</p>
                  <div className="flex flex-wrap gap-6 md:gap-8 items-center">
                    <img src="/manus-storage/bauMrKKjwTwI_0de0323f.png" alt="AWS" className="h-8 md:h-10 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300" />
                    <img src="/manus-storage/G44e5dgn6bMv_4f466245.png" alt="Microsoft Azure" className="h-8 md:h-10 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300" />
                    <img src="/manus-storage/s253XvMTYFEY_04d62fad.jpg" alt="Google Cloud" className="h-8 md:h-10 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300" />
                    <img src="/manus-storage/oF76CR2QIMbN_fe6cd5da.png" alt="Linode" className="h-8 md:h-10 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300" />
                    <img src="/manus-storage/Lttw1Cnmj67L_52f94a11.png" alt="OpenAI" className="h-8 md:h-10 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300" />
                    <img src="/manus-storage/S39Gt5TW8Auo_954b02fa.png" alt="Lenovo" className="h-8 md:h-10 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Hero Visual */}
            <div className="relative h-96 md:h-full min-h-96 animate-fade-in group">
              <img
                src="/manus-storage/ChatGPTImageJun9,2026,11_24_27PM(1)_bb2f3565.png"
                alt="Security Infrastructure"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="relative py-20 md:py-28 lg:py-32 border-t border-border mesh-bg">
        {/* Mesh Background Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="mesh-node" />
          ))}
        </div>
        <div className="container">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-2">
              <p className="text-small text-primary font-medium">COMPLIANCE</p>
              <h2 className="text-headline">Enterprise-Grade Security</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {trustBadges.map((badge, idx) => (
                <div
                  key={idx}
                  className="group card-premium text-center hover:border-primary/50 hover:bg-secondary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
                  style={{
                    animation: `fade-in-up 0.6s ease-out ${idx * 80}ms backwards`,
                  }}
                >
                  <div className="flex justify-center mb-3 text-primary group-hover:scale-125 group-hover:text-primary transition-all duration-300">
                    {badge.icon}
                  </div>
                  <p className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors duration-300">{badge.label}</p>
                  <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 md:py-28 lg:py-32 mesh-bg">
        {/* Mesh Background Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="mesh-node" />
          ))}
        </div>
        <div className="container">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-2">
              <p className="text-small text-primary font-medium">CORE CAPABILITIES</p>
              <h2 className="text-headline">Built for Developers</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={`card-premium group transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 cursor-pointer ${
                    visibleCards[idx] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  <div className="mb-6 group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">{feature.description}</p>
                  <div className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300">
                    <span className="text-sm font-medium">Learn more</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="relative py-20 md:py-28 lg:py-32 border-t border-border mesh-bg">
        {/* Mesh Background Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="mesh-node" />
          ))}
        </div>
        <div className="container">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-2">
              <p className="text-small text-primary font-medium">INFRASTRUCTURE</p>
              <h2 className="text-headline">Secure by Design</h2>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
              {architectureNodes.map((node, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 flex-1 group">
                  <div className="w-16 h-16 bg-secondary border border-border rounded-lg flex items-center justify-center text-primary hover:border-primary hover:bg-secondary/80 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group-hover:scale-110 cursor-pointer">
                    {node.icon}
                  </div>
                  <p className="text-sm font-medium text-center group-hover:text-primary transition-colors duration-300">{node.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
              {[
                { icon: <Zap className="w-5 h-5" />, label: "Real-time Processing" },
                { icon: <Globe className="w-5 h-5" />, label: "Global Edge Network" },
                { icon: <Lock className="w-5 h-5" />, label: "End-to-end Encryption" },
                { icon: <Database className="w-5 h-5" />, label: "Audit Logs" },
                { icon: <Shield className="w-5 h-5" />, label: "High Availability" },
                { icon: <Check className="w-5 h-5" />, label: "Immutable Records" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 group cursor-pointer p-2 rounded-lg hover:bg-secondary/50 transition-all duration-300">
                  <div className="text-primary group-hover:scale-125 group-hover:text-primary transition-transform duration-300">{item.icon}</div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors duration-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-28 lg:py-32">
        <div className="container">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-12 md:p-16 text-center hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-500 group">
            <h2 className="text-headline mb-4 group-hover:text-primary transition-colors duration-300">Ready to get started?</h2>
            <p className="text-subheadline text-muted-foreground mb-8 max-w-2xl mx-auto group-hover:text-foreground transition-colors duration-300">
              Join enterprises securing their infrastructure with TerraSept Auth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={getRegisterUrl()}>
                <Button className="btn-primary">
                  Start Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <Link href="/contact">
                <Button className="btn-secondary">
                  Schedule Demo
                </Button>
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
