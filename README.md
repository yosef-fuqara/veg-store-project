# Vegetable Store Platform (Phase 1)

This repository contains the approved Phase 1 architecture for a production-ready e-commerce platform:

- `apps/storefront`: customer-facing React app.
- `apps/admin`: admin dashboard React app.
- `apps/api`: Node.js/Express backend API.
- `packages/*`: shared internal packages (types, linting, ts config).
- `docs/*`: architecture, flows, and environment contract.

## Monorepo Structure

```text
apps/
  storefront/
    src/
      app/
      features/
      pages/
      components/
      services/
  admin/
    src/
      app/
      features/
      pages/
      components/
      services/
  api/
    src/
      config/
      models/
      controllers/
      routes/
      middlewares/
      services/
      utils/
      validators/
      constants/
packages/
  shared-types/
  eslint-config/
  tsconfig/
docs/
```

## Phase 1 Artifacts

- Architecture and boundaries: `docs/architecture.md`
- Request and data flow: `docs/request-flow.md`
- Order/payment status model: `docs/status-workflows.md`
- Environment variable contract details: `docs/env-contract.md`
- Environment variable contract:
  - `apps/api/.env.example`
  - `apps/storefront/.env.example`
  - `apps/admin/.env.example`

## Notes

- No business logic is implemented in Phase 1.
- Card data must never be stored in this system.
- Webhook-driven payment updates are part of the backend design.
