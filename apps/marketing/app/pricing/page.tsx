"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Pricing() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const plans = [
    {
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "For small teams",
      features: [
        "Up to 10,000 users",
        "Basic authentication",
        "Email support",
        "Single organization",
        "API access",
      ],
      cta: "Start Free",
    },
    {
      name: "Professional",
      price: "$499",
      period: "/month",
      description: "For growing companies",
      features: [
        "Up to 100,000 users",
        "Advanced authentication",
        "Priority support",
        "Multi-organization",
        "Advanced API",
        "Custom branding",
        "SSO",
      ],
      cta: "Start Free",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large organizations",
      features: [
        "Unlimited users",
        "Full feature set",
        "Dedicated support",
        "SLA guarantee",
        "Custom integration",
        "On-premise option",
        "Advanced security",
      ],
      cta: "Contact Sales",
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
            <Link href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Features</Link>
            <Link href="/pricing" className="text-sm text-primary font-medium">Pricing</Link>
            <Link href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Security</Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Docs</Link>
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
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-small text-primary font-medium mb-4">PRICING</p>
            <h1 className="text-headline font-bold mb-6">Simple, transparent pricing</h1>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your needs. All plans include a 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-20 md:py-28">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`card-premium transition-all duration-300 flex flex-col ${
                  plan.featured
                    ? "ring-2 ring-primary md:scale-105 hover:shadow-2xl hover:shadow-primary/20"
                    : "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary px-4 py-1 rounded-full">
                    <p className="text-xs font-semibold text-primary-foreground">MOST POPULAR</p>
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <Button className={`w-full mb-8 ${plan.featured ? "btn-primary" : "btn-secondary"}`}>
                  {plan.cta}
                </Button>

                <div className="space-y-4 flex-1">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-headline font-bold mb-12 text-center">Frequently asked questions</h2>
            <div className="space-y-6">
              {[
                { q: "Can I change plans anytime?", a: "Yes, upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle." },
                { q: "What payment methods do you accept?", a: "We accept all major credit cards, wire transfer, and ACH for enterprise customers." },
                { q: "Is there a free trial?", a: "Yes, all plans include a 14-day free trial with full feature access." },
                { q: "Do you offer discounts for annual billing?", a: "Yes, annual billing includes a 20% discount on all plans." },
              ].map((item, idx) => (
                <div key={idx} className="card-premium">
                  <p className="font-semibold mb-2">{item.q}</p>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 border-t border-border">
        <div className="container">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-12 md:p-16 text-center">
            <h2 className="text-headline mb-4">Ready to get started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your 14-day free trial today. No credit card required.
            </p>
            <Button className="btn-primary">
              Start Free <ArrowRight className="w-4 h-4 ml-2" />
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
