"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Code, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Documentation() {
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
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <img src="/manus-storage/ChatGPTImageJun10,2026,12_12_00AM_0a66c4f7.png" alt="TerraSept Auth" className="h-16 w-auto group-hover:opacity-80 transition-opacity duration-300" />
            <span className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">TerraSept Auth</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Features</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Pricing</Link>
            <Link href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Security</Link>
            <Link href="/docs" className="text-sm text-primary font-medium">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/about" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-300">About</Link>
            <Button className="btn-primary">Start Free</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 lg:pt-48 pb-24 md:pb-32">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-small text-primary font-medium mb-4">DOCUMENTATION</p>
            <h1 className="text-headline font-bold mb-6">Comprehensive guides and API reference</h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to integrate TerraSept Auth into your application.
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <h2 className="text-2xl font-bold mb-12">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Installation", desc: "Install the TerraSept Auth SDK for your platform" },
              { title: "Authentication", desc: "Implement user sign-in and registration" },
              { title: "Authorization", desc: "Set up roles and permissions" },
            ].map((item, idx) => (
              <div key={idx} className="card-premium group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer">
                <Code className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
                <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Learn</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <h2 className="text-2xl font-bold mb-12">API Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { endpoint: "POST /auth/signup", desc: "Create a new user account" },
              { endpoint: "POST /auth/signin", desc: "Authenticate a user" },
              { endpoint: "GET /users/:id", desc: "Retrieve user information" },
              { endpoint: "POST /orgs", desc: "Create a new organization" },
              { endpoint: "GET /orgs/:id/members", desc: "List organization members" },
              { endpoint: "POST /roles", desc: "Create a new role" },
            ].map((api, idx) => (
              <div key={idx} className="card-premium">
                <p className="font-mono text-sm text-primary font-semibold mb-2">{api.endpoint}</p>
                <p className="text-sm text-muted-foreground">{api.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <h2 className="text-2xl font-bold mb-12">SDKs & Libraries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: "JavaScript/TypeScript", desc: "npm install @tsauth/js" },
              { name: "React", desc: "npm install @tsauth/react" },
              { name: "Python", desc: "pip install TSAUTH" },
              { name: "Go", desc: "go get github.com/TSAUTH/go" },
            ].map((sdk, idx) => (
              <div key={idx} className="card-premium">
                <BookOpen className="w-6 h-6 text-primary mb-3" />
                <p className="font-semibold mb-2">{sdk.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{sdk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-12 md:p-16 text-center">
            <h2 className="text-headline mb-4">Ready to integrate?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start building with our comprehensive documentation and examples.
            </p>
            <Button className="btn-primary">
              View Full Docs <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
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
