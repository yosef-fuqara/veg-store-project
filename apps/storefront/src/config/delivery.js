// IMPORTANT: Keep in sync with `apps/api/src/constants/delivery.js`.
// The API does not expose zones over HTTP; keys are validated server-side.

export const DELIVERY_ZONES = [
  { key: "zone_a", label: "Zone A", fee: 15 },
  { key: "zone_b", label: "Zone B", fee: 25 },
  { key: "zone_c", label: "Zone C", fee: 35 }
];

export const getDeliveryFee = (zoneKey) => {
  const zone = DELIVERY_ZONES.find((z) => z.key === zoneKey);
  return zone ? zone.fee : 0;
};

export const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit card" },
  { value: "bit", label: "Bit" },
  { value: "bank_transfer", label: "Bank transfer" }
];
