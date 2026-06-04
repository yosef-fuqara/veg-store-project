/** Map server checkout preview to storefront cart shape (drawer / cart page). */
export function cartFromGuestCheckoutPreview(preview) {
  const items = (preview?.items || []).map((item) => ({
    product: item.product,
    quantity: item.quantity,
    unitPriceSnapshot: item.unitPrice,
    lineProductSubtotal: item.lineTotal,
    purchaseMode: item.purchaseMode,
    requestedAmountIls: item.requestedAmountIls,
    wrap: Boolean(item.wrap),
    wrapFee: Number(item.wrapFee) || 0,
    productSnapshot: {
      name: item.nameLocales || item.name,
      unit: item.unit,
      imageUrl: item.imageUrl || "",
      wrapAvailable: Boolean(item.wrapAvailable),
      isPreorderOnly: Boolean(item.isPreorderOnly),
      minAdvanceHours: Number(item.minAdvanceHours) || 0
    }
  }));

  const subtotal = Number(preview?.subtotal) || 0;
  const wrapTotal = Number(preview?.wrapTotal) || 0;
  const payableTotal =
    typeof preview?.payableSubtotalAndWrap === "number"
      ? preview.payableSubtotalAndWrap
      : Math.floor(subtotal + wrapTotal + Number.EPSILON);

  return { items, subtotal, wrapTotal, payableTotal };
}

/** Minimal lines persisted in localStorage and sent to guest preview/order APIs. */
export function guestLinesFromCartItems(cartItems) {
  return (cartItems || []).map((item) => {
    const isAmount =
      item.purchaseMode === "amount" && item.requestedAmountIls != null;
    if (isAmount) {
      return {
        product: String(item.product),
        purchaseAmountIls: Number(item.requestedAmountIls),
        wrap: Boolean(item.wrap)
      };
    }
    return {
      product: String(item.product),
      quantity: Math.max(0.01, Number(item.quantity) || 1),
      wrap: Boolean(item.wrap)
    };
  });
}

export function mergeGuestAddLine(lines, productId, quantity = 1, options = {}) {
  const id = String(productId);
  const byAmount = typeof options.purchaseAmountIls === "number";
  const existingIdx = lines.findIndex((l) => String(l.product) === id);

  if (byAmount) {
    const amt = Number(options.purchaseAmountIls);
    if (existingIdx >= 0) {
      const existing = lines[existingIdx];
      if (typeof existing.purchaseAmountIls !== "number") {
        return lines;
      }
      const next = [...lines];
      next[existingIdx] = {
        ...existing,
        purchaseAmountIls: Number(existing.purchaseAmountIls) + amt
      };
      return next;
    }
    return [...lines, { product: id, purchaseAmountIls: amt, wrap: Boolean(options.wrap) }];
  }

  if (existingIdx >= 0) {
    const existing = lines[existingIdx];
    if (typeof existing.purchaseAmountIls === "number") {
      return lines;
    }
    const next = [...lines];
    next[existingIdx] = {
      ...existing,
      quantity: Math.max(0.01, Number(existing.quantity) + Number(quantity))
    };
    return next;
  }

  return [
    ...lines,
    {
      product: id,
      quantity: Math.max(0.01, Number(quantity) || 1),
      wrap: Boolean(options.wrap)
    }
  ];
}

export function mergeGuestUpdateLine(lines, productId, updates) {
  const id = String(productId);
  const idx = lines.findIndex((l) => String(l.product) === id);
  if (idx < 0) return lines;

  const existing = lines[idx];
  const next = [...lines];

  if (typeof updates.purchaseAmountIls === "number") {
    next[idx] = { ...existing, purchaseAmountIls: updates.purchaseAmountIls };
    return next;
  }

  if (typeof updates.quantity === "number") {
    next[idx] = { ...existing, quantity: updates.quantity };
    return next;
  }

  if (typeof updates.wrap === "boolean") {
    next[idx] = { ...existing, wrap: updates.wrap };
    return next;
  }

  return lines;
}

export function removeGuestLine(lines, productId) {
  const id = String(productId);
  return lines.filter((l) => String(l.product) !== id);
}
