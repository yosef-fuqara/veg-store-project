const serializeAddress = (addr) => ({
  id: String(addr._id),
  label: addr.label || "",
  city: addr.city,
  street: addr.street,
  building: addr.building || "",
  apartment: addr.apartment || "",
  notes: addr.notes || ""
});

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  marketingConsentWhatsApp: user.marketingConsentWhatsApp === true,
  marketingConsentWhatsAppAt: user.marketingConsentWhatsAppAt || null,
  marketingConsentSource: user.marketingConsentSource || null,
  role: user.role,
  addresses: (user.addresses || []).map(serializeAddress),
  defaultAddressId: user.defaultAddressId ? String(user.defaultAddressId) : null,
  favoriteProductIds: (user.favoriteProductIds || []).map((id) => String(id)),
  preferredLanguage: user.preferredLanguage || null,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

module.exports = { sanitizeUser, serializeAddress };
