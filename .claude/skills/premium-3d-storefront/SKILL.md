---
name: premium-3d-storefront
description: Use this skill when improving the existing React/Vite storefront with premium 3D-inspired UI, depth, motion, Spline/Three.js integration, product card depth, hero visuals, and polished customer-facing design. Never use this skill for backend, auth, payments, orders, database, or API logic.
---

# Premium 3D Storefront Skill

## Main Goal

Upgrade the existing storefront into a premium, modern, fresh, 3D-inspired shopping experience for a local fruit and vegetable store.

The result should feel:
- fresh
- premium
- trustworthy
- local
- modern
- fast
- mobile-friendly

## Hard Rules

- Work only inside `apps/storefront`.
- Do not edit `apps/api`.
- Do not edit `apps/admin` unless explicitly requested.
- Do not change backend logic.
- Do not change auth, payments, orders, cart, checkout business logic, delivery rules, database models, or API contracts.
- Do not replace real backend data with mock data.
- Preserve all current API integrations.
- Preserve Hebrew, Arabic, and English support.
- Preserve RTL for Hebrew/Arabic and LTR for English.
- Use existing assets/images when possible.
- Do not remove existing features.

## Design Direction

Use a premium 3D-inspired style, not a childish game style.

Good:
- layered depth
- soft shadows
- floating vegetables
- product card lift
- image zoom on hover
- smooth CTA animations
- subtle parallax
- animated badges
- modern glass/cream cards
- soft natural lighting feeling
- fresh green, cream, earth, tomato accents

Bad:
- too many animations
- heavy particles
- random spinning objects
- slow-loading 3D
- cartoonish effects
- breaking mobile layout
- changing business logic

## 3D Strategy

Start with lightweight 3D-inspired effects first:
- Tailwind CSS transforms
- Framer Motion
- perspective effects
- layered cards
- hover depth
- floating elements

Only add real 3D if explicitly requested:
- Spline embed for hero section
- or React Three Fiber / Three.js for local GLB models

If real 3D is added:
- provide a 2D fallback
- lazy-load the 3D component
- keep mobile performance safe
- avoid huge model files
- avoid blocking page load
- explain the performance risk

## Workflow

Before editing:
1. Inspect the relevant files.
2. Identify existing data flow.
3. List files you plan to change.
4. Wait for approval before editing if the user asked to approve file-by-file.

During editing:
1. Keep changes small.
2. Preserve props and state.
3. Preserve existing API behavior.
4. Avoid large rewrites.
5. Avoid adding dependencies unless needed.

After editing:
1. Run build/lint if available.
2. Check responsive behavior.
3. Check RTL/LTR behavior.
4. Summarize changed files.
5. Confirm no backend files were changed.
6. Tell the user what to manually test.