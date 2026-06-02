import * as cartService from "../services/cartService";

/**
 * Best-effort: add order line items to cart (quantity mode only).
 * @returns {{ added: number, skipped: number }}
 */
export async function reorderFromOrder(order) {
  const items = order?.items || [];
  let added = 0;
  let skipped = 0;

  for (const item of items) {
    const productId = item.product?._id || item.product;
    if (!productId) {
      skipped += 1;
      continue;
    }
    if (item.purchaseMode === "amount" && item.requestedAmountIls != null) {
      try {
        await cartService.addCartItem(String(productId), 1, {
          purchaseAmountIls: item.requestedAmountIls,
          wrap: Boolean(item.wrap)
        });
        added += 1;
      } catch {
        skipped += 1;
      }
      continue;
    }
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      skipped += 1;
      continue;
    }
    try {
      await cartService.addCartItem(String(productId), qty, { wrap: Boolean(item.wrap) });
      added += 1;
    } catch {
      skipped += 1;
    }
  }

  return { added, skipped };
}
