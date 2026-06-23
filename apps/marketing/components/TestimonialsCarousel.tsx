import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    title: "VP of Security, TechCorp",
    company: "TechCorp",
    quote: "TerraSept Auth transformed our identity infrastructure. We reduced auth-related incidents by 95% and improved developer experience significantly.",
    rating: 5,
    image: "SC",
  },
  {
    id: 2,
    name: "James Mitchell",
    title: "CTO, FinanceFlow",
    company: "FinanceFlow",
    quote: "The multi-tenant architecture is exactly what we needed. Scaling to millions of users was seamless, and compliance became effortless.",
    rating: 5,
    image: "JM",
  },
  {
    id: 3,
    name: "Alex Rodriguez",
    title: "Engineering Lead, HealthTech",
    company: "HealthTech",
    quote: "Outstanding support team and documentation. We went from concept to production in 2 weeks. The API is intuitive and powerful.",
    rating: 5,
    image: "AR",
  },
  {
    id: 4,
    name: "Emma Watson",
    title: "Head of Product, DataVault",
    company: "DataVault",
    quote: "The passwordless authentication features are game-changing. Our users love the frictionless experience, and security improved dramatically.",
    rating: 5,
    image: "EW",
  },
  {
    id: 5,
    name: "David Park",
    title: "Founder, SecureStart",
    company: "SecureStart",
    quote: "Best identity platform we've evaluated. The pricing is transparent, the product is reliable, and the team genuinely cares about customer success.",
    rating: 5,
    image: "DP",
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
    setAutoPlay(false);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setAutoPlay(false);
  };

  return (
    <section className="relative py-20 md:py-28 lg:py-32 mesh-bg">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="mesh-node" />
        ))}
      </div>
      <div className="container">
        <div className="flex flex-col gap-2 mb-16 text-center">
          <p className="text-small text-primary font-medium">TRUSTED BY ENTERPRISES</p>
          <h2 className="text-headline">What Our Customers Say</h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Carousel */}
          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center">
                    {/* Rating */}
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-lg md:text-xl font-medium mb-8 leading-relaxed text-foreground">
                      "{testimonial.quote}"
                    </blockquote>

                    {/* Author */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {testimonial.image}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={prev}
              className="p-2 rounded-lg border border-border hover:border-primary hover:bg-secondary/50 transition-all duration-300"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrent(idx);
                    setAutoPlay(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === current ? "bg-primary w-8" : "bg-border hover:bg-muted-foreground"
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-2 rounded-lg border border-border hover:border-primary hover:bg-secondary/50 transition-all duration-300"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Auto-play indicator */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            {autoPlay ? "Auto-playing" : "Paused"}
          </p>
        </div>
      </div>
    </section>
  );
}
