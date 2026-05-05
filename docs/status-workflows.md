# Status Workflows

## Order Status

`new` -> `confirmed` -> `preparing` -> `ready_for_delivery` -> `sent_with_delivery_company` -> `delivered`

Cancellation path:

- `new` or `confirmed` or `preparing` -> `cancelled` (policy controlled in API service layer)

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
- `preparing`
- `ready_for_delivery`
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
