const ORDER_STATUS = {
  NEW: "new",
  CONFIRMED: "confirmed",
  SENT_WITH_DELIVERY_COMPANY: "sent_with_delivery_company",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

const PAYMENT_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
  BANK_TRANSFER_PENDING: "bank_transfer_pending",
  BANK_TRANSFER_APPROVED: "bank_transfer_approved"
};

const PAYMENT_METHOD = {
  CREDIT_CARD: "credit_card",
  BIT: "bit",
  BANK_TRANSFER: "bank_transfer",
  PAY_AT_PICKUP: "pay_at_pickup"
};

const FULFILLMENT_TYPE = {
  DELIVERY: "delivery",
  PICKUP: "pickup"
};

module.exports = { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, FULFILLMENT_TYPE };
