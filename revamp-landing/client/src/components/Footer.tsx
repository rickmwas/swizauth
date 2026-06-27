import { Link } from "wouter";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="relative border-t border-border py-16 bg-[#02050c]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div>
            <p className="text-xs font-semibold text-primary mb-4 tracking-wider uppercase">Product</p>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Security
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary mb-4 tracking-wider uppercase">Developers</p>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  SDK Ecosystem
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary mb-4 tracking-wider uppercase">Company</p>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Technical Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary mb-4 tracking-wider uppercase">Legal</p>
            <ul className="space-y-3">
              <li>
                <Link href="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Contact Sales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 TerraSept Auth. Engineered for mission-critical infrastructure.
          </p>
        </div>
      </div>
    </footer>
  );
}
