# Transactional notifications: Email and WhatsApp

This document describes **which transactional events use email vs WhatsApp**, how to test safely with the **`log` provider**, and how to use the **Twilio WhatsApp Sandbox** without changing routing or domain logic.

Never commit real `.env` files or secrets (tokens, SID, SMTP passwords). Use `apps/api/.env.example` and a private local `.env` only.

## Email (Nodemailer)

These customer or admin flows use **email only** when `MAIL_*` variables are configured. If SMTP is unset, sends are skipped and core flows continue.

| Event | Recipient | Typical trigger |
|--------|-----------|----------------|
| Password reset | Customer | Auth password-reset request |
| Order confirmed / receipt (credit/Bit paid) | Customer | Payment webhook — payment succeeded |
| Order confirmed (“received”) | Customer | Order status → `confirmed` |
| Payment failed/cancelled (online) | Customer | Payment webhook — failure |
| Bank transfer submitted | Customer + admin (`ADMIN_EMAIL`) | Order created with bank transfer |
| Bank transfer approved / rejected | Customer | Admin updates payment |

## WhatsApp

WhatsApp sends are **additive** and never required for checkout, order persistence, payments, auth, or status transitions. Failures log a warning and return `{ ok: false }`; they **must not throw** back into controllers.

Implementation files (for reference):

- `apps/api/src/services/whatsapp.service.js` — providers (`log`, `twilio`, `meta_cloud`), normalization, transactional send.
- `apps/api/src/services/order-notification.service.js` — delegates order create / status hooks.
- `apps/api/src/services/order-email.service.js` — schedules customer emails vs WhatsApp by status; **WhatsApp idempotency uses the same `order.emailNotifications` map** as email.

### Events routed to WhatsApp

| Event | Recipient | Trigger |
|--------|-----------|---------|
| New order summary | Store admin / owner | Order created (`notifyOrderCreated` → `notifyAdminOfNewOrder`) |
| Order sent with courier | Customer (`customerPhone`) | Order status → `sent_with_delivery_company` |
| Order delivered | Customer | Order status → `delivered` |
| Order cancelled | Customer | Order status → `cancelled` |

Confirmed status uses **email only** (“order received”). Payment and password flows remain **email only**.

### WhatsApp idempotency (unchanged schema)

Repeated successful sends are suppressed using **`order.emailNotifications`** keys:

- `wa_notify:ORDER_SENT_WITH_DELIVERY`
- `wa_notify:ORDER_DELIVERED`
- `wa_notify:ORDER_CANCELLED`

Email idempotency keys are unchanged (`order_notify:*`, payment keys, etc.). There is **no dedicated Mongo notifications collection**.

## Operating modes

### 1. Disabled / not configured

Behavior:

- **`WHATSAPP_NOTIFICATIONS_ENABLED` / `WHATSAPP_ENABLED`** not truthy (`1`, `true`, `yes`, `on`), or provider missing or incomplete credentials.
- Logs a short **`[whatsapp] ... skipping`** info line where applicable.
- Order create / status updates / payments / mail runs are unaffected.

### 2. `WHATSAPP_PROVIDER=log` (safe local testing)

Set:

```env
WHATSAPP_NOTIFICATIONS_ENABLED=true
WHATSAPP_PROVIDER=log
ADMIN_WHATSAPP_PHONE=+9725XXXXXXXX
```

Optional: **`WHATSAPP_ADMIN_PHONE`** (alias for admin destination).

Outbound HTTP is **not required**. Intended messages appear in the API process **`console`** with prefixes like **`[whatsapp] log provider`** including destination digits and body.

Admin notification requires **`ADMIN_WHATSAPP_PHONE` / `WHATSAPP_ADMIN_PHONE`** normalized to a WhatsApp-able number.

### 3. Twilio WhatsApp Sandbox / API

Uses provider string **`twilio`**.

Required variables (prefer these names — aliases are documented in `apps/api/.env.example`):

| Variable | Role |
|-----------|------|
| `WHATSAPP_NOTIFICATIONS_ENABLED` | Must be truthy |
| `WHATSAPP_PROVIDER` | `twilio` |
| `TWILIO_ACCOUNT_SID` or `WHATSAPP_TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` or `WHATSAPP_API_TOKEN` | Twilio Auth Token (used as Bearer/Basic credential for Twilio) |
| `TWILIO_WHATSAPP_FROM` or `WHATSAPP_TWILIO_FROM` | Sandbox “From”, e.g. `whatsapp:+14155238886` |
| **`ADMIN_WHATSAPP_PHONE` / `WHATSAPP_ADMIN_PHONE`** | Admin destination for **new-order** pings |
| Order **`customerPhone`** | Customer destinations for lifecycle templates |

 **`WHATSAPP_TWILIO_FROM` / `TWILIO_WHATSAPP_FROM`** may be written either as **`+14155238886`** or **`whatsapp:+14155238886`**; the API normalizes to **`whatsapp:+...`**.

Sandbox rules (Twilio-side):

- Join the sandbox from WhatsApp using the sandbox join code Twilio gives you before messages reach your device.

### Production / WhatsApp Business

The Twilio Sandbox and demo numbers are for **developers only**. Messaging real customers typically requires WhatsApp approval, a WhatsApp Business / sender onboarding, compliant templates (where Meta requires them), and correct production “From”. Plan that separately — this repo intentionally keeps notifications **transactional** and avoids marketing/broadcast scopes.

## Environment variables (`apps/api/.env`)

See **`apps/api/.env.example`** for placeholders. Summary:

**Feature flag (either name accepted):**

- `WHATSAPP_NOTIFICATIONS_ENABLED` (preferred), or **`WHATSAPP_ENABLED`**

**Provider:**

- `WHATSAPP_PROVIDER` — `meta_cloud` | `twilio` | `log`

**Meta Cloud (alternative provider):**

- `WHATSAPP_API_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

**Twilio:**

- Account SID — `TWILIO_ACCOUNT_SID` or `WHATSAPP_TWILIO_ACCOUNT_SID`
- Auth token — `TWILIO_AUTH_TOKEN` or `WHATSAPP_API_TOKEN`
- From — `TWILIO_WHATSAPP_FROM` or `WHATSAPP_TWILIO_FROM`

**Admin phone (new-order WhatsApp):**

- `ADMIN_WHATSAPP_PHONE` or **`WHATSAPP_ADMIN_PHONE`**

**Links in messages:**

- `ADMIN_BASE_URL` — used in admin new-order WhatsApp summary

Other required API vars (`MONGO_URI`, JWT secrets, etc.) are unrelated to WhatsApp routing; they are documented in `.env.example`.

## Manual testing checklist

Assume API and admin/storefront DB are running with a valid local `.env`.

1. **New order → admin WhatsApp (or log)**  
   Enable WhatsApp with `log`, place an authenticated order via storefront or POST `/orders`. Check API logs for the **new-order** WhatsApp summary.

2. **Sent with courier → customer**  
   In admin set order status to **sent with delivery company**. Customer line should reflect **`on_the_way`** template (`emailNotifications.wa_notify:ORDER_SENT_WITH_DELIVERY` prevents duplicates).

3. **Delivered → customer**  
   Set status to **delivered**; expect **`wa_notify:ORDER_DELIVERED`**.

4. **Cancelled → customer**  
   Set status to **cancelled**; expect **`wa_notify:ORDER_CANCELLED`**.

5. **Password reset → email only**  
   Trigger reset flow; WhatsApp unchanged.

6. **Order confirmation / payment emails → email only**  
   Pay or confirm flows; SMTP side only for those templates.

Repeat status transitions twice to verify **no duplicate WhatsApp sends** once idempotency keys are set.

## Script: quick WhatsApp smoke test

From `apps/api` (needs the same **`MONGO_URI` / JWT** variables as `src/config/env.js` because `.env` is loaded centrally):

```bash
# PowerShell — log provider recommended first
$env:WHATSAPP_PROVIDER="log"
$env:WHATSAPP_NOTIFICATIONS_ENABLED="true"
npm run test:whatsapp
```

The script invokes **sample** admin + customer notification helpers; it exits **0** even when WhatsApp is disabled or misconfigured (with a printed reason).

## Related tests

Automated integration coverage includes `apps/api/tests/integration/whatsapp.test.js` (ordering without fetch when disabled, message shape, transactional send swallowing failures).
