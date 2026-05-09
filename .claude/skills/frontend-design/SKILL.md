# Frontend Design Skill

## Scope
All work must stay inside `apps/storefront/src/`. Do not touch backend files, API routes, DB models, auth, payments, delivery logic, or order logic. If a UI change seems to need backend support, ask before acting.

---

## Design System

### Philosophy
Premium organic grocery aesthetic — think Whole Foods meets Linear. Clean, purposeful, never over-decorated. Every spacing value comes from the 8px grid. Every interaction has a reaction. RTL-first (Hebrew primary language).

---

## Color Palette

```js
// tokens — use these values directly in inline styles
const colors = {
  // Brand greens — earthy, not neon
  primary:        '#1e6b3c',   // main CTA, active states
  primaryHover:   '#165430',   // darker on hover
  primarySurface: '#eef7f1',   // tinted bg for green sections
  primaryBorder:  '#a3cfb4',   // borders inside green surfaces

  // Accent — warm amber for preorder / sale / urgency
  accent:         '#c47f17',
  accentSurface:  '#fdf6e3',
  accentBorder:   '#f0d08a',

  // Neutrals — warm stone, not cold gray
  bg:             '#faf8f5',   // page background
  surface:        '#ffffff',   // card / panel background
  surfaceRaised:  '#f5f2ed',   // slightly lifted surface (sidebar, aside)
  border:         '#e8e3dc',   // default borders
  borderStrong:   '#c9c2b8',   // emphasized borders

  // Text
  textPrimary:    '#1c1917',   // headings
  textSecondary:  '#57534e',   // body, labels
  textMuted:      '#a8a29e',   // placeholders, helper text
  textInverse:    '#ffffff',

  // Semantic
  success:        '#166534',
  successSurface: '#f0fdf4',
  successBorder:  '#bbf7d0',
  error:          '#991b1b',
  errorSurface:   '#fef2f2',
  errorBorder:    '#fecaca',
  warning:        '#92400e',
  warningSurface: '#fffbeb',
  warningBorder:  '#fde68a',
};
```

---

## Spacing (8px grid)

```js
const space = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
};
```

Never use arbitrary px values. Compose from the grid: `8`, `16`, `24`, `32`, `48`, `64`.

---

## Typography

Font stack (no external fonts needed — system fonts that look great):
```css
font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
```

Scale:
```js
const text = {
  xs:   { fontSize: '12px', lineHeight: '16px' },
  sm:   { fontSize: '14px', lineHeight: '20px' },
  base: { fontSize: '16px', lineHeight: '24px' },
  lg:   { fontSize: '18px', lineHeight: '28px' },
  xl:   { fontSize: '20px', lineHeight: '28px' },
  '2xl':{ fontSize: '24px', lineHeight: '32px' },
  '3xl':{ fontSize: '30px', lineHeight: '36px' },
  '4xl':{ fontSize: '36px', lineHeight: '40px' },
};

const weight = {
  normal:   400,
  medium:   500,
  semibold: 600,
  bold:     700,
};
```

Hierarchy rules:
- Page `<h1>`: `3xl`, `bold`, `textPrimary`
- Section `<h2>`: `2xl`, `semibold`, `textPrimary`
- Card `<h3>`: `lg`, `semibold`, `textPrimary`
- Body: `base`, `normal`, `textSecondary`
- Labels / captions: `sm`, `medium`, `textSecondary`
- Helper text: `xs`, `normal`, `textMuted`

---

## Border Radius

```js
const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '20px',
  full: '9999px',  // pills, badges
};
```

Rules: Cards use `lg`. Buttons use `md`. Badges/chips use `full`. Inputs use `md`. Modals/panels use `xl`.

---

## Shadows

```js
const shadow = {
  sm:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md:  '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  lg:  '0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.05)',
  xl:  '0 16px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
  // Green-tinted shadow for primary buttons
  primary: '0 4px 14px rgba(30,107,60,0.30)',
};
```

Rules: Default card gets `sm`. Hovered card gets `md`. Sticky nav gets `sm`. Modals get `lg`.

---

## Framer Motion Patterns

Framer Motion is already installed. Import from `framer-motion`.

### Page / section entry
```jsx
import { motion } from 'framer-motion';

const fadeUp = {
  initial:   { opacity: 0, y: 16 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -8 },
  transition:{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
};

// Usage: wrap page content
<motion.section {...fadeUp}>…</motion.section>
```

### Staggered list (product grid)
```jsx
const listVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  initial:   { opacity: 0, y: 12 },
  animate:   { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

<motion.div variants={listVariants} initial="initial" animate="animate">
  {items.map(item => (
    <motion.div key={item._id} variants={itemVariants}>
      <ProductCard … />
    </motion.div>
  ))}
</motion.div>
```

### Card hover lift
```jsx
<motion.article
  whileHover={{ y: -4, boxShadow: shadow.md }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.18, ease: 'easeOut' }}
>
```

### Button press
```jsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.96 }}
  transition={{ duration: 0.12 }}
>
```

### Loading skeleton pulse
```jsx
const pulse = {
  animate: { opacity: [0.5, 1, 0.5] },
  transition: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' },
};
<motion.div {...pulse} style={{ background: colors.border, borderRadius: radius.md, height: 20 }} />
```

### Error / success banner slide-in
```jsx
<AnimatePresence>
  {error && (
    <motion.div
      key="error"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* error content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Component Patterns

These are the building blocks. Implement directly in the components that need them — no abstraction layer unless at least 3 places use it.

### Button

```jsx
// Primary
const primaryBtn = {
  padding: '10px 20px',
  borderRadius: radius.md,
  border: 'none',
  background: colors.primary,
  color: colors.textInverse,
  fontSize: '15px',
  fontWeight: weight.semibold,
  cursor: 'pointer',
  boxShadow: shadow.primary,
  transition: 'background 0.15s, box-shadow 0.15s',
  width: '100%',              // full-width on mobile by default
};

// Secondary (outlined)
const secondaryBtn = {
  ...primaryBtn,
  background: 'transparent',
  color: colors.primary,
  border: `1.5px solid ${colors.primary}`,
  boxShadow: 'none',
};

// Ghost / destructive
const ghostBtn = {
  ...primaryBtn,
  background: 'transparent',
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  boxShadow: 'none',
};

// Disabled state — apply when disabled={true}
const disabledOverride = {
  background: colors.border,
  color: colors.textMuted,
  cursor: 'not-allowed',
  boxShadow: 'none',
};
```

### Product Card

```jsx
const cardStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  background: colors.surface,
  boxShadow: shadow.sm,
};

const cardBodyStyle = {
  padding: '16px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const cardImageStyle = {
  aspectRatio: '4 / 3',
  background: colors.surfaceRaised,
  overflow: 'hidden',
};
```

### Badge / Chip

```jsx
// Preorder badge
const preorderBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: radius.full,
  fontSize: '12px',
  fontWeight: weight.semibold,
  background: colors.warningSurface,
  color: colors.warning,
  border: `1px solid ${colors.warningBorder}`,
};

// Sale badge
const saleBadge = {
  ...preorderBadge,
  background: colors.errorSurface,
  color: colors.error,
  border: `1px solid ${colors.errorBorder}`,
};

// In-stock indicator — use a dot, not a checkmark
const stockDot = (inStock) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: inStock ? colors.success : colors.error,
  fontWeight: weight.medium,
});
```

### Form Field

```jsx
const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '14px',
  fontWeight: weight.medium,
  color: colors.textSecondary,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: radius.md,
  border: `1.5px solid ${colors.border}`,
  fontSize: '15px',
  color: colors.textPrimary,
  background: colors.surface,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  // Add on focus via onFocus/onBlur handlers:
  // borderColor: colors.primary, boxShadow: `0 0 0 3px rgba(30,107,60,0.12)`
};

const helperTextStyle = {
  fontSize: '12px',
  color: colors.textMuted,
  lineHeight: 1.5,
};

const fieldErrorStyle = {
  fontSize: '12px',
  color: colors.error,
  display: 'block',
  marginTop: '2px',
};
```

### Error / Alert Banner

```jsx
const bannerStyle = (variant) => {
  const map = {
    error:   { bg: colors.errorSurface,   border: colors.errorBorder,   text: colors.error },
    success: { bg: colors.successSurface, border: colors.successBorder, text: colors.success },
    warning: { bg: colors.warningSurface, border: colors.warningBorder, text: colors.warning },
    info:    { bg: colors.primarySurface, border: colors.primaryBorder, text: colors.primary },
  };
  const v = map[variant] || map.error;
  return {
    padding: '12px 16px',
    borderRadius: radius.md,
    background: v.bg,
    border: `1px solid ${v.border}`,
    color: v.text,
    fontSize: '14px',
    lineHeight: 1.5,
  };
};
```

### Navbar

```jsx
const navStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 24px',
  height: '64px',
  background: colors.surface,
  borderBottom: `1px solid ${colors.border}`,
  boxShadow: shadow.sm,
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const navLinkStyle = {
  fontSize: '15px',
  fontWeight: weight.medium,
  color: colors.textSecondary,
  textDecoration: 'none',
  padding: '6px 10px',
  borderRadius: radius.sm,
  transition: 'color 0.15s, background 0.15s',
  // active: color: colors.primary, background: colors.primarySurface
};
```

### Page Layout

```jsx
// Wrap each page's content in this
const pageStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '40px 24px',
};

// App root — replaces the current padding: '1rem' wrapper
const appRootStyle = {
  minHeight: '100vh',
  background: colors.bg,
  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  color: colors.textPrimary,
};
```

### Order Summary Aside

```jsx
const asideStyle = {
  background: colors.surfaceRaised,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  padding: '24px',
  position: 'sticky',
  top: '80px',          // below sticky nav
};
```

### Skeleton Loader

```jsx
// Use when loading=true, replaces the plain text loading state
const SkeletonLine = ({ width = '100%', height = 16 }) => (
  <motion.div
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
    style={{
      width,
      height,
      background: colors.border,
      borderRadius: radius.sm,
    }}
  />
);

// Product card skeleton
const CardSkeleton = () => (
  <div style={{ ...cardStyle, gap: 0 }}>
    <div style={{ ...cardImageStyle, background: colors.border }} />
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SkeletonLine height={18} width="70%" />
      <SkeletonLine height={14} width="40%" />
      <SkeletonLine height={36} />
    </div>
  </div>
);
```

---

## Responsive / Mobile-first

The grid product layout is already `repeat(auto-fill, minmax(240px, 1fr))` — keep that. Additional breakpoint guidance:

- **Mobile default** (`< 640px`): single column, full-width buttons, stacked form
- **Tablet** (`≥ 640px`): 2-column product grid, form + aside side-by-side
- **Desktop** (`≥ 1024px`): 3–4 column product grid, wider page padding

Implement with `useWindowSize` or CSS grid auto-fill — prefer CSS grid auto-fill over JS breakpoints.

Checkout two-column layout: collapse to single column on mobile:
```js
const checkoutGrid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',   // mobile: stacked
  gap: '24px',
  // At ~768px+, override to: 'minmax(0, 1fr) minmax(0, 340px)'
};
```

---

## RTL Support

This app supports Hebrew (RTL). Always use CSS logical properties:
- `marginInlineStart` / `marginInlineEnd` (not `marginLeft` / `marginRight`)
- `paddingInlineStart` / `paddingInlineEnd`
- `insetInlineStart` (not `left`)
- `textAlign: 'start'` (not `'left'`)

The `useDir()` hook from `src/i18n/useDir.js` sets `dir` on `<html>`. Rely on it — do not detect language in components to set direction.

---

## Anti-patterns to Avoid

- No `color: 'crimson'` — use `colors.error`
- No `fontFamily: 'sans-serif'` — use the full stack
- No magic px values — compose from the 8px grid
- No `background: '#f4f4f4'` — use `colors.surfaceRaised`
- No bare `<p style={{ color: 'red' }}>` for errors — use the banner pattern
- No `border: '1px solid #ccc'` — use `colors.border`
- No hard-coded `left:`/`right:` — use logical properties
- No complex animations without `will-change: transform` on the element
- Do not install new dependencies without asking — Framer Motion is already available

---

## Implementation Order (when redesigning pages)

1. Global: set `appRootStyle` on the root `<div>` in `App.jsx`, apply `pageStyle` to each page
2. Navbar: sticky with `navStyle`, styled links
3. `ProductCard`: card lift animation, badge polish, button upgrade
4. `HomePage`: stagger grid animation, skeleton loading state
5. `LoginPage` / `RegisterPage`: form field styling, focus rings, error banners
6. `CartPage`: item rows, quantity controls, wrap toggle
7. `CheckoutPage`: two-column responsive layout, order summary aside
8. `OrderConfirmationPage`: success state animation

Apply one page at a time. Verify RTL on each before moving on.
