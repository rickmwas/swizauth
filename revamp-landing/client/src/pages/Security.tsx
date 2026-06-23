import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Shield, Check } from "lucide-react";
import { useEffect, useState } from "react";

export default function Security() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16 md:h-20">
          <a href="/" className="flex items-center gap-2 group cursor-pointer">
            <img src="/manus-storage/ChatGPTImageJun10,2026,12_12_00AM_0a66c4f7.png" alt="TerraSept Auth" className="h-16 w-auto group-hover:opacity-80 transition-opacity duration-300" />
            <span className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">TerraSept Auth</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Features</a>
            <a href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Pricing</a>
            <a href="/security" className="text-sm text-primary font-medium">Security</a>
            <a href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/about" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-300">About</a>
            <Button className="btn-primary">Start Free</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 lg:pt-48 pb-24 md:pb-32">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-small text-primary font-medium mb-4">SECURITY</p>
            <h1 className="text-headline font-bold mb-6">Enterprise-grade security. Built in.</h1>
            <p className="text-lg text-muted-foreground">
              Compliance certifications, encryption, audit logs, and redundancy across all systems.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <h2 className="text-2xl font-bold mb-12">Compliance & Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "SOC 2 Type II", desc: "Annual audit and certification" },
              { title: "ISO 27001", desc: "Information security management" },
              { title: "GDPR", desc: "Data protection compliance" },
              { title: "HIPAA", desc: "Healthcare data security" },
              { title: "PCI DSS", desc: "Payment card industry standards" },
              { title: "CCPA", desc: "California privacy law" },
            ].map((cert, idx) => (
              <div key={idx} className="card-premium">
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">{cert.title}</p>
                    <p className="text-sm text-muted-foreground">{cert.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <h2 className="text-2xl font-bold mb-12">Infrastructure Security</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "End-to-End Encryption", desc: "All data encrypted in transit and at rest using AES-256" },
              { title: "Global Edge Network", desc: "DDoS protection and low-latency access worldwide" },
              { title: "Audit Logs", desc: "Immutable logs of all access and changes" },
              { title: "High Availability", desc: "99.99% uptime SLA with multi-region redundancy" },
              { title: "Zero Trust", desc: "Verify every request, no implicit trust" },
              { title: "Regular Penetration Testing", desc: "Third-party security assessments" },
            ].map((item, idx) => (
              <div key={idx} className="card-premium">
                <div className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-12 md:p-16 text-center">
            <h2 className="text-headline mb-4">Security you can trust</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Learn more about our security practices and certifications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-primary">
                Download Security Report <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button className="btn-secondary">Contact Security Team</Button>
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
                <li><a href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-4">DEVELOPERS</p>
              <ul className="space-y-2">
                <li><a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">SDKs</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-4">COMPANY</p>
              <ul className="space-y-2">
                <li><a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-4">LEGAL</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
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
