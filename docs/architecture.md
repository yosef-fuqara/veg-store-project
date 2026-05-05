# Phase 1 Architecture

## System Overview

The platform is split into three deployable apps:

1. `apps/storefront` for customer shopping journeys.
2. `apps/admin` for operational management.
3. `apps/api` for centralized business rules and data access.

This separation keeps customer UX concerns independent from admin operations while enforcing one source of truth in the API.

## Frontend/Backend Separation

### Storefront (`apps/storefront`)
- Public catalog browsing, product details, and search.
- Cart, checkout, authentication, and customer order history.
- Calls backend through versioned API (`/api/v1`).

### Admin Dashboard (`apps/admin`)
- Protected admin routes and role-based access.
- Product/category/order/payment operations.
- Bank transfer approval workflow.

### API (`apps/api`)
- Authentication (JWT + bcrypt).
- Validation boundary (Joi schemas).
- Domain logic for products, categories, orders, and payments.
- Cloudinary upload orchestration.
- Payment provider session creation and webhook handling.

## Design Principles

- Keep all critical calculations on backend (totals, fees, payment transitions).
- Keep order items immutable by snapshotting name/price/unit during order creation.
- Never trust frontend price or stock assertions.
- Implement status transitions as explicit backend rules.
- Keep provider-specific payment code behind a service adapter layer.

## Security Baseline

- JWT access tokens (short-lived) and refresh token rotation.
- Role-based middleware for admin-only routes.
- Joi validation for request payloads and query params.
- Helmet, CORS allowlist, and rate limiting.
- Safe file upload handling with size/type restrictions.
- Payment handled externally; no card data storage.

## Scalability Baseline

- Modular routes/controllers/services structure.
- Clean domain models and constants for enums.
- Idempotent webhook processing for provider callbacks.
- Ready for stateless horizontal scaling of API nodes.
