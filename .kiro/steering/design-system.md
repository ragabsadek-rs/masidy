# Masidy Design System

This is the global design language for **all** pages, dashboards, chat interfaces, IDEs, and any other surface in the Masidy product. Every new component, page, or feature must follow these rules exactly. Do not introduce new design patterns without updating this file.

---

## Brand

- **Product name:** Masidy (lowercase `masidy` in logo, with a blue `.` after it)
- **Tagline:** Describe it. We build it.
- **Voice:** Direct, confident, minimal. No filler words.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4 with `@theme inline` tokens
- **Components:** shadcn/ui (already installed in `components/ui/`)
- **Fonts:** Instrument Sans (sans), Instrument Serif (display/headings), JetBrains Mono (mono/code)
- **Icons:** lucide-react only — do not add other icon libraries
- **Animations:** CSS keyframes defined in `globals.css`, plus `tw-animate-css`

---

## Color Tokens

Always use these Tailwind semantic tokens — never hardcode hex or rgb values.

| Token | Usage |
|---|---|
| `bg-background` | Page background (warm off-white) |
| `text-foreground` | Primary text (near-black) |
| `text-muted-foreground` | Secondary/supporting text |
| `bg-foreground` / `text-background` | Inverted (dark button, dark section) |
| `border-foreground/10` | Subtle borders |
| `border-foreground/20` | Visible borders |
| `bg-foreground/[0.02]` | Very subtle tinted backgrounds |
| `bg-foreground/5` | Hover states on ghost elements |
| `text-blue-500` | Brand accent (logo dot, AI pulse dot, links) |
| `bg-green-500` | Status indicators (operational, success) |

**Never use:** arbitrary color values like `bg-[#1a6aff]` or inline `style={{ color: '...' }}` for colors.

---

## Typography

### Font Roles

```
font-display   → Instrument Serif  → Hero headlines, section titles, large numbers
font-sans      → Instrument Sans   → Body text, UI labels, buttons
font-mono      → JetBrains Mono    → Code, eyebrow labels, metadata, badges
```

### Scale

| Use | Class |
|---|---|
| Hero headline | `text-[clamp(3rem,12vw,10rem)] font-display leading-[0.9] tracking-tight` |
| Section title | `text-4xl lg:text-6xl font-display tracking-tight` |
| Card title | `text-2xl lg:text-3xl font-display` |
| Body large | `text-xl lg:text-2xl text-muted-foreground leading-relaxed` |
| Body | `text-base leading-relaxed` |
| Small / meta | `text-sm text-muted-foreground` |
| Eyebrow label | `text-xs font-mono text-muted-foreground tracking-widest uppercase` |
| Code / badge | `text-xs font-mono` |

### Eyebrow Pattern

Every section starts with an eyebrow label above the title:

```tsx
<span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
  <span className="w-8 h-px bg-foreground/30" />
  Section name
</span>
```

---

## Spacing & Layout

- **Max content width:** `max-w-[1400px] mx-auto px-6 lg:px-12`
- **Section vertical padding:** `py-24 lg:py-32` (standard) or `py-32 lg:py-40` (hero/cta)
- **Section gap (header → content):** `mb-16 lg:mb-24`
- **Card internal padding:** `p-6` (compact) or `p-8 lg:p-12` (spacious)
- **Grid gaps:** `gap-8`, `gap-12 lg:gap-24` for two-column layouts

---

## Component Patterns

### Buttons

```tsx
// Primary (dark fill)
<Button className="bg-foreground hover:bg-foreground/90 text-background px-8 h-12 text-sm rounded-full group">
  Label <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
</Button>

// Ghost / outline
<Button variant="outline" className="h-12 px-8 text-sm rounded-full border-foreground/20 hover:bg-foreground/5">
  Label
</Button>

// Small inline (inside cards, footers)
<button className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors">
  Label <ArrowRight className="w-3.5 h-3.5" />
</button>
```

**Rules:**
- Buttons are always `rounded-full`
- Primary = dark fill, secondary = outline or ghost
- Always include `ArrowRight` icon on CTAs with `group-hover:translate-x-1`
- Never use colored buttons (no blue, green, etc. fills)

### Cards

```tsx
// Standard card
<div className="p-6 border border-foreground/10 hover:border-foreground/20 transition-all duration-300 group">
  ...
</div>

// Elevated card (pricing, featured)
<div className="p-8 lg:p-12 bg-background border-2 border-foreground">
  ...
</div>

// Subtle tinted card
<div className="p-6 bg-foreground/[0.02] border border-foreground/10">
  ...
</div>
```

**Rules:**
- No `rounded` on cards — sharp corners are the design language
- Hover state: `hover:border-foreground/20` or `hover:bg-foreground/5`
- No box shadows on cards (shadows are reserved for floating elements like nav)

### Input / Prompt Box

```tsx
<div className="w-full border border-foreground/10 rounded-2xl bg-background/60 backdrop-blur-sm shadow-sm overflow-hidden">
  <div className="p-6 pb-4">
    <textarea
      rows={5}
      className="w-full bg-transparent border-none outline-none resize-none text-xl text-foreground placeholder:text-muted-foreground/40 font-sans leading-relaxed"
    />
  </div>
  <div className="flex items-center justify-between px-6 py-4 border-t border-foreground/8 bg-foreground/[0.02]">
    {/* left: badge / chips */}
    {/* right: submit button */}
  </div>
</div>
```

The prompt/chat input is the **only** element that uses `rounded-2xl`. All other cards use sharp corners.

### Section Dividers

```tsx
// Full-width rule between sections
<div className="w-full h-px bg-foreground/6" />

// Or use border-t on the section itself
<section className="border-t border-foreground/10">
```

### Inverted (Dark) Sections

Used for "How it Works" and CTA sections:

```tsx
<section className="bg-foreground text-background">
  {/* All text uses text-background, text-background/60, text-background/40 */}
  {/* Borders use border-background/10 */}
  {/* Diagonal pattern overlay for texture */}
  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
    backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)`
  }} />
</section>
```

### Navigation

- Fixed, `z-50`, `h-20` default → shrinks to `h-14` on scroll
- On scroll: gains `bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg`
- Logo: `font-display` + blue `.` accent
- Links: `text-sm text-foreground/70 hover:text-foreground` with underline slide-in on hover
- CTA: dark rounded-full button

### Animated Backgrounds

The hero uses two layered background effects — keep both on any full-screen page:

```tsx
{/* 1. Animated 3D sphere (right side) */}
<div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] opacity-40 pointer-events-none">
  <AnimatedSphere />
</div>

{/* 2. Subtle grid lines */}
<div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
  {[...Array(8)].map((_, i) => (
    <div key={`h-${i}`} className="absolute h-px bg-foreground/10"
      style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }} />
  ))}
  {[...Array(12)].map((_, i) => (
    <div key={`v-${i}`} className="absolute w-px bg-foreground/10"
      style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }} />
  ))}
</div>
```

For dashboards and app pages, use only the grid lines (no sphere). The sphere is landing-page only.

---

## Animation Conventions

### Scroll Reveal (standard pattern for all sections)

```tsx
const [isVisible, setIsVisible] = useState(false);
const ref = useRef<HTMLElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
    { threshold: 0.1 }
  );
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);

// Apply to elements:
className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}

// Stagger children with delay:
style={{ transitionDelay: `${index * 100}ms` }}
```

### Available CSS Animation Classes (from globals.css)

| Class | Effect |
|---|---|
| `animate-char-in` | Characters blur/slide in (hero word cycling) |
| `marquee` | Infinite left scroll (30s) |
| `marquee-reverse` | Infinite right scroll (25s) |
| `line-reveal` | Clip-path left-to-right reveal |
| `hover-lift` | translateY(-4px) on hover |
| `noise-overlay` | Subtle noise texture overlay |

### Easing

Always use these easings — never `ease-in-out` or `linear` for UI transitions:
- Standard: `cubic-bezier(0.22, 1, 0.36, 1)` — fast out, smooth settle
- Bouncy: `cubic-bezier(0.34, 1.56, 0.64, 1)` — slight overshoot (hover-lift, letter-spin)
- Dramatic: `cubic-bezier(0.77, 0, 0.175, 1)` — line reveals

---

## Dashboard / App Page Rules

When building dashboards, IDE views, chat interfaces, or any authenticated app page:

1. **Same background** — `bg-background` (warm off-white), never pure white or dark
2. **Sidebar** — use `bg-sidebar` token, `border-r border-foreground/10`, sharp corners
3. **Panels / panes** — `border border-foreground/10`, no rounded corners, `bg-background`
4. **Code blocks** — `font-mono text-sm bg-foreground/[0.02] border border-foreground/10 p-4`
5. **Status indicators** — green dot `w-2 h-2 rounded-full bg-green-500` with `animate-pulse`
6. **Data tables** — `border-b border-foreground/10` rows, `text-sm font-mono` for values
7. **Chat bubbles** — user: `bg-foreground text-background rounded-2xl rounded-br-sm`, AI: `bg-foreground/5 border border-foreground/10 rounded-2xl rounded-bl-sm`
8. **Tabs** — underline style only: active tab gets `border-b-2 border-foreground`, no pill/filled tabs
9. **Modals / dialogs** — use shadcn Dialog, `bg-background border border-foreground/10`, no rounded corners on the container
10. **Loading states** — `animate-pulse bg-foreground/10` skeleton blocks, never spinners

---

## What NOT to Do

- ❌ No `rounded-lg` or `rounded-xl` on cards/panels (only `rounded-2xl` on the chat/prompt input)
- ❌ No colored backgrounds (blue, purple, gradient fills) on sections or cards
- ❌ No drop shadows on cards (`shadow-sm` only on floating/overlay elements)
- ❌ No `font-bold` — use `font-medium` for emphasis, `font-display` for headings
- ❌ No inline `style={{ color, background, padding }}` — use Tailwind classes
- ❌ No new icon libraries — lucide-react only
- ❌ No `justify-center` on section headers — always left-aligned
- ❌ No emoji in UI text
- ❌ No `transition-all` without a duration — always pair with `duration-300` or `duration-700`
