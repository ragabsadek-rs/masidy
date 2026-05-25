"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production wire to Resend or similar
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">Contact</h1>
        <p className="text-muted-foreground mb-12">We typically respond within 24 hours.</p>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <a href="mailto:hello@masidy.app"
            className="border border-foreground/10 p-4 hover:border-foreground/25 transition-colors duration-150 flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">hello@masidy.app</p>
            </div>
          </a>
          <a href="https://twitter.com/masidyapp" target="_blank" rel="noopener noreferrer"
            className="border border-foreground/10 p-4 hover:border-foreground/25 transition-colors duration-150 flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Twitter / X</p>
              <p className="text-xs text-muted-foreground">@masidyapp</p>
            </div>
          </a>
        </div>

        {sent ? (
          <div className="border border-green-500/20 bg-green-500/5 p-6 text-center">
            <p className="text-sm font-medium text-green-600 mb-1">Message sent</p>
            <p className="text-xs text-muted-foreground">We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required placeholder="Your name"
                  className="w-full h-10 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required placeholder="you@example.com"
                  className="w-full h-10 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Message</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                required rows={5} placeholder="How can we help?"
                className="w-full px-3 py-2.5 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/50 resize-none" />
            </div>
            <button type="submit"
              className="flex items-center gap-2 bg-foreground text-background px-6 h-10 text-sm font-medium hover:bg-foreground/90 transition-colors duration-150 w-fit">
              Send message <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
