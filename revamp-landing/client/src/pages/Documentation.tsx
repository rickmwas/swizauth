import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Terminal, Code, BookOpen, Key, Server, Copy, CheckSquare, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRegisterUrl } from "@/const";

export default function Documentation() {
  const [activeApi, setActiveApi] = useState<number>(0);
  const [copied, setCopied] = useState<string | null>(null);

  const sdkOptions = [
    { 
      name: "Next.js / React SDK", 
      pkg: "@tsauth/nextjs",
      cmd: "npm install @tsauth/nextjs", 
      desc: "Edge-compatible session hooks, path protection middleware, and React context hooks." 
    },
    { 
      name: "Go Identity Driver", 
      pkg: "github.com/terrasept/tsauth-go",
      cmd: "go get github.com/terrasept/tsauth-go", 
      desc: "Local asymmetric token validation and session parsing routines for high-speed Gin/Chi APIs." 
    },
    { 
      name: "Node.js Express Driver", 
      pkg: "@tsauth/express",
      cmd: "npm install @tsauth/express", 
      desc: "Standard express cookie-parsing and session authentication routes validation guards." 
    },
    { 
      name: "Python FastAPI Module", 
      pkg: "tsauth-fastapi",
      cmd: "pip install tsauth-fastapi", 
      desc: "FastAPI dependencies injections implementing local RS256 token verification and claims checks." 
    }
  ];

  const apiEndpoints = [
    { 
      method: "POST", 
      route: "/api/v1/auth/register", 
      desc: "Register a new user identity matching composite constraints (org_id + email).",
      payload: `{
  "email": "user@company.com",
  "username": "new_developer",
  "password": "HighEntropyPassword123!",
  "organization_id": "org_7a8b9c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d"
}`,
      response: `{
  "success": true,
  "message": "Registration successful",
  "user_id": "90e6e765-b1a9-4672-881b-a9a3b610c1c8"
}`
    },
    { 
      method: "POST", 
      route: "/api/v1/auth/login", 
      desc: "Authenticate password credentials (Argon2id) and issue signed access and refresh tokens.",
      payload: `{
  "email": "user@company.com",
  "password": "HighEntropyPassword123!",
  "organization_id": "org_7a8b9c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d"
}`,
      response: `{
  "success": true,
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "ref_8a9b0c...",
  "expires_in": 900
}`
    },
    { 
      method: "POST", 
      route: "/api/v1/auth/refresh", 
      desc: "Rotate the current refresh token and issue a fresh access/refresh token pair.",
      payload: `{
  "refresh_token": "ref_8a9b0c..."
}`,
      response: `{
  "success": true,
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "ref_9c0d1e...",
  "expires_in": 900
}`
    },
    { 
      method: "POST", 
      route: "/api/v1/mfa/enable", 
      desc: "Generate high-entropy secret TOTP configurations, base64 QR code and recovery codes.",
      payload: `{
  "user_id": "90e6e765-b1a9-4672-881b-a9a3b610c1c8"
}`,
      response: `{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code_base64": "data:image/png;base64,...",
  "recovery_codes": ["abcd-efgh", "ijkl-mnop"]
}`
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        {/* Section 1: Hero */}
        <section className="py-20 md:py-28 border-b border-border bg-[#02050c] relative">
          <div className="container mx-auto px-6 max-w-3xl">
            <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
              Developer Docs
            </p>
            <h1 className="text-display font-display font-bold text-foreground mb-6">
              Integration & API Reference
            </h1>
            <p className="text-subheadline text-muted-foreground">
              Reference specifications for SDK setups, OAuth variables, and core REST API JSON schemas.
            </p>
          </div>
        </section>

        {/* Section 2: SDK Installation Directory */}
        <section className="py-24 border-b border-border bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-headline font-display font-bold mb-12">
              Official SDK Libraries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sdkOptions.map((sdk, idx) => (
                <div key={idx} className="border border-border bg-[#050914] p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Terminal className="w-5 h-5 text-primary" />
                      <h3 className="text-base font-display font-bold text-foreground">{sdk.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-sans">
                      {sdk.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-border/80 font-mono text-xs">
                    <code className="text-primary font-bold">{sdk.cmd}</code>
                    <button
                      onClick={() => handleCopy(sdk.cmd, `sdk-${idx}`)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {copied === `sdk-${idx}` ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: REST API Interactive Playground */}
        <section className="py-24 border-b border-border bg-[#02050c]">
          <div className="container mx-auto px-6">
            <h2 className="text-headline font-display font-bold mb-12 text-center">
              Core Identity HTTP Endpoints
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
              {/* Endpoint selection */}
              <div className="lg:col-span-5 space-y-3 font-mono text-xs">
                {apiEndpoints.map((api, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveApi(idx)}
                    className={`w-full text-left p-4 rounded-lg border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      activeApi === idx
                        ? "border-primary/50 bg-[#080e1e] text-foreground font-semibold"
                        : "border-border text-muted-foreground hover:bg-[#050914] hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] rounded font-bold">
                        {api.method}
                      </span>
                      <span className="text-[11px] truncate">{api.route}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Payload/Response Display */}
              <div className="lg:col-span-7 border border-border bg-black rounded-xl overflow-hidden font-mono text-xs shadow-2xl">
                <div className="px-4 py-3 bg-[#080d19] border-b border-border flex items-center justify-between text-muted-foreground">
                  <span>HTTP Schema: {apiEndpoints[activeApi].route}</span>
                  <button
                    onClick={() => handleCopy(apiEndpoints[activeApi].payload, "payload")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                  >
                    {copied === "payload" ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    <span>Copy JSON</span>
                  </button>
                </div>

                <div className="p-4 bg-[#040710] border-b border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">Request Parameters Payload</span>
                  <pre className="text-foreground/90 overflow-x-auto leading-relaxed">
                    <code>{apiEndpoints[activeApi].payload}</code>
                  </pre>
                </div>

                <div className="p-4 bg-[#020408]">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">Success Response Contract</span>
                  <pre className="text-primary font-bold overflow-x-auto leading-relaxed">
                    <code>{apiEndpoints[activeApi].response}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: CTA */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="border border-border/80 bg-[#02050c] rounded-2xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-headline font-display font-bold mb-4">
                Ready to configure client credentials?
              </h2>
              <p className="text-body text-muted-foreground mb-8 max-w-xl mx-auto">
                Create a sandbox developer account, register your web application, and generate client ID parameters instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={getRegisterUrl()} className="w-full sm:w-auto">
                  <Button className="btn-primary w-full flex items-center justify-center gap-2">
                    Create Sandbox Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button className="btn-secondary w-full">
                    Schedule Integration Audit
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
