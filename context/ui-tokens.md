# UI Tokens: SWIZAUTH

This document defines the visual design system tokens mapping to TailwindCSS variables, optimized for a sleek, premium, enterprise-grade IAM dashboard.

---

## 1. Color Palette (HSL Design System)
Colors are structured to support light and dark modes natively via CSS variables.

### Light Mode Primitives
```css
:root {
  --background: 210 40% 98%;      /* Very light slate blue */
  --foreground: 222 47% 11%;      /* Deep navy */
  --card: 0 0% 100%;              /* Pure white */
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 250 84% 54%;         /* Vibrant Royal Indigo */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;     /* Subtle slate */
  --secondary-foreground: 222 47% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 250 84% 96%;          /* Ultra soft indigo highlight */
  --accent-foreground: 250 84% 30%;
  --destructive: 0 84.2% 60.2%;   /* Soft warning red */
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 250 84% 54%;
}
```

### Dark Mode Primitives (Default Experience)
```css
.dark {
  --background: 224 71% 4%;       /* Deep dark blue-black */
  --foreground: 213 31% 91%;      /* Pale blue-gray */
  --card: 224 71% 7%;             /* Dark slate navy */
  --card-foreground: 213 31% 91%;
  --popover: 224 71% 6%;
  --popover-foreground: 213 31% 91%;
  --primary: 250 95% 65%;         /* Bright Electric Indigo */
  --primary-foreground: 222 47% 11%;
  --secondary: 222.2 47.4% 11.2%;
  --secondary-foreground: 213 31% 91%;
  --muted: 222.2 47.4% 11.2%;
  --muted-foreground: 215.4 16.3% 56.9%;
  --accent: 250 95% 15%;          /* Indigo glow */
  --accent-foreground: 250 95% 85%;
  --destructive: 0 62.8% 30.6%;   /* Dark alert red */
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 250 95% 65%;
}
```

---

## 2. Typography
Use Google Fonts **"Outfit"** for headers and **"Inter"** for body text.

- **Brand Header (H1):** `font-sans font-bold tracking-tight text-3xl md:text-4xl`
- **Section Title (H2):** `font-sans font-semibold tracking-tight text-xl md:text-2xl`
- **Body Regular:** `font-sans font-normal text-sm text-muted-foreground`
- **Code/Tokens:** `font-mono text-xs tracking-normal text-primary`

---

## 3. Spacing and Layout Scale
- **Form Inputs spacing:** `space-y-4` or `space-y-6`
- **Section Padding:** `py-8 px-4 sm:px-6 lg:px-8`
- **Card Padding:** `p-6`
- **Grid Layouts:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

---

## 4. Radii and Shadow Primitives
- **Large Container / Card Radius:** `rounded-xl` (`0.75rem` / `12px`)
- **Input / Button Radius:** `rounded-lg` (`0.5rem` / `8px`)
- **Popovers / Badges Radius:** `rounded-md` (`0.375rem` / `6px`)
- **Shadow Premium:**
  - Standard Card: `shadow-md shadow-black/5`
  - Floating Popovers: `shadow-lg shadow-black/10`
- **Gradients:**
  - Primary Background: `bg-gradient-to-br from-background via-background to-accent/5`
  - CTA Button: `bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700`
