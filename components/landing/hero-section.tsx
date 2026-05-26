"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AnimatedSphere } from "./animated-sphere";

const words = ["create", "build", "scale", "ship"];

const CHIPS = [
  { label: "SaaS Dashboard", prompt: "Build a SaaS dashboard with authentication and analytics" },
  { label: "Chat App", prompt: "Create a real-time chat app with rooms and user presence" },
  { label: "Invoice Tool", prompt: "Build an invoice generator with PDF export and payment tracking" },
  { label: "Kanban Board", prompt: "Create a Kanban project management board with drag and drop" },
  { label: "E-commerce", prompt: "Build an e-commerce store with Stripe checkout and inventory" },
  { label: "Portfolio", prompt: "Create a developer portfolio with project showcase and blog" },
];

const PLACEHOLDERS = [
  "A SaaS dashboard with auth, charts, and team management...",
  "A real-time chat app with rooms and user presence indicators...",
  "An e-commerce store with Stripe checkout and inventory tracking...",
  "An invoice generator with PDF export and payment status...",
  "A Kanban board with drag and drop and team collaboration...",
];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const phState = useRef({ pi: 0, ci: 0, del: false });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Typing placeholder animation
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function typePh() {
      const el = textareaRef.current;
      if (!el) return;
      if (el === document.activeElement) { timer = setTimeout(typePh, 200); return; }
      const { pi, ci, del } = phState.current;
      const t = PLACEHOLDERS[pi];
      if (!del) {
        const next = ci + 1;
        el.placeholder = t.slice(0, next);
        if (next >= t.length) {
          phState.current = { pi, ci: next, del: true };
          timer = setTimeout(typePh, 2200);
        } else {
          phState.current = { pi, ci: next, del: false };
          timer = setTimeout(typePh, 52);
        }
      } else {
        const next = ci - 1;
        el.placeholder = t.slice(0, next);
        if (next <= 0) {
          phState.current = { pi: (pi + 1) % PLACEHOLDERS.length, ci: 0, del: false };
        } else {
          phState.current = { pi, ci: next, del: true };
        }
        timer = setTimeout(typePh, 28);
      }
    }
    timer = setTimeout(typePh, 1400);
    return () => clearTimeout(timer);
  }, []);

  function setPrompt(text: string) {
    if (textareaRef.current) {
      textareaRef.current.value = text;
      textareaRef.current.focus();
    }
  }

  function handlePrompt() {
    const v = textareaRef.current?.value.trim();
    if (!v) return;
    window.location.href = "/builder?prompt=" + encodeURIComponent(v);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePrompt();
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Animated sphere background */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] opacity-40 pointer-events-none">
        <AnimatedSphere />
      </div>

      {/* Subtle grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-foreground/10"
            style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-foreground/10"
            style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-24 lg:pt-28 pb-16 flex-1">
        {/* Eyebrow */}
        <div
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
            <span className="w-8 h-px bg-foreground/30" />
            AI-powered app builder · Live in &lt;60s
          </span>
        </div>

        {/* Main headline */}
        <div className="mb-8">
          <h1
            className={`text-[clamp(2.5rem,9vw,7rem)] font-display leading-[0.9] tracking-tight transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="block">Describe it.</span>
            <span className="block">
              We{" "}
              <span className="relative inline-block">
                <span key={wordIndex} className="inline-flex">
                  {words[wordIndex].split("").map((char, i) => (
                    <span
                      key={`${wordIndex}-${i}`}
                      className="inline-block animate-char-in"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-foreground/10" />
              </span>
              {" "}it.
            </span>
          </h1>
        </div>

        {/* ── AI Prompt Box ── */}
        <div
          className={`transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="w-full border border-foreground/10 rounded-2xl bg-background/60 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <textarea
                ref={textareaRef}
                rows={3}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none resize-none text-xl text-foreground placeholder:text-muted-foreground/40 font-sans leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-foreground/8 bg-foreground/[0.02]">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Masidy AI
                </span>
                <span className="w-px h-3 bg-foreground/15 shrink-0" />
                {CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setPrompt(chip.prompt)}
                    className="text-xs font-mono text-muted-foreground border border-foreground/10 rounded-full px-2.5 py-1 hover:border-foreground/25 hover:text-foreground hover:bg-foreground/5 transition-all duration-150 whitespace-nowrap hidden sm:inline-flex"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePrompt}
                className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors shrink-0 ml-4"
              >
                Build it
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile chips */}
          <div className="flex flex-wrap gap-2 mt-3 sm:hidden">
            {CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => setPrompt(chip.prompt)}
                className="text-xs font-mono text-muted-foreground border border-foreground/10 rounded-full px-3 py-1.5 hover:border-foreground/25 hover:text-foreground hover:bg-foreground/5 transition-all duration-150 whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats marquee — flows naturally below content with generous spacing */}
      <div
        className={`relative z-10 w-full pb-12 transition-all duration-700 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top separator */}
        <div className="w-full h-px bg-foreground/6 mb-10" />

        <div className="flex gap-16 marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {[
                { value: "20 days", label: "saved on average build time" },
                { value: "98%", label: "faster deployment speed" },
                { value: "300%", label: "throughput increase" },
                { value: "6x", label: "faster to ship" },
              ].map((stat) => (
                <div key={`${stat.label}-${i}`} className="flex items-baseline gap-4">
                  <span className="text-4xl lg:text-5xl font-display">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
