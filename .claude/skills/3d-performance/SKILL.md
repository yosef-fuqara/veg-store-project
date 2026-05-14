---
name: 3d-performance
description: Use this skill when optimizing 3D, animations, Spline embeds, GLB models, images, lazy loading, bundle size, mobile performance, and fallback behavior in the storefront.
---

# 3D Performance Skill

## Goal

Keep the storefront fast, smooth, and usable while adding 3D or 3D-inspired UI.

## Hard Rules

- Work only inside `apps/storefront`.
- Do not edit `apps/api`.
- Do not edit `apps/admin` unless explicitly requested.
- Do not change auth, cart, checkout, orders, payments, delivery logic, database models, or API contracts.
- Do not replace real backend data with mock data.

## Performance Rules

- Do not block initial page load with heavy 3D.
- Lazy-load 3D components.
- Add fallback UI for slow devices or WebGL failure.
- Keep mobile performance safe.
- Avoid adding Three.js unless necessary.
- Prefer CSS and Framer Motion for simple depth effects.
- Compress models if using GLB/GLTF.
- Avoid huge textures.
- Do not animate too many elements at once.
- Respect reduced-motion when possible.

## 3D Decision Rule

Before adding real 3D, always ask:

1. Does this improve the customer buying experience?
2. Can this be done with Tailwind + Framer Motion instead?
3. Will this still feel smooth on mobile?
4. Is there a fallback if 3D fails?
5. Is this isolated from cart, checkout, payment, and order logic?

## Recommended Approach

Start with:
- CSS depth
- layered cards
- floating images
- Framer Motion animations
- hover/tap interactions
- lazy-loaded decorative visuals

Only then consider:
- Spline hero scene
- local GLB model
- React Three Fiber
- Three.js

## Checklist After Changes

- Run build if available.
- Check mobile layout.
- Check RTL and LTR.
- Check loading state.
- Check fallback state.
- Check browser console errors.
- Confirm no backend files changed.