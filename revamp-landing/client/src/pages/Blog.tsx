import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, User, Search, ArrowRight, Rss } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const blogPosts = [
  {
    id: 1,
    title: "Tuning Argon2id Parameters for Enterprise Auth Services",
    excerpt: "A technical dive into memory cost (m), iteration count (t), and parallelism (p) thresholds to protect identities against GPU-based password cracking.",
    author: "Sarah Chen",
    date: "June 25, 2026",
    category: "Cryptography",
    readTime: "8 min read",
  },
  {
    id: 2,
    title: "Refresh Token Rotation (RTR): Mitigating Replay Attacks",
    excerpt: "How to implement rotating refresh cycles with atomic database operations and instant revocation states inside high-throughput Redis databases.",
    author: "James Mitchell",
    date: "June 18, 2026",
    category: "Authentication",
    readTime: "6 min read",
  },
  {
    id: 3,
    title: "Logical Tenant Isolation: Partitioning PostgreSQL at Scale",
    excerpt: "Designing composite database indices and structuring NestJS/Go ORMs to enforce organization_id isolation boundaries safely.",
    author: "Alex Rodriguez",
    date: "May 25, 2026",
    category: "Database Design",
    readTime: "10 min read",
  },
  {
    id: 4,
    title: "Token Buckets rate limiters utilizing Redis & Gin middleware",
    excerpt: "Implementing low-latency rate checks at the entry gate of Go servers. Performance traces showing sub-millisecond evaluation cycles.",
    author: "David Park",
    date: "May 11, 2026",
    category: "Operations",
    readTime: "9 min read",
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        {/* Section 1: Hero */}
        <section className="py-20 md:py-28 border-b border-border bg-[#02050c] relative">
          <div className="container mx-auto px-6 max-w-3xl">
            <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
              Engineering Blog
            </p>
            <h1 className="text-display font-display font-bold text-foreground mb-6">
              Identity & Cryptography Specifications
            </h1>
            <p className="text-subheadline text-muted-foreground">
              Deep dives into key derivation parameters, asymmetric credentials validation, and multi-tenant database scaling choices.
            </p>
          </div>
        </section>

        {/* Section 2: Articles Directory */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {blogPosts.map((post) => (
                <div key={post.id} className="border border-border bg-[#050914] p-8 rounded-xl flex flex-col justify-between hover:border-primary/45 transition-all">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-4">
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded font-bold uppercase">
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                    
                    <h3 className="text-lg font-display font-bold text-foreground mb-3 leading-tight">
                      {post.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-mono">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="border-t border-border/60 pt-4 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
