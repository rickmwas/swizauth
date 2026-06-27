import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Lock, Shield, Users, Database, Key, Check, Code, ShieldCheck, ChevronRight, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRegisterUrl } from "@/const";

export default function Features() {
  const [selectedRole, setSelectedRole] = useState<"admin" | "auditor" | "member">("admin");

  const rbacMappings = {
    admin: {
      role: "organization_admin",
      desc: "Controls member invitations, role bindings, and client application secrets.",
      permissions: ["users.read", "users.write", "organizations.manage", "audit_logs.read", "api_keys.manage"]
    },
    auditor: {
      role: "security_auditor",
      desc: "ReadOnly security analysis role. Accesses logs and rate limiting parameters.",
      permissions: ["users.read", "audit_logs.read"]
    },
    member: {
      role: "organization_member",
      desc: "Standard user account. Modifies profile and validates local sessions.",
      permissions: ["users.read"]
    }
  };

  const featureSpecs = [
    {
      title: "Identity Engine Core",
      desc: "Highly-performant auth functions written in Go, optimized for minimal latency. Handles session validation, password verifications, and tokens cycle.",
      items: [
        "Argon2id password hash checking",
        "RS256 cryptographically signed JWT access tokens",
        "Database-backed rotating refresh tokens",
        "MFA TOTP configuration verification & QR codes",
        "Token bucket rate limiting backend by Redis",
        "Active session blacklists in local Redis nodes"
      ]
    },
    {
      title: "Isolated Multi-Tenancy",
      desc: "Isolation is enforced throughout the entire system. Database constraints, indexing, API filters, and session claims are partitioned using UUIDv7 organisation IDs.",
      items: [
        "Rigid organization_id logical partition on all tables",
        "Organization member invite/accept join loops",
        "Support for tenant-specific permissions & profiles",
        "Workspace switching actions within same token scope",
        "Clean composite uniqueness keys (org_id + email)"
      ]
    },
    {
      title: "Fine-Grained Authorization",
      desc: "Define roles and assign permissions dynamically. Middleware guards validate claims locally to protect endpoint boundaries.",
      items: [
        "Granular Role-Based Access Control (RBAC)",
        "Token claims caching to minimize database roundtrips",
        "Scoped API credentials for machine-to-machine auth",
        "System wide permissions configuration tables"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        {/* Section 1: Hero */}
        <section className="py-20 md:py-28 border-b border-border bg-[#02050c] relative">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
                System Specification
              </p>
              <h1 className="text-display font-display font-bold text-foreground mb-6">
                Engineered Capabilities
              </h1>
              <p className="text-subheadline text-muted-foreground">
                TSAUTH separates high-performance identity actions from administration routes. Explore the technical core of the platform.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Detailed Capabilities Grid */}
        <section className="py-24 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {featureSpecs.map((spec, idx) => (
                <div key={idx} className="border border-border bg-[#050914] p-8 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-display font-semibold mb-4 text-foreground">
                      {spec.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-sans">
                      {spec.desc}
                    </p>
                    <ul className="space-y-3 font-mono text-xs text-muted-foreground">
                      {spec.items.map((item, fidx) => (
                        <li key={fidx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: RBAC Hierarchy Interactive Spec */}
        <section className="py-24 border-b border-border bg-[#02050c]">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div>
                  <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
                    RBAC Architecture
                  </p>
                  <h2 className="text-headline font-display font-bold">
                    Granular Access Control Policies
                  </h2>
                </div>
                <p className="text-body text-muted-foreground">
                  Our authorization engine matches user session claims to permission bounds. Define custom roles containing specific, scoped API rights.
                </p>

                {/* Role Toggles */}
                <div className="flex gap-2 font-mono text-xs">
                  {["admin", "auditor", "member"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role as any)}
                      className={`px-3 py-2 rounded-lg border transition-colors cursor-pointer capitalize ${
                        selectedRole === role
                          ? "border-primary/50 bg-[#080e1e] text-foreground font-semibold"
                          : "border-border text-muted-foreground hover:bg-[#050914] hover:text-foreground"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* RBAC Visualization Box */}
              <div className="lg:col-span-7 font-mono border border-border bg-black rounded-xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Interactive Permission Mapping Matrix</span>
                </div>
                
                <div className="space-y-6">
                  {/* Step 1: User Role Mapping */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-[#050914] border border-border rounded-lg">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                        Active Role Binding
                      </span>
                      <span className="text-xs text-foreground font-bold font-mono">
                        role_name: <b className="text-primary">{rbacMappings[selectedRole].role}</b>
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground max-w-xs leading-normal">
                      {rbacMappings[selectedRole].desc}
                    </div>
                  </div>

                  <div className="flex justify-center my-2 text-muted-foreground">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>

                  {/* Step 2: Permissions output */}
                  <div className="p-4 bg-[#050914] border border-border rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-3">
                      Scoped Permissions Claims Injected in JWT
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {rbacMappings[selectedRole].permissions.map((perm) => (
                        <span key={perm} className="px-2.5 py-1 bg-background border border-border/80 text-primary rounded text-xs">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Database Partition Schema */}
        <section className="py-24 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1">
                <div className="border border-border/80 bg-card rounded-xl overflow-hidden font-mono shadow-xl">
                  <div className="px-4 py-3 bg-[#080d19] border-b border-border flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      PostgreSQL DDL Spec (auth.users)
                    </span>
                  </div>
                  <pre className="p-6 text-[10px] md:text-xs text-foreground/80 overflow-x-auto leading-relaxed bg-[#03060c]">
                    <code>{`CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Tenant isolation uniqueness key
    CONSTRAINT unique_tenant_email UNIQUE (organization_id, email),
    CONSTRAINT unique_tenant_username UNIQUE (organization_id, username)
);

CREATE INDEX idx_users_org ON auth.users(organization_id);
CREATE INDEX idx_users_email ON auth.users(email);`}</code>
                  </pre>
                </div>
              </div>

              <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col gap-6">
                <div>
                  <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
                    Relational Schema Rules
                  </p>
                  <h2 className="text-headline font-display font-bold">
                    Database-Enforced Tenant Isolation
                  </h2>
                </div>
                <p className="text-body text-muted-foreground">
                  Our system architecture mandates that every record maps to a tenant. Compound indexes verify identity scopes, preventing performance degradation and enforcing integrity.
                </p>
                <ul className="space-y-3 text-xs font-mono text-muted-foreground">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Composite uniqueness on (org_id, email)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Indexed organization_id foreign keys</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Strict soft-delete check logic</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: CTA */}
        <section className="py-24 bg-[#02050c]">
          <div className="container mx-auto px-6">
            <div className="border border-border/80 bg-background rounded-2xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-headline font-display font-bold mb-4">
                Integrate robust multi-tenant authorization
              </h2>
              <p className="text-body text-muted-foreground mb-8 max-w-xl mx-auto">
                Implement production-ready RBAC, strict tenant separation, and high-performance credential hashing in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={getRegisterUrl()} className="w-full sm:w-auto">
                  <Button className="btn-primary w-full flex items-center justify-center gap-2">
                    Create Sandbox Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Link href="/docs" className="w-full sm:w-auto">
                  <Button className="btn-secondary w-full">
                    Read SDK References
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
