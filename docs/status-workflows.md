# Status Workflows

## Order Status

`new` -> `confirmed` -> `sent_with_delivery_company` -> `delivered`

Cancellation path:

- `new` or `confirmed` -> `cancelled` (policy controlled in API service layer)

## Payment Status

- Online methods (`credit_card`, `bit`):
  - start at `pending_payment`
  - then `paid` or `failed` or `cancelled`
- Manual transfer (`bank_transfer`):
  - starts at `bank_transfer_pending`
  - admin review transitions to `bank_transfer_approved` or remains pending/rejected policy

## Canonical Enums

### OrderStatus

- `new`
- `confirmed`
- `sent_with_delivery_company`
- `delivered`
- `cancelled`

### PaymentStatus

- `pending_payment`
- `paid`
- `failed`
- `cancelled`
- `bank_transfer_pending`
- `bank_transfer_approved`

### PaymentMethod

- `credit_card`
- `bit`
- `bank_transfer`

## Rules to Enforce in Backend

- Do not allow arbitrary direct status jumps.
- Enforce transition map in one service (single source of truth).
- Keep payment provider status mapping explicit and versioned.
- Persist provider transaction references and raw responses safely for audits.

## Legacy order statuses (removed)

Older deployments may still have documents with `seen`, `preparing`, or `ready_for_delivery`. Run the one-off migration from `apps/api`:

`npm run migrate:order-status-prune`
