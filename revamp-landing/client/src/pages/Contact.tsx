import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Clock, Loader2, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationError) setValidationError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple inline validation check
    if (!formData.name || !formData.email || !formData.message) {
      setValidationError("Please fill in all required parameters (Name, Email, Message).");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Simulate API submit latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", company: "", message: "" });
    } catch (err) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        {/* Section 1: Hero */}
        <section className="py-20 md:py-28 border-b border-border bg-[#02050c] relative">
          <div className="container mx-auto px-6 max-w-3xl">
            <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest mb-3">
              Contact Sales
            </p>
            <h1 className="text-display font-display font-bold text-foreground mb-6">
              Connect with Platform Engineers
            </h1>
            <p className="text-subheadline text-muted-foreground">
              Request a security audit, dedicated PostgreSQL connection pool specifications, or custom enterprise SLAs.
            </p>
          </div>
        </section>

        {/* Section 2: Contact Form & Info Grid */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
              {/* Form panel */}
              <div className="lg:col-span-7 border border-border bg-[#050914] p-8 rounded-xl shadow-xl">
                <form className="space-y-6" onSubmit={handleFormSubmit}>
                  {validationError && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-xs text-destructive font-mono">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {submitStatus === "success" && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-500 font-mono">
                      Request logged successfully. An identity engineer will review your variables shortly.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-muted-foreground uppercase mb-2">
                        Full Name *
                      </label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        placeholder="Enter name"
                        className="bg-background border-border text-foreground focus:ring-primary focus:border-primary font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-semibold text-muted-foreground uppercase mb-2">
                        Work Email *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        placeholder="you@company.com"
                        className="bg-background border-border text-foreground focus:ring-primary focus:border-primary font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-muted-foreground uppercase mb-2">
                      Company Name
                    </label>
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="Organization"
                      className="bg-background border-border text-foreground focus:ring-primary focus:border-primary font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-muted-foreground uppercase mb-2">
                      Message Payload *
                    </label>
                    <Textarea
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="Describe your multi-tenant auth requirements or deployment timelines..."
                      className="bg-background border-border text-foreground focus:ring-primary focus:border-primary font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 text-xs py-2.5 px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                        <span>Transmitting payload...</span>
                      </>
                    ) : (
                      <span>Submit Request</span>
                    )}
                  </Button>
                </form>
              </div>

              {/* Side Info */}
              <div className="lg:col-span-5 space-y-6">
                <div className="border border-border bg-[#050914] p-6 rounded-xl space-y-6 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Security Team</h4>
                      <p className="text-muted-foreground font-sans mt-0.5">security@terrasept.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Operations Office</h4>
                      <p className="text-muted-foreground font-sans mt-0.5">+234 (1) 420-8080</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Response Parameters</h4>
                      <p className="text-muted-foreground font-sans mt-0.5">Scale & Enterprise tiers responded in &lt;4h.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
