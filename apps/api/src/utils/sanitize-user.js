const serializeAddress = (addr) => ({
  id: String(addr._id),
  label: addr.label || "",
  city: addr.city,
  cityKey: addr.cityKey || "",
  street: addr.street,
  houseNumber: addr.houseNumber || addr.building || "",
  building: addr.building || "",
  apartment: addr.apartment || "",
  floor: addr.floor || "",
  entrance: addr.entrance || "",
  notes: addr.notes || "",
  fullAddress: addr.fullAddress || ""
});

const serializeMarketing = (user) => {
  const m = user.marketing || {};
  const consent =
    typeof m.consent === "boolean" ? m.consent : user.marketingConsentWhatsApp === true;
  return {
    consent,
    consentAt: m.consentAt || user.marketingConsentWhatsAppAt || null,
    consentSource: m.consentSource || user.marketingConsentSource || null,
    consentTextVersion: m.consentTextVersion || null,
    consentLanguage: m.consentLanguage || null,
    channels: {
      whatsapp: m.channels?.whatsapp ?? consent,
      sms: m.channels?.sms ?? false,
      email: m.channels?.email ?? false
    },
    unsubscribedAt: m.unsubscribedAt || null,
    unsubscribeSource: m.unsubscribeSource || null
  };
};

const serializeCustomerClub = (user) => {
  const c = user.customerClub || {};
  return {
    joined: c.joined === true,
    joinedAt: c.joinedAt || null,
    termsVersion: c.termsVersion || null,
    joinedLanguage: c.joinedLanguage || null,
    leftAt: c.leftAt || null,
    status: c.status || null
  };
};

const serializeLegal = (user) => {
  const l = user.legal || {};
  return {
    acceptedTerms: l.acceptedTerms === true,
    acceptedTermsAt: l.acceptedTermsAt || null,
    acceptedTermsVersion: l.acceptedTermsVersion || null,
    acceptedPrivacyVersion: l.acceptedPrivacyVersion || null,
    acceptedShippingPolicyVersion: l.acceptedShippingPolicyVersion || null,
    acceptedCancellationPolicyVersion: l.acceptedCancellationPolicyVersion || null,
    acceptedFrom: l.acceptedFrom || null,
    acceptedLanguage: l.acceptedLanguage || null
  };
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  marketingConsentWhatsApp: user.marketingConsentWhatsApp === true,
  marketingConsentWhatsAppAt: user.marketingConsentWhatsAppAt || null,
  marketingConsentSource: user.marketingConsentSource || null,
  marketing: serializeMarketing(user),
  customerClub: serializeCustomerClub(user),
  legal: serializeLegal(user),
  savedDetails: {
    saveForNextOrder: user.savedDetails?.saveForNextOrder === true,
    savedAt: user.savedDetails?.savedAt || null
  },
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
