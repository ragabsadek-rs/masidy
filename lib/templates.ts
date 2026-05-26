export interface TemplateFile { path: string; content: string; language: string; }
export interface Template { id: string; name: string; description: string; badge: string; files: TemplateFile[]; }

const blankFiles: TemplateFile[] = [
  {
    path: "app/page.tsx",
    language: "typescript",
    content: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <p className="mt-4 text-gray-600">Your Next.js app is ready.</p>
    </main>
  );
}`,
  },
  {
    path: "app/layout.tsx",
    language: "typescript",
    content: `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My App",
  description: "Built with Masidy AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
  },
  {
    path: "app/globals.css",
    language: "css",
    content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`,
  },
  {
    path: "package.json",
    language: "json",
    content: JSON.stringify({ name: "my-app", version: "0.1.0", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "14.2.5", react: "^18", "react-dom": "^18" }, devDependencies: { typescript: "^5", "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18", tailwindcss: "^3", postcss: "^8", autoprefixer: "^10" } }, null, 2),
  },
];

const landingFiles: TemplateFile[] = [
  {
    path: "app/page.tsx",
    language: "typescript",
    content: `export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-32 px-6 text-center bg-gradient-to-b from-slate-50 to-white">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          Build something amazing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          The fastest way to launch your next project. Start building today with our powerful platform.
        </p>
        <div className="flex gap-4">
          <a href="#" className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
            Get started free
          </a>
          <a href="#" className="px-8 py-3 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors">
            Learn more
          </a>
        </div>
      </section>
      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Everything you need</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Fast", desc: "Deploy in seconds with our optimized infrastructure." },
            { title: "Secure", desc: "Enterprise-grade security built in from day one." },
            { title: "Scalable", desc: "Grows with your business from zero to millions." },
          ].map((f) => (
            <div key={f.title} className="p-6 border border-gray-200 rounded-xl">
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* CTA */}
      <section className="py-24 px-6 bg-black text-white text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
        <p className="text-gray-400 mb-10 max-w-xl mx-auto">Join thousands of teams already building with us.</p>
        <a href="#" className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors">
          Start for free
        </a>
      </section>
    </main>
  );
}`,
  },
  {
    path: "app/layout.tsx",
    language: "typescript",
    content: `import type { Metadata } from "next";\nimport "./globals.css";\nexport const metadata: Metadata = { title: "Landing Page", description: "Built with Masidy AI" };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}`,
  },
  { path: "app/globals.css", language: "css", content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;" },
  { path: "package.json", language: "json", content: JSON.stringify({ name: "landing-page", version: "0.1.0", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "14.2.5", react: "^18", "react-dom": "^18" }, devDependencies: { typescript: "^5", "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18", tailwindcss: "^3", postcss: "^8", autoprefixer: "^10" } }, null, 2) },
];

const saasDashboardFiles: TemplateFile[] = [
  {
    path: "components/sidebar.tsx",
    language: "typescript",
    content: `import Link from "next/link";\nexport default function Sidebar() {\n  const links = [{ href: "/", label: "Dashboard" }, { href: "/projects", label: "Projects" }, { href: "/settings", label: "Settings" }, { href: "/billing", label: "Billing" }];\n  return (\n    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col p-6">\n      <div className="text-xl font-bold mb-8">MyApp</div>\n      <nav className="flex flex-col gap-2">\n        {links.map(l => <Link key={l.href} href={l.href} className="px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">{l.label}</Link>)}\n      </nav>\n    </aside>\n  );\n}`,
  },
  {
    path: "app/layout.tsx",
    language: "typescript",
    content: `import type { Metadata } from "next";\nimport "./globals.css";\nimport Sidebar from "@/components/sidebar";\nexport const metadata: Metadata = { title: "SaaS Dashboard", description: "Built with Masidy AI" };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en"><body className="flex bg-gray-50"><Sidebar /><main className="flex-1 p-8">{children}</main></body></html>\n  );\n}`,
  },
  {
    path: "app/page.tsx",
    language: "typescript",
    content: `const stats = [{ label: "Total Users", value: "12,345" }, { label: "Revenue", value: "$48,200" }, { label: "Active Projects", value: "89" }, { label: "Uptime", value: "99.9%" }];\nexport default function Dashboard() {\n  return (\n    <div>\n      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>\n      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">\n        {stats.map(s => (\n          <div key={s.label} className="bg-white p-6 rounded-xl border border-gray-200">\n            <p className="text-sm text-gray-500 mb-1">{s.label}</p>\n            <p className="text-2xl font-bold">{s.value}</p>\n          </div>\n        ))}\n      </div>\n      <div className="bg-white rounded-xl border border-gray-200 p-6">\n        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>\n        <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 border-b"><th className="pb-3">Event</th><th className="pb-3">User</th><th className="pb-3">Time</th></tr></thead>\n        <tbody>{[{ event: "New signup", user: "alice@example.com", time: "2m ago" }, { event: "Payment received", user: "bob@example.com", time: "15m ago" }, { event: "Project created", user: "carol@example.com", time: "1h ago" }].map((r, i) => <tr key={i} className="border-b last:border-0"><td className="py-3">{r.event}</td><td className="py-3 text-gray-600">{r.user}</td><td className="py-3 text-gray-400">{r.time}</td></tr>)}</tbody></table>\n      </div>\n    </div>\n  );\n}`,
  },
  { path: "app/globals.css", language: "css", content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;" },
  { path: "package.json", language: "json", content: JSON.stringify({ name: "saas-dashboard", version: "0.1.0", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "14.2.5", react: "^18", "react-dom": "^18" }, devDependencies: { typescript: "^5", "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18", tailwindcss: "^3", postcss: "^8", autoprefixer: "^10" } }, null, 2) },
];

const restApiFiles: TemplateFile[] = [
  { path: "app/api/hello/route.ts", language: "typescript", content: `import { NextResponse } from "next/server";\nexport async function GET() {\n  return NextResponse.json({ message: "Hello World", timestamp: new Date().toISOString() });\n}` },
  { path: "app/api/items/route.ts", language: "typescript", content: `import { NextRequest, NextResponse } from "next/server";\nconst items: { id: number; name: string; createdAt: string }[] = [];\nlet nextId = 1;\nexport async function GET() {\n  return NextResponse.json(items);\n}\nexport async function POST(req: NextRequest) {\n  const body = await req.json();\n  const item = { id: nextId++, name: body.name ?? "Unnamed", createdAt: new Date().toISOString() };\n  items.push(item);\n  return NextResponse.json(item, { status: 201 });\n}` },
  { path: "app/page.tsx", language: "typescript", content: `const endpoints = [{ method: "GET", path: "/api/hello", desc: "Returns a hello world message" }, { method: "GET", path: "/api/items", desc: "List all items" }, { method: "POST", path: "/api/items", desc: "Create a new item (body: { name: string })" }];\nexport default function Docs() {\n  return (\n    <main className="max-w-3xl mx-auto py-16 px-6">\n      <h1 className="text-3xl font-bold mb-2">API Documentation</h1>\n      <p className="text-gray-600 mb-10">Available endpoints for this REST API.</p>\n      <div className="flex flex-col gap-4">\n        {endpoints.map(e => (\n          <div key={e.path} className="border border-gray-200 rounded-xl p-5">\n            <div className="flex items-center gap-3 mb-2">\n              <span className={\`text-xs font-mono font-bold px-2 py-1 rounded \${e.method === "GET" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}\`}>{e.method}</span>\n              <code className="text-sm font-mono">{e.path}</code>\n            </div>\n            <p className="text-gray-600 text-sm">{e.desc}</p>\n          </div>\n        ))}\n      </div>\n    </main>\n  );\n}` },
  { path: "app/layout.tsx", language: "typescript", content: `import type { Metadata } from "next";\nexport const metadata: Metadata = { title: "REST API", description: "Built with Masidy AI" };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body></html>;\n}` },
  { path: "package.json", language: "json", content: JSON.stringify({ name: "rest-api", version: "0.1.0", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "14.2.5", react: "^18", "react-dom": "^18" }, devDependencies: { typescript: "^5", "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18" } }, null, 2) },
];

const blogFiles: TemplateFile[] = [
  { path: "lib/posts.ts", language: "typescript", content: `export interface Post { id: number; slug: string; title: string; excerpt: string; content: string; date: string; author: string; }\nexport const posts: Post[] = [\n  { id: 1, slug: "getting-started", title: "Getting Started", excerpt: "Learn how to get started with our platform.", content: "Welcome! This guide will walk you through the basics of our platform. First, create an account. Then, set up your first project. Finally, deploy your app with one click.", date: "2024-01-15", author: "Alice" },\n  { id: 2, slug: "advanced-tips", title: "Advanced Tips", excerpt: "Take your skills to the next level.", content: "Once you have the basics down, it is time to explore advanced features. Custom domains, environment variables, and team collaboration are all available on the Pro plan.", date: "2024-02-01", author: "Bob" },\n  { id: 3, slug: "case-study", title: "Customer Case Study", excerpt: "How Acme Corp scaled to 1M users.", content: "Acme Corp started as a small startup and grew to serve over one million users. Here is how they used our platform to scale reliably and cost-effectively.", date: "2024-03-10", author: "Carol" },\n];` },
  { path: "app/page.tsx", language: "typescript", content: `import Link from "next/link";\nimport { posts } from "@/lib/posts";\nexport default function Blog() {\n  return (\n    <main className="max-w-3xl mx-auto py-16 px-6">\n      <h1 className="text-3xl font-bold mb-10">Blog</h1>\n      <div className="flex flex-col gap-8">\n        {posts.map(p => (\n          <article key={p.id} className="border-b border-gray-200 pb-8">\n            <p className="text-sm text-gray-400 mb-2">{p.date} · {p.author}</p>\n            <h2 className="text-xl font-semibold mb-2"><Link href={\`/posts/\${p.slug}\`} className="hover:underline">{p.title}</Link></h2>\n            <p className="text-gray-600 mb-4">{p.excerpt}</p>\n            <Link href={\`/posts/\${p.slug}\`} className="text-sm font-medium text-blue-600 hover:underline">Read more →</Link>\n          </article>\n        ))}\n      </div>\n    </main>\n  );\n}` },
  { path: "app/posts/[slug]/page.tsx", language: "typescript", content: `import { posts } from "@/lib/posts";\nimport { notFound } from "next/navigation";\nexport default function Post({ params }: { params: { slug: string } }) {\n  const post = posts.find(p => p.slug === params.slug);\n  if (!post) notFound();\n  return (\n    <main className="max-w-3xl mx-auto py-16 px-6">\n      <p className="text-sm text-gray-400 mb-2">{post.date} · {post.author}</p>\n      <h1 className="text-3xl font-bold mb-6">{post.title}</h1>\n      <p className="text-gray-700 leading-relaxed">{post.content}</p>\n    </main>\n  );\n}` },
  { path: "app/layout.tsx", language: "typescript", content: `import type { Metadata } from "next";\nimport "./globals.css";\nexport const metadata: Metadata = { title: "Blog", description: "Built with Masidy AI" };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}` },
  { path: "app/globals.css", language: "css", content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;" },
  { path: "package.json", language: "json", content: JSON.stringify({ name: "blog", version: "0.1.0", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "14.2.5", react: "^18", "react-dom": "^18" }, devDependencies: { typescript: "^5", "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18", tailwindcss: "^3", postcss: "^8", autoprefixer: "^10" } }, null, 2) },
];

const ecommerceFiles: TemplateFile[] = [
  { path: "lib/products.ts", language: "typescript", content: `export interface Product { id: number; name: string; price: number; description: string; image: string; }\nexport const products: Product[] = [\n  { id: 1, name: "Wireless Headphones", price: 79.99, description: "Premium sound quality with 30-hour battery life.", image: "https://placehold.co/400x300?text=Headphones" },\n  { id: 2, name: "Mechanical Keyboard", price: 129.99, description: "Tactile switches with RGB backlighting.", image: "https://placehold.co/400x300?text=Keyboard" },\n  { id: 3, name: "USB-C Hub", price: 49.99, description: "7-in-1 hub with 4K HDMI and 100W PD.", image: "https://placehold.co/400x300?text=Hub" },\n  { id: 4, name: "Webcam HD", price: 89.99, description: "1080p webcam with built-in microphone.", image: "https://placehold.co/400x300?text=Webcam" },\n];` },
  { path: "app/page.tsx", language: "typescript", content: `import Link from "next/link";\nimport { products } from "@/lib/products";\nexport default function Store() {\n  return (\n    <main className="max-w-6xl mx-auto py-16 px-6">\n      <h1 className="text-3xl font-bold mb-10">Store</h1>\n      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">\n        {products.map(p => (\n          <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden">\n            <img src={p.image} alt={p.name} className="w-full h-48 object-cover" />\n            <div className="p-4">\n              <h2 className="font-semibold mb-1">{p.name}</h2>\n              <p className="text-gray-600 text-sm mb-3">\${p.price}</p>\n              <Link href={\`/products/\${p.id}\`} className="block text-center py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors">View product</Link>\n            </div>\n          </div>\n        ))}\n      </div>\n    </main>\n  );\n}` },
  { path: "app/products/[id]/page.tsx", language: "typescript", content: `import { products } from "@/lib/products";\nimport { notFound } from "next/navigation";\nexport default function ProductPage({ params }: { params: { id: string } }) {\n  const product = products.find(p => p.id === Number(params.id));\n  if (!product) notFound();\n  return (\n    <main className="max-w-4xl mx-auto py-16 px-6">\n      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">\n        <img src={product.image} alt={product.name} className="w-full rounded-xl" />\n        <div>\n          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>\n          <p className="text-2xl font-semibold mb-6">\${product.price}</p>\n          <p className="text-gray-600 mb-8">{product.description}</p>\n          <button className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">Add to cart</button>\n        </div>\n      </div>\n    </main>\n  );\n}` },
  { path: "app/cart/page.tsx", language: "typescript", content: `export default function Cart() {\n  return (\n    <main className="max-w-3xl mx-auto py-16 px-6">\n      <h1 className="text-3xl font-bold mb-10">Cart</h1>\n      <div className="border border-gray-200 rounded-xl p-8 text-center text-gray-500">\n        <p className="text-lg mb-4">Your cart is empty</p>\n        <a href="/" className="text-blue-600 hover:underline">Continue shopping</a>\n      </div>\n    </main>\n  );\n}` },
  { path: "app/layout.tsx", language: "typescript", content: `import type { Metadata } from "next";\nimport "./globals.css";\nexport const metadata: Metadata = { title: "Store", description: "Built with Masidy AI" };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}` },
  { path: "app/globals.css", language: "css", content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;" },
  { path: "package.json", language: "json", content: JSON.stringify({ name: "ecommerce", version: "0.1.0", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "14.2.5", react: "^18", "react-dom": "^18" }, devDependencies: { typescript: "^5", "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18", tailwindcss: "^3", postcss: "^8", autoprefixer: "^10" } }, null, 2) },
];

export const TEMPLATES: Template[] = [
  { id: "blank", name: "Blank", description: "Empty Next.js 14 App Router project", badge: "Next.js", files: blankFiles },
  { id: "landing-page", name: "Landing Page", description: "Hero, features, and CTA sections", badge: "Next.js + Tailwind", files: landingFiles },
  { id: "saas-dashboard", name: "SaaS Dashboard", description: "Dashboard layout with sidebar and stats", badge: "Next.js + Tailwind", files: saasDashboardFiles },
  { id: "rest-api", name: "REST API", description: "API routes with documentation page", badge: "Next.js API", files: restApiFiles },
  { id: "blog", name: "Blog", description: "Post list and detail pages with static data", badge: "Next.js + Tailwind", files: blogFiles },
  { id: "ecommerce", name: "E-commerce", description: "Product grid, detail, and cart pages", badge: "Next.js + Tailwind", files: ecommerceFiles },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
