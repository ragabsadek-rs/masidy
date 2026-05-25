import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Blog — Masidy" };

const posts = [
  {
    slug: "introducing-masidy",
    title: "Introducing Masidy — Describe it. We build it.",
    date: "May 25, 2025",
    excerpt: "Today we're launching Masidy, an AI-powered app builder that turns a single sentence into a live, production-ready application.",
    readTime: "3 min read",
  },
  {
    slug: "how-credits-work",
    title: "How the Masidy credit system works",
    date: "May 25, 2025",
    excerpt: "Credits are the currency of Masidy. Here's everything you need to know about how they work, how much things cost, and how to get the most value.",
    readTime: "2 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">Blog</h1>
        <p className="text-muted-foreground mb-12">Updates, guides, and stories from the Masidy team.</p>
        <div className="flex flex-col gap-0 border border-foreground/10">
          {posts.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className={`flex flex-col gap-2 px-6 py-6 hover:bg-foreground/[0.02] transition-colors duration-150 group ${i < posts.length - 1 ? "border-b border-foreground/10" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">{post.date}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs font-mono text-muted-foreground">{post.readTime}</span>
              </div>
              <h2 className="text-lg font-medium group-hover:text-foreground transition-colors duration-150">{post.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
              <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-150 mt-1">
                Read more <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
