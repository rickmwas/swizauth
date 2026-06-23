import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";
import { useEffect, useState } from "react";

export default function About() {
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
            <a href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Security</a>
            <a href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/about" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-primary">About</a>
            <Button className="btn-primary">Start Free</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 lg:pt-48 pb-24 md:pb-32">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-small text-primary font-medium mb-4">ABOUT</p>
            <h1 className="text-headline font-bold mb-6">Building identity infrastructure for the modern web</h1>
            <p className="text-lg text-muted-foreground">
              TerraSept Auth was founded to solve the identity crisis in modern applications. We believe every developer deserves enterprise-grade authentication and authorization.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                We're building the identity infrastructure that powers the next generation of applications. From startups to enterprises, every team deserves access to world-class authentication and authorization.
              </p>
              <p className="text-muted-foreground">
                Our platform is designed to be secure by default, easy to implement, and scalable to any size.
              </p>
            </div>
            <div className="card-premium">
              <p className="text-lg font-semibold mb-4">By the numbers</p>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-primary">500K+</p>
                  <p className="text-sm text-muted-foreground">Users secured daily</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">99.99%</p>
                  <p className="text-sm text-muted-foreground">Uptime guarantee</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">150+</p>
                  <p className="text-sm text-muted-foreground">Enterprise customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <h2 className="text-2xl font-bold mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Security First", desc: "Every decision is made with security in mind" },
              { title: "Developer Friendly", desc: "Simple APIs that developers love to use" },
              { title: "Transparent", desc: "Open about our practices and limitations" },
            ].map((value, idx) => (
              <div key={idx} className="card-premium">
                <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-12 md:p-16 text-center">
            <h2 className="text-headline mb-4">Join us on our mission</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're hiring talented engineers and designers. Help us build the future of identity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-primary">
                View Careers <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button className="btn-secondary">Contact Us</Button>
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
