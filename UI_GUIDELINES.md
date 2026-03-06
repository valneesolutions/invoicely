# Invoicely UI/UX Design System Guidelines

> A comprehensive reference for replicating Invoicely's premium UI quality in any application.
> Every value in this document is extracted directly from the source code — no approximations.

---

## Table of Contents

1. [Tech Stack & Dependencies](#1-tech-stack--dependencies)
2. [Color System](#2-color-system)
3. [Typography System](#3-typography-system)
4. [Spacing, Sizing & Layout](#4-spacing-sizing--layout)
5. [Component Patterns](#5-component-patterns)
6. [Form System](#6-form-system)
7. [Animation & Interaction Patterns](#7-animation--interaction-patterns)
8. [Dark Mode Strategy](#8-dark-mode-strategy)
9. [Responsive Design](#9-responsive-design)
10. [Landing & Marketing Patterns](#10-landing--marketing-patterns)
11. [Reusable CSS Utilities](#11-reusable-css-utilities)
12. [Design Principles Summary](#12-design-principles-summary)

---

## 1. Tech Stack & Dependencies

### Core Framework
- **Next.js 15** — App Router with Turbopack
- **React 19** — Server Components enabled (`rsc: true`)
- **TypeScript** — strict mode

### Styling & UI
- **Tailwind CSS v4** — with `tw-animate-css` for enter/exit animations
- **shadcn/ui** — `new-york` style, `zinc` base color, CSS variables enabled
- **Radix UI** — headless primitives (Dialog, Select, Tabs, Tooltip, etc.)
- **class-variance-authority (CVA)** — for type-safe component variants
- **clsx + tailwind-merge** — combined via `cn()` utility

### Animation
- **Framer Motion** — imported as `motion/react` (spring-based micro-interactions)
- **tw-animate-css** — CSS keyframe animations (fade-in, zoom-in, slide-in)

### Data & Forms
- **React Hook Form + Zod** — form validation and management
- **TanStack Table** — data tables with sorting, filtering, pagination
- **Jotai** — lightweight atomic state management
- **date-fns** — date formatting

### Toast Notifications
- **Sonner** — fully unstyled, custom-themed toast system

### Icons
- **Lucide React** — primary icon library
- **Custom SVG icons** — in `@/assets/icons` and `@/assets/svgs`

### shadcn/ui Configuration (`components.json`)
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

### The `cn()` Utility
Every component uses this utility for conditional class merging:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 2. Color System

### Why OKLCH?
The entire color system uses **OKLCH** (Oklab Lightness, Chroma, Hue) — a perceptually uniform color space. This means:
- Colors look equally vibrant to human eyes across the spectrum
- Lightness adjustments don't shift hue
- Dark mode variants can be computed predictably
- Transparency overlays blend naturally

### Light Mode Tokens (`:root`)
```css
:root {
  --radius: 0.6rem;

  /* Core Surfaces */
  --background: oklch(1 0 0);                     /* Pure white */
  --foreground: oklch(0.141 0.005 285.823);       /* Near-black with slight blue */
  --card: oklch(0.98 0 0);                        /* Very subtle off-white */
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);

  /* Primary — Rich Violet/Indigo */
  --primary: oklch(0.58 0.2346 278.29);           /* The hero color */
  --light-primary: oklch(0.76 0.1256 276.97);     /* Lighter variant for gradients */
  --dark-primary: oklch(0.45 0.2433 276.73);      /* Darker variant for depth */
  --primary-foreground: oklch(0.971 0.013 17.38); /* Off-white text on primary */

  /* Secondary — Neutral Gray */
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);

  /* Muted — Same as secondary for light */
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);

  /* Accent — Same as secondary for light */
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);

  /* Destructive — Warm Red */
  --destructive: oklch(0.577 0.245 27.325);

  /* Borders & Inputs */
  --border: oklch(0.92 0.004 286.32);             /* Subtle gray border */
  --input: oklch(0.92 0.004 286.32);              /* Same as border */
  --ring: oklch(0.58 0.2346 278.29);              /* Same as primary (focus rings) */

  /* Chart Palette */
  --chart-1: oklch(0.646 0.222 41.116);           /* Warm orange */
  --chart-2: oklch(0.6 0.118 184.704);            /* Teal */
  --chart-3: oklch(0.398 0.07 227.392);           /* Deep blue */
  --chart-4: oklch(0.828 0.189 84.429);           /* Golden yellow */
  --chart-5: oklch(0.769 0.188 70.08);            /* Amber */

  /* Sidebar */
  --sidebar: oklch(0.98 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.58 0.2346 278.29);
  --sidebar-primary-foreground: oklch(0.971 0.013 17.38);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.58 0.2346 278.29);
}
```

### Dark Mode Tokens (`.dark`)
```css
.dark {
  /* Core Surfaces — Deep dark with slight blue undertone */
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.98 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.98 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.98 0 0);

  /* Primary — Same across modes (consistency) */
  --primary: oklch(0.58 0.2346 278.29);
  --light-primary: oklch(0.76 0.1256 276.97);
  --dark-primary: oklch(0.45 0.2433 276.73);
  --primary-foreground: oklch(0.971 0.013 17.38);

  /* Secondary — Darker gray */
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.98 0 0);

  /* Muted */
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.51 0.015 286.067);

  /* KEY DARK MODE PATTERN: Transparent white borders instead of solid gray */
  --border: oklch(1 0 0 / 10%);    /* White at 10% opacity */
  --input: oklch(1 0 0 / 15%);     /* White at 15% opacity */

  /* Destructive — Slightly different hue in dark */
  --destructive: oklch(0.58 0.2383 25.05);

  --ring: oklch(0.58 0.2346 278.29);

  /* Chart Palette — More saturated for dark backgrounds */
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);

  /* Sidebar */
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.98 0 0);
  --sidebar-primary: oklch(0.58 0.2346 278.29);
  --sidebar-primary-foreground: oklch(0.971 0.013 17.38);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.98 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.58 0.2346 278.29);
}
```

### Tailwind Theme Mapping
The CSS variables are mapped to Tailwind colors via `@theme inline`:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-light-primary: var(--light-primary);
  --color-dark-primary: var(--dark-primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Semantic Color Badge Variants
Used for status indicators, tags, and labels — 12 color variants with a consistent dark mode transparency pattern:

| Variant      | Light Mode                         | Dark Mode                                      |
|-------------|------------------------------------|-------------------------------------------------|
| `default`   | `bg-primary text-white`            | `bg-primary/10 text-primary`                   |
| `secondary` | `bg-secondary text-black`          | `bg-secondary/80 text-secondary-foreground`    |
| `destructive`| `bg-red-500 text-white`           | `bg-red-500/10 text-red-500`                   |
| `green`     | `bg-green-500 text-white`          | `bg-green-500/10 text-green-500`               |
| `orange`    | `bg-orange-500 text-white`         | `bg-orange-500/10 text-orange-500`             |
| `purple`    | `bg-purple-500 text-white`         | `bg-purple-500/10 text-purple-500`             |
| `pink`      | `bg-pink-500 text-white`           | `bg-pink-500/10 text-pink-500`                 |
| `blue`      | `bg-blue-500 text-white`           | `bg-blue-500/10 text-blue-500`                 |
| `rose`      | `bg-rose-500 text-white`           | `bg-rose-500/10 text-rose-500`                 |
| `yellow`    | `bg-yellow-500 text-white`         | `bg-yellow-500/10 text-yellow-500`             |
| `gray`      | `bg-gray-500 text-white`           | `bg-gray-500/10 text-gray-500`                 |
| `teal`      | `bg-teal-500 text-white`           | `bg-teal-500/10 text-teal-500`                 |

**Key pattern**: In dark mode, badges use `bg-{color}-500/10` (10% opacity tint) with the color as text. In light mode, they use solid color backgrounds with white text. This creates a subtle, non-overwhelming look in dark mode while being bold and readable in light mode.

---

## 3. Typography System

### Font Stack (7 Fonts)
All fonts are loaded via `next/font/google` and applied as CSS custom properties on the `<body>`:

| Font                  | CSS Variable                    | Class Name              | Usage                                            |
|----------------------|--------------------------------|------------------------|--------------------------------------------------|
| **Geist Sans**       | `--font-geist-sans`            | `geist-sans`           | **Default body font** — clean, modern sans-serif |
| **Geist Mono**       | `--font-geist-mono`            | `geist-mono`           | Code blocks, monospace content                   |
| **JetBrains Mono**   | `--font-jetbrains-mono`        | `jetbrains-mono`       | Technical UI text, descriptions, modern-card text |
| **Instrument Serif** | `--font-instrument-serif`      | `instrument-serif`     | Branding, hero headings, page titles, logo       |
| **Instrument Sans**  | `--font-instrument-sans`       | `instrument-sans`      | Alternative sans-serif for variety                |
| **Urbanist**         | `--font-urbanist`              | `urbanist`             | Badges, accent UI text, star counts              |
| **Bricolage Grotesque** | `--font-bricolage-grotesque` | `bricolage-grotesque`  | Display headings, alternative accent font        |

### Font Loading Configuration
```tsx
// Default body font
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Monospace
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const jetBrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

// Serif (branding)
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: ["400"] });

// Sans alternatives
const instrumentSans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"] });
const bricolageGrotesque = Bricolage_Grotesque({ variable: "--font-bricolage-grotesque", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
```

### Global Font Rules
```css
html, body { font-family: var(--font-geist-sans); }
code, pre  { font-family: var(--font-jetbrains-mono) !important; }
```

### Typography Scale & Conventions
| Context               | Size       | Weight        | Tracking          | Font                  |
|----------------------|------------|---------------|-------------------|-----------------------|
| Page title (header)   | `text-xl`  | `font-semibold` | default           | Instrument Serif      |
| Card title            | default    | `font-semibold` | default           | Geist Sans            |
| Dialog title          | `text-sm`  | `font-medium`   | `tracking-tight`  | Geist Sans            |
| Dialog description    | `text-xs`  | default         | `tracking-tight`  | Geist Sans            |
| Card description      | `text-xs`  | default         | default           | Geist Sans            |
| Modern card title     | `text-sm`  | `font-medium`   | `tracking-tight`  | JetBrains Mono        |
| Modern card desc      | `text-xs`  | default         | `tracking-tight`  | JetBrains Mono        |
| Sidebar item label    | `text-[13px]` | `font-medium` | `tracking-tighter`| Geist Sans            |
| Table header          | `text-xs`  | `font-medium`   | default           | Geist Sans            |
| Table cell date       | `text-xs`  | default         | default           | Geist Sans            |
| Form label            | `text-xs`  | default         | default           | Geist Sans            |
| Badge                 | `text-xs`  | `font-medium` (light only) | default | Geist Sans        |
| Badge xs              | `text-[10px]` | `font-medium` | default          | Geist Sans            |
| Hero heading          | `text-6xl` | default         | default           | Instrument Serif      |
| Pagination text       | `text-xs`  | default         | default           | Geist Sans            |
| Open source badge     | `text-xs`  | default         | default           | Urbanist              |
| Logo text             | `text-xl`  | `font-semibold` | default           | Instrument Serif      |
| Body text             | `text-sm`  | default         | default           | Geist Sans (default)  |

### Key Typography Rules
1. **`antialiased`** is applied to the `<body>` for smooth font rendering
2. **`text-muted-foreground`** for secondary/helper text (never raw gray)
3. **`text-secondary-foreground`** for highlighted secondary info (e.g., pagination numbers)
4. **`capitalize`** on form labels and dialog titles
5. **`tracking-tight`** on dialog titles, modern card text
6. **`tracking-tighter`** on sidebar navigation items
7. **`leading-none`** on card titles and dialog titles for tight line height

---

## 4. Spacing, Sizing & Layout

### Border Radius Scale
```css
--radius: 0.6rem;          /* ~9.6px — the base */
--radius-sm: calc(0.6rem - 4px);  /* ~5.6px */
--radius-md: calc(0.6rem - 2px);  /* ~7.6px */
--radius-lg: 0.6rem;              /* 9.6px */
--radius-xl: calc(0.6rem + 4px);  /* ~13.6px */
```

Usage: `rounded-md` is the default for most components. `rounded-lg` for dialogs. `rounded-xl` for cards and sidebar inset. `rounded-sm` for badges and xs buttons.

### Component Height Scale (COMPACT — smaller than typical defaults)
| Component       | Height  | Notes                                    |
|----------------|---------|------------------------------------------|
| Button default  | `h-8`   | 32px — compact, professional             |
| Button sm       | `h-7`   | 28px                                     |
| Button lg       | `h-9`   | 36px                                     |
| Button xs       | `h-5`   | 20px — for inline/tight contexts         |
| Button icon     | `size-8` | 32x32px square                          |
| Input           | `h-8`   | 32px — matches button height             |
| Select trigger  | `h-8`   | 32px                                     |
| Tabs list       | `h-8`   | 32px                                     |
| Table row       | `h-10`  | 40px — compact but readable              |
| Table head      | `h-10`  | 40px                                     |
| Dialog icon     | `h-10 w-10` | 40x40px                              |
| Empty state icon| `h-14 w-14` | 56x56px                              |
| Star badge      | `h-7`   | 28px                                     |
| Sidebar trigger | `size-7` | 28x28px                                 |
| Dashboard header| `h-12`  | 48px — sticky top bar                    |

### Dashboard Layout Architecture
```
SidebarProvider
├── DashboardSidebar (variant="inset")
│   ├── SidebarHeader — Logo + brand name
│   ├── SidebarContent — Navigation groups
│   └── SidebarFooter — Open source badge + user menu
└── SidebarInset (border, rounded-xl on md:)
    └── div.dash-page (full height, overflow hidden)
        ├── DashboardSidebarHeader (h-12, sticky, border-b)
        │   ├── SidebarTrigger + Separator
        │   ├── AnimatePresence route title (with icon gradient)
        │   └── ThemeSwitch
        └── main.dash-layout-page-content-height (scrollable)
            └── Page content
```

### Page Content Height Formula
```css
/* Mobile: viewport - header height */
.dash-layout-page-content-height {
  height: calc(100svh - 50px);
}
/* Desktop: viewport - header - inset padding */
@media (md) {
  height: calc(100svh - 48px - 18px);
}
```

### Sidebar Dimensions
| Property              | Value    |
|----------------------|----------|
| Desktop width         | `16rem` (256px) via `--sidebar-width` |
| Mobile width          | `18rem` (288px) via `--sidebar-width-mobile` |
| Collapsed width       | `3rem` (48px) via `--sidebar-width-icon` |
| Inset margin          | `m-2 ml-0` (8px top/right/bottom, 0 left) |

### Sidebar Inset Pattern
The `SidebarInset` creates the premium "floating content" look:
```
bg-background relative flex w-full flex-1 flex-col overflow-hidden border
md:peer-data-[variant=inset]:m-2
md:peer-data-[variant=inset]:ml-0
md:peer-data-[variant=inset]:rounded-xl
md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2
```

---

## 5. Component Patterns

### Button
**9 variants** with CVA, all using `duration-200` transition and `cursor-pointer select-none`:

```
Base: cursor-pointer select-none inline-flex items-center duration-200 justify-center gap-2
      whitespace-nowrap rounded-md text-sm font-medium transition-all
      disabled:pointer-events-none disabled:opacity-50
      [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0
```

| Variant        | Classes                                                                                         |
|---------------|-----------------------------------------------------------------------------------------------|
| `default`     | `bg-primary text-primary-foreground hover:bg-primary/90 button-highlighted-shadow`             |
| `outline`     | `border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50` |
| `secondary`   | `bg-secondary text-secondary-foreground hover:bg-secondary/80`                                 |
| `ghost`       | `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50`                         |
| `link`        | `text-primary underline-offset-4 hover:underline`                                              |
| `white`       | `bg-white text-black hover:bg-white/80`                                                        |
| `destructive` | `bg-red-500 hover:bg-red-500/80 text-primary-foreground button-highlighted-shadow`             |
| `success`     | `bg-green-500 hover:bg-green-500/80 dark:bg-green-600 text-primary-foreground dark:hover:bg-green-600/80 button-highlighted-shadow` |
| `warning`     | `bg-amber-500 hover:bg-amber-500/80 dark:bg-amber-600 text-primary-foreground dark:hover:bg-amber-600/80 button-highlighted-shadow` |

**Key detail — `button-highlighted-shadow`**: Applied to `default`, `destructive`, `success`, and `warning` buttons:
```css
.button-highlighted-shadow {
  box-shadow: inset 0px 1.5px 0px rgba(255, 255, 255, 0.15);
}
```
This creates a subtle top-edge highlight that gives buttons a 3D, premium "raised" appearance.

### Size Scale
| Size      | Classes                                        |
|-----------|-----------------------------------------------|
| `default` | `h-8 px-4 py-2 has-[>svg]:px-2.5`            |
| `sm`      | `h-7 rounded-md gap-1.5 px-3 has-[>svg]:px-2`|
| `lg`      | `h-9 rounded-md px-6 has-[>svg]:px-3`        |
| `xs`      | `h-5 rounded-md gap-1.5 px-2 has-[>svg]:px-1.5 text-xs rounded-sm` |
| `icon`    | `size-8`                                      |

### Badge
12 semantic color variants with consistent dark mode transparency pattern (see Color System section for full table).

Base classes:
```
inline-flex items-center select-none justify-center light:font-medium rounded-sm
w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none
transition-[color,box-shadow] overflow-hidden
```

Sizes: `default` = `px-2 py-0.5 text-xs`, `xs` = `px-1 text-[10px] py-0.5`

### Card
Standard card with `rounded-xl` and `shadow-sm`:
```
bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm
```

- **CardHeader**: Grid layout with `auto-rows-min`, `gap-1.5`, `px-6`
- **CardTitle**: `leading-none font-semibold`
- **CardDescription**: `text-muted-foreground text-xs`
- **CardContent**: `px-6`
- **CardFooter**: `flex items-center px-6`

### Modern Card (JetBrains Mono variant)
A specialized card variant using JetBrains Mono font for a technical/modern aesthetic:
```tsx
// Title
<h2 className="jetbrains-mono flex items-center gap-2 text-sm font-medium tracking-tight">
  {children}
  {label && <span className="text-muted-foreground bg-muted/30 rounded-sm px-2 py-0.5 text-[10px]">{label}</span>}
</h2>

// Description
<p className="jetbrains-mono text-muted-foreground text-xs tracking-tight">{children}</p>
```

### Dialog
Structured with three container layers — header, content, footer — separated by borders:

**Overlay**: `bg-black/50 backdrop-blur-xs` with fade animation
**Content**: `rounded-lg border shadow-lg duration-200 sm:max-w-lg` with zoom + fade
**Close button**: `size-3.5` X icon, `opacity-70 hover:opacity-100`

Subcomponents:
- **DialogHeaderContainer**: `flex flex-row items-center gap-2 border-b p-3`
- **DialogContentContainer**: `flex flex-col gap-4 p-3`
- **DialogFooter**: `flex flex-row justify-end space-x-2 border-t p-3`
- **DialogIcon**: `bg-muted-foreground/20 h-10 w-10 rounded-lg` (icon container)
- **DialogTitle**: `text-sm font-medium tracking-tight capitalize`
- **DialogDescription**: `text-muted-foreground/80 text-xs leading-none tracking-tight`

### Alert
4 variants with grid layout and consistent transparency pattern:

| Variant        | Classes                                                          |
|---------------|------------------------------------------------------------------|
| `default`     | `bg-primary/10 dark:bg-sidebar/50 text-primary`                 |
| `destructive` | `text-red-500 bg-red-500/10 dark:bg-sidebar/50`                |
| `warning`     | `text-orange-500 bg-orange-500/10 dark:bg-sidebar/50`          |
| `secondary`   | `text-secondary-foreground dark:bg-sidebar/50`                  |

Layout: `grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]`
- **AlertTitle**: `text-sm font-medium tracking-tight`
- **AlertDescription**: `text-muted-foreground text-xs`
- **AlertButtonGroup**: `mt-1 flex flex-row gap-2`

### Input
Compact `h-8` with multi-layer focus ring pattern:
```
flex h-8 w-full min-w-0 rounded-md border bg-transparent px-3 py-1
text-base md:text-sm
dark:bg-input/30
placeholder:text-muted-foreground
selection:bg-primary selection:text-primary-foreground
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
```

### Select
Dark mode uses semi-transparent backgrounds:
```
dark:bg-input/30 dark:hover:bg-input/50
```
Select items: `text-[13px]` (slightly smaller than default), `focus:bg-accent focus:text-accent-foreground`

### Tabs
Compact `h-8` tab list with muted background:
```
TabsList: bg-muted text-muted-foreground inline-flex h-8 w-fit items-center rounded-lg p-[3px]
TabsTrigger: data-[state=active]:bg-background dark:data-[state=active]:bg-input/30
             h-[calc(100%-1px)] rounded-md px-2 text-sm font-medium
```

### Table (Data Table)
Compact, dense rows with `bg-sidebar` header and advanced filtering:

```
/* Container */
max-w-[calc(100svw-2rem)] overflow-hidden rounded-md border md:max-w-full

/* Header row */
bg-sidebar hover:!bg-sidebar

/* Header cell */
text-foreground h-10 px-2 text-left font-medium whitespace-nowrap

/* Body cell */
h-10 px-2 whitespace-nowrap

/* Body row hover */
hover:bg-muted/50 transition-colors

/* Loading skeleton */
<Skeleton className="h-4.5 w-full rounded-sm" />

/* Empty state */
h-[400px] with EmptySection component

/* Column sort button */
text-secondary-foreground text-xs font-medium -mx-2 px-2 py-1.5
```

### Tooltip
Primary-colored with arrow:
```
bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs text-balance
```
Arrow: `bg-primary fill-primary size-2.5 rounded-[2px]` rotated 45deg

### Skeleton
Simple pulsing placeholder:
```
bg-accent animate-pulse rounded-md
```

### Empty State (`EmptySection` / `IconPlaceholder`)
Centered layout with tinted icon container:
```tsx
<div className="flex flex-col items-center justify-center gap-2">
  {/* Icon in a 10% opacity tinted container using currentColor */}
  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[currentColor]/10">
    <Icon className="h-6 w-6" />
  </div>
  <div className="flex flex-col text-center">
    <div className="font-semibold">{title}</div>
    <div className="max-w-xs text-xs whitespace-break-spaces opacity-50">{description}</div>
  </div>
</div>
```

### Toast Notifications (Sonner)
Fully unstyled Sonner with custom classes — this creates a premium feel:

```tsx
<Toaster richColors position="top-center" visibleToasts={4}
  toastOptions={{
    unstyled: true,
    classNames: {
      toast: "!bg-background !p-4 !rounded-xl border !border-border/70 flex flex-row gap-2 !items-start w-full shadow-md select-none",
      title: "text-xs font-medium mb-0.5",
      description: "!text-secondary-foreground/50 text-xs",
      error: "!text-red-500",
      success: "!text-emerald-500",
      info: "!text-primary",
      warning: "!text-orange-500",
      actionButton: "bg-black text-white dark:text-[currentColor] dark:bg-[currentColor]/10 hover:dark:bg-[currentColor]/20 min-w-max px-2 py-0.5 !text-[11px] h-fit !rounded-sm cursor-pointer duration-200",
      cancelButton: "!text-black dark:!text-white !text-[11px] h-fit !rounded-sm min-w-max px-2 py-0.5 bg-zinc-200 dark:bg-zinc-900/80 hover:dark:bg-zinc-800/80 cursor-pointer duration-200",
      icon: "!mt-[1.5px] !pl-[2px]",
    },
  }}
  icons={{
    error: <CircleXmarkIcon className="size-4" />,
    success: <CircleCheckIcon className="size-4" />,
    warning: <TriangleWarningIcon className="size-4" />,
    info: <LabelInfoIcon className="size-4" />,
  }}
/>
```

---

## 6. Form System

### Architecture
Forms use **React Hook Form** with **Zod** validation, composed from these building blocks:

### FormInput
Complete input field with label, optional badge, validation error, and description:
```tsx
<FormItem className="w-full">
  <FormLabel className="flex items-center">
    <span className="text-xs capitalize">{label}</span>
    {isOptional && <Badge size="xs" variant={error ? "destructive" : "secondary"}>Optional</Badge>}
  </FormLabel>
  <FormControl>
    <Input className={cn(error && "focus-visible:ring-destructive !border-destructive ring-transparent duration-200")} />
  </FormControl>
  {/* Error takes priority over description */}
  {error ? (
    <div className="flex items-center gap-1 -mt-0.5">
      <TriangleAlertIcon className="text-destructive size-2.5" />
      <FormMessage />
    </div>
  ) : description ? (
    <div className="flex items-center gap-1 -mt-0.5">
      <InfoIcon className="text-muted-foreground size-2.5" />
      <FormDescription>{description}</FormDescription>
    </div>
  ) : null}
</FormItem>
```

### FormButton
Auto-detects loading state from both React Hook Form and React DOM form status:
```tsx
<Button disabled={isLoading || !isDirty || isSubmitting} type="submit">
  <LoaderCircleIcon size={14} className={cn("absolute animate-spin", isLoading ? "block" : "hidden")} />
  <span className={cn(isLoading ? "opacity-0" : "opacity-100")}>
    {children}
  </span>
</Button>
```
The loading spinner overlays the button text (which becomes invisible), maintaining button width.

### FormRow
Simple horizontal layout wrapper:
```tsx
<div className="flex flex-row gap-4">{children}</div>
```

### Form Error Pattern
- Error border: `!border-destructive ring-transparent`
- Error icon: `TriangleAlertIcon` at `size-2.5` in `text-destructive`
- Error text: `FormMessage` component (inherits destructive color)
- Error badge: Optional badge changes from `secondary` to `destructive` variant

### Available Form Components
| Component           | Purpose                            |
|--------------------|------------------------------------|
| `FormInput`         | Text, number, email inputs         |
| `FormTextarea`      | Multi-line text                    |
| `FormSelect`        | Dropdown selection                 |
| `FormDatePicker`    | Date selection                     |
| `FormColorPicker`   | Color selection                    |
| `FormImageInput`    | Image upload                       |
| `FormSignatureInput`| Signature drawing                  |
| `FormButton`        | Submit with auto-loading state     |
| `FormRow`           | Horizontal layout wrapper          |

---

## 7. Animation & Interaction Patterns

### Framer Motion (Primary Animation Library)
Imported as `motion/react`:

#### Route Title Transition (Dashboard Header)
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={route.name}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2, type: "spring", bounce: 0 }}
  >
    {/* Page title with gradient icon */}
  </motion.div>
</AnimatePresence>
```
**Key**: `type: "spring"` with `bounce: 0` creates smooth, non-bouncy motion. `duration: 0.2` keeps it snappy.

### CSS Animations (tw-animate-css)

#### Dialog Enter/Exit
```
/* Overlay */
data-[state=open]:animate-in data-[state=open]:fade-in-0
data-[state=closed]:animate-out data-[state=closed]:fade-out-0

/* Content */
data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
```

#### Select/Popover Enter
```
data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
data-[side=bottom]:slide-in-from-top-2
data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2
data-[side=top]:slide-in-from-bottom-2
```

#### Tooltip
```
animate-in fade-in-0 zoom-in-95
data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
```

### Theme Transition
```css
body {
  transition: background-color var(--transition-duration) ease;
}
```
Only the background color transitions on theme change — not all properties (prevents janky full-page reflows).

### Interaction Details
| Pattern                          | Implementation                                    |
|---------------------------------|--------------------------------------------------|
| Button/image non-selectable      | `user-select: none` on `img` and `button` tags   |
| Text selection highlight         | `::selection { bg-primary/80 text-primary-foreground }` |
| Disabled state                   | `disabled:pointer-events-none disabled:opacity-50`|
| Interactive transitions          | `duration-200` (200ms — consistent across app)    |
| Focus ring                       | `focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring` |
| Loading spinner                  | `animate-spin` on `LoaderCircleIcon`              |
| Skeleton loading                 | `animate-pulse` on `bg-accent`                    |
| Table loading                    | 10 skeleton rows with `h-4.5 rounded-sm`          |

---

## 8. Dark Mode Strategy

### Implementation
- **next-themes** with `attribute="class"`, `defaultTheme="system"`
- Custom variant: `@custom-variant dark (&:is(.dark *));`

### Key Dark Mode Patterns

#### 1. Transparent White Borders (THE signature technique)
Instead of separate gray border colors, dark mode uses transparent white:
```css
--border: oklch(1 0 0 / 10%);  /* White at 10% opacity */
--input: oklch(1 0 0 / 15%);   /* White at 15% opacity — slightly more visible */
```
This creates borders that subtly adapt to any background, giving a cohesive glass-like feel.

#### 2. Semi-transparent Input Backgrounds
```
dark:bg-input/30    /* 30% opacity of the input color */
dark:hover:bg-input/50  /* 50% on hover */
```
Applied to: Input, Select trigger, Tabs active state, Outline button

#### 3. Badge Transparency Pattern
```
Light: bg-{color}-500 text-white          (solid, bold)
Dark:  bg-{color}-500/10 text-{color}-500 (tinted, subtle)
```

#### 4. Alert Dark Background
All alert variants use `dark:bg-sidebar/50` — a semi-transparent sidebar color that creates depth without overwhelming.

#### 5. Consistent Primary
`--primary` stays identical across modes (`oklch(0.58 0.2346 278.29)`). The `--light-primary` and `--dark-primary` variants are for gradients, not mode switching.

#### 6. Overlay & Backdrop
```
bg-black/50 backdrop-blur-xs
```
Consistent across Dialog, Sheet, and any modal overlay.

---

## 9. Responsive Design

### Breakpoint Strategy
- **Mobile-first** — base styles are mobile, `md:` adds desktop refinements
- Primary breakpoint: `md:` (768px)
- Secondary: `sm:` (640px) for grid adjustments

### Key Responsive Patterns

#### Table Overflow
```
max-w-[calc(100svw-2rem)] overflow-hidden rounded-md border md:max-w-full
```
On mobile, tables are constrained to viewport minus padding. On desktop, they fill the container.

#### Page Content Height
```css
h-[calc(100svh-50px)]              /* Mobile: taller header */
md:h-[calc(100svh-48px-18px)]      /* Desktop: header + inset padding */
```

#### Sidebar
- Mobile: `18rem` width, sheet overlay (`SheetContent`)
- Desktop: `16rem` width, inline sidebar
- Collapsed: `3rem` icon-only mode

#### Hidden Scrollbars
```css
.scroll-bar-hidden::-webkit-scrollbar { display: none; }
.scroll-bar-hidden { scrollbar-width: none; }
```
Applied to the main content area for a clean, app-like feel.

#### Viewport Units
Uses `100svh` (small viewport height) and `100dvh` (dynamic viewport height) instead of `100vh` — these account for mobile browser chrome correctly.

### Text Responsiveness
```
text-base md:text-sm  /* Input: 16px mobile (prevents iOS zoom), 14px desktop */
```

---

## 10. Landing & Marketing Patterns

### Container
```css
.new-container {
  max-width: 1000px;
  margin: 0 auto;
  border-left: 1px dashed;
  border-right: 1px dashed;
}
```
Centered content with decorative dashed side borders.

### Hero Section
```tsx
<div className="relative h-[calc(100svh-64px-150px)] overflow-hidden border-b border-dashed">
  {/* Background image with invert trick */}
  <Image className="h-full w-full object-cover object-left invert dark:invert-0" />
  {/* Content overlaid on top */}
  <div className="z-10 flex flex-col gap-4">
    {/* Star count badge */}
    {/* Heading in Instrument Serif */}
    {/* CTA buttons */}
  </div>
</div>
```

**Background invert trick**: `invert dark:invert-0` — a dark background image is inverted to appear light in light mode, and shown normally in dark mode.

### Heading Pattern
Partially dimmed text with highlighted keywords:
```tsx
<h1 className="dark:text-primary-foreground/30 text-secondary-foreground/50">
  Create <span className="dark:text-primary-foreground text-secondary-foreground">Beautiful</span> Invoices
</h1>
```
Words that should be emphasized are wrapped in spans with full opacity.

### FancyBadgeWithBorders (Decorative Section Divider)
```tsx
<div className="flex flex-row items-center gap-2 px-6">
  {/* Left line */}
  <div className="flex flex-row items-center">
    <div className="from-muted h-px w-20 bg-gradient-to-l to-transparent sm:w-40" />
    <div className="bg-muted/20 h-1.5 w-1.5 border" />  {/* Diamond marker */}
  </div>
  {/* Badge text */}
  <div className="bg-muted/20 jetbrains-mono h-7 rounded-md border px-4 text-sm font-medium">
    {children}
  </div>
  {/* Right line */}
  <div className="flex flex-row items-center">
    <div className="bg-muted/20 h-1.5 w-1.5 border" />  {/* Diamond marker */}
    <div className="from-muted h-px w-20 bg-gradient-to-r to-transparent sm:w-40" />
  </div>
</div>
```

### Feature Grid
```tsx
<div className="grid grid-flow-row sm:h-[150px] sm:grid-cols-3">
  <div className="flex h-40 flex-col gap-3 border-b border-dashed p-4 sm:h-auto">
    {/* Feature content */}
  </div>
  <div className="... sm:border-l">  {/* Dashed left border separator */}
    {/* Feature content */}
  </div>
</div>
```

### Blog Gradient
```css
.blog-hero-gradient {
  background: linear-gradient(165deg,
    #3a3a3a, #373737, #353535, #323232, #303030,
    #2d2d2d, #2a2a2a, #282828, #252525, #232323,
    #202020, #1e1e1e
  );
}
```

### Dashed Background Pattern
```css
.bg-dashed {
  background-image: linear-gradient(45deg,
    var(--border) 12.5%, transparent 12.5%,
    transparent 50%, var(--border) 50%,
    var(--border) 62.5%, transparent 62.5%,
    transparent 100%
  );
  background-size: 0.25rem 0.25rem;
}
```
Creates a subtle diagonal dashed/hatched pattern using the border color.

---

## 11. Reusable CSS Utilities

### Complete List of Custom Utilities

```css
/* Premium button inset shadow — applied to primary, destructive, success, warning buttons */
.button-highlighted-shadow {
  box-shadow: inset 0px 1.5px 0px rgba(255, 255, 255, 0.15);
}

/* Dashboard page container */
.dash-page {
  display: flex;
  width: 100%;
  flex-direction: column;
}

/* Dashboard content area height (accounts for header + sidebar inset) */
.dash-layout-page-content-height {
  height: calc(100svh - 50px);           /* Mobile */
}
@media (min-width: 768px) {
  .dash-layout-page-content-height {
    height: calc(100svh - 48px - 18px);  /* Desktop */
  }
}

/* Hidden scrollbar (both WebKit and Firefox) */
.scroll-bar-hidden::-webkit-scrollbar { display: none; }
.scroll-bar-hidden { scrollbar-width: none; }

/* Centered container with dashed side borders */
.new-container {
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  border-left: 1px dashed;
  border-right: 1px dashed;
}

/* Diagonal hatched pattern background */
.bg-dashed {
  background-image: linear-gradient(45deg,
    var(--border) 12.5%, transparent 12.5%,
    transparent 50%, var(--border) 50%,
    var(--border) 62.5%, transparent 62.5%,
    transparent 100%
  );
  background-size: 0.25rem 0.25rem;
}

/* Text selection */
::selection {
  background: oklch(0.58 0.2346 278.29 / 80%);  /* primary at 80% */
  color: oklch(0.971 0.013 17.38);               /* primary-foreground */
}

/* Non-selectable interactive elements */
img, button { user-select: none; }

/* Full viewport height fix */
.h-screen { height: 100dvh; }

/* Global base layer */
* { border-color: var(--border); outline-color: oklch(0.58 0.2346 278.29 / 50%); }
body { background-color: var(--background); color: var(--foreground); overscroll-behavior: none; }

/* List marker color */
li::marker { color: var(--secondary-foreground); }

/* Blog/docs monospace override */
.text-fd-muted-foreground {
  font-family: var(--font-jetbrains-mono);
  font-size: 13px;
  letter-spacing: -0.02em;
  color: var(--secondary-foreground);
  font-weight: 600;
}
```

---

## 12. Design Principles Summary

### What Makes This UI Feel Premium

1. **Compact density** — Everything is 1 size smaller than typical defaults (h-8 instead of h-10 for buttons/inputs). This creates a professional, dense feel without feeling cramped.

2. **The transparency system** — Dark mode borders use `oklch(1 0 0 / 10%)` (transparent white) instead of solid grays. Inputs use `dark:bg-input/30`. Badges use `dark:bg-{color}/10`. This creates a cohesive, glass-like dark mode.

3. **The inner highlight shadow** — `box-shadow: inset 0px 1.5px 0px rgba(255, 255, 255, 0.15)` on primary buttons creates a subtle top-edge light reflection. Small detail, huge impact.

4. **Multi-font pairing** — Not just one font for everything. Geist Sans for body, Instrument Serif for headings/branding, JetBrains Mono for technical text, Urbanist for accent UI. Each font has a clear purpose.

5. **OKLCH perceptual uniformity** — Colors look equally vibrant and balanced because OKLCH maps to human perception. Hue 278 (violet-indigo) is used as the primary with consistent chroma levels.

6. **Spring-based animations** — Framer Motion with `type: "spring", bounce: 0, duration: 0.2` creates natural-feeling motion. No ease-in-out curves — everything feels physically grounded.

7. **Consistent 200ms transitions** — `duration-200` everywhere. The user's brain learns one speed, creating a unified rhythm.

8. **Structured dialogs** — Header, content, footer separated by borders with padding of `p-3`. This creates clear visual hierarchy in modals.

9. **Dashed borders as decoration** — Marketing sections use `border-dashed` for visual interest without being heavy. Combined with gradient fade lines and diamond markers.

10. **The gradient icon container** — Page header icons sit in a `bg-gradient-to-br from-light-primary to-primary` rounded container. This small gradient touch makes navigation feel alive.

11. **Custom toast system** — Unstyled Sonner with `rounded-xl`, `shadow-md`, `border-border/70` creates toasts that feel native to the design system rather than a third-party plugin.

12. **Empty states as first-class citizens** — Empty tables and sections use `bg-[currentColor]/10` icon containers with title + description. No blank screens.

13. **Overscroll disabled** — `overscroll-behavior: none` on body prevents the rubber-band bounce effect, making the app feel more native.

14. **Hidden scrollbars** — Main content area hides scrollbars for a cleaner look while maintaining scrollability.

15. **Selection highlighting** — `::selection` uses primary color at 80% opacity. Even text selection matches the brand.

### How to Replicate This Quality

1. Start with shadcn/ui `new-york` style + `zinc` base
2. Switch the entire color system to OKLCH
3. Set `--radius: 0.6rem` and reduce all component heights by one step
4. Add `button-highlighted-shadow` to your primary buttons
5. Use transparent white borders in dark mode (`oklch(1 0 0 / 10%)`)
6. Pick 3-4 fonts with clear roles (body, code, branding, accent)
7. Use Framer Motion with `spring` type and `bounce: 0`
8. Set `duration-200` as your universal transition speed
9. Always design empty states and loading states (skeletons, not spinners)
10. Use `unstyled` Sonner with your own toast classes
11. Apply `user-select: none` on images and buttons
12. Hide scrollbars on main content with `scrollbar-width: none`
13. Use `::selection` styling to match your brand
14. Disable overscroll with `overscroll-behavior: none`
15. Use `100svh` / `100dvh` instead of `100vh`

---

## Source Files Reference

| File | Purpose |
|------|---------|
| `apps/web/src/app/globals.css` | Color tokens, custom utilities, base styles |
| `apps/web/src/app/fonts.css` | Font family CSS classes |
| `apps/web/src/app/layout.tsx` | Font loading, provider tree, toast config |
| `apps/web/src/app/(dashboard)/layout.tsx` | Dashboard shell layout |
| `apps/web/src/lib/utils.ts` | `cn()` utility |
| `apps/web/components.json` | shadcn/ui configuration |
| `apps/web/src/components/ui/button.tsx` | Button variants |
| `apps/web/src/components/ui/badge.tsx` | Badge variants |
| `apps/web/src/components/ui/card.tsx` | Card components |
| `apps/web/src/components/ui/modern-card.tsx` | Modern card (JetBrains Mono) |
| `apps/web/src/components/ui/dialog.tsx` | Dialog with structured containers |
| `apps/web/src/components/ui/alert.tsx` | Alert variants |
| `apps/web/src/components/ui/input.tsx` | Input styling |
| `apps/web/src/components/ui/select.tsx` | Select styling |
| `apps/web/src/components/ui/tabs.tsx` | Tab styling |
| `apps/web/src/components/ui/table.tsx` | Table components |
| `apps/web/src/components/ui/data-table.tsx` | Data table with filtering |
| `apps/web/src/components/ui/tooltip.tsx` | Tooltip with arrow |
| `apps/web/src/components/ui/skeleton.tsx` | Loading skeleton |
| `apps/web/src/components/ui/icon-placeholder.tsx` | Empty state component |
| `apps/web/src/components/ui/fancy-badges.tsx` | Decorative section divider |
| `apps/web/src/components/ui/sidebar.tsx` | Sidebar UI primitives |
| `apps/web/src/components/ui/form/` | Form system (input, select, button, etc.) |
| `apps/web/src/components/layout/sidebar/` | Dashboard sidebar components |
| `apps/web/src/components/layout/landing/` | Marketing/landing components |
| `apps/web/src/constants/toast.tsx` | Toast configuration |
| `apps/web/src/constants/sidebar.tsx` | Sidebar navigation items |
