"use client";

import { ArrowRight, Calendar, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const blogPosts = [
  {
    id: 1,
    title: "Zero Trust Architecture: The Future of Enterprise Security",
    excerpt: "Explore how zero trust principles are transforming enterprise identity infrastructure and why adoption is critical for modern organizations.",
    author: "Sarah Chen",
    date: "June 8, 2026",
    category: "Security",
    readTime: "8 min read",
  },
  {
    id: 2,
    title: "Passwordless Authentication: Why It's Time to Move On",
    excerpt: "Passwords are dead. Learn why passwordless authentication is the future and how to implement it securely in your applications.",
    author: "James Mitchell",
    date: "June 1, 2026",
    category: "Authentication",
    readTime: "6 min read",
  },
  {
    id: 3,
    title: "Multi-Tenant SaaS: Authorization Best Practices",
    excerpt: "Building secure multi-tenant applications requires careful authorization design. We share proven patterns and anti-patterns from enterprise deployments.",
    author: "Alex Rodriguez",
    date: "May 25, 2026",
    category: "Authorization",
    readTime: "10 min read",
  },
  {
    id: 4,
    title: "GDPR Compliance: A Technical Guide for Developers",
    excerpt: "Navigate GDPR requirements with practical guidance on data handling, consent management, and audit logging for your identity platform.",
    author: "Emma Watson",
    date: "May 18, 2026",
    category: "Compliance",
    readTime: "12 min read",
  },
  {
    id: 5,
    title: "API Security: Protecting Your Identity Infrastructure",
    excerpt: "Secure your APIs with rate limiting, token validation, and encryption. Learn the essential security practices for identity platforms.",
    author: "David Park",
    date: "May 11, 2026",
    category: "Security",
    readTime: "9 min read",
  },
  {
    id: 6,
    title: "Case Study: How Enterprise X Reduced Auth Costs by 60%",
    excerpt: "See how a Fortune 500 company optimized their identity infrastructure and achieved significant cost savings with TerraSept Auth.",
    author: "Lisa Johnson",
    date: "May 4, 2026",
    category: "Case Study",
    readTime: "7 min read",
  },
];

export default function Blog() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setSuccess(true);
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <img
              src="/manus-storage/ChatGPTImageJun10,2026,12_12_00AM_0a66c4f7.png"
              alt="TerraSept Auth"
              className="h-10 w-auto"
            />
            TerraSept Auth
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/features" className="text-foreground/70 hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-foreground/70 hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/security" className="text-foreground/70 hover:text-foreground transition-colors">
              Security
            </Link>
            <Link href="/docs" className="text-foreground/70 hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/about" className="text-foreground/70 hover:text-foreground transition-colors">
              About
            </Link>
            <button className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg transition-all">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 md:py-28 lg:py-32 mesh-bg">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="mesh-node" />
          ))}
        </div>
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-small text-primary font-medium mb-4">INSIGHTS & UPDATES</p>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Security Insights for Enterprise Builders
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Expert perspectives on identity infrastructure, security best practices, and real-world implementation strategies.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="relative py-20 md:py-28 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="group bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-28 lg:py-32 bg-secondary/30 mesh-bg">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="mesh-node" />
          ))}
        </div>
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Stay Updated on Security</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest insights on enterprise identity infrastructure and security best practices.
          </p>
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
            {success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg p-4 mb-4 font-medium animate-in fade-in">
                Thanks for subscribing! Check your inbox for a welcome email.
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <input
                    type="email"
                    required
                    disabled={loading}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-6 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
                {error && (
                  <p className="text-destructive text-sm mt-2 text-center animate-in fade-in">{error}</p>
                )}
              </>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border py-16 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <img
                src="/manus-storage/ChatGPTImageJun10,2026,12_12_00AM_0a66c4f7.png"
                alt="TerraSept Auth"
                className="h-10 w-auto mb-4"
              />
              <p className="text-sm text-muted-foreground">Enterprise identity infrastructure built for trust.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Developers</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API Reference</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">SDKs</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 TerraSept Auth. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
