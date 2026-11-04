import type { SubItem } from "./sub-item-details";

export const subItemTypeOrder = ["text", "name", "hours", "priced", "quantity_price"] as const;

/** Presentation order only: the invoice and the order within each type stay intact. */
export function groupSubItems(items: SubItem[]) {
  return subItemTypeOrder
    .map((type) => ({ type, items: items.filter((item) => item.type === type) }))
    .filter((group) => group.items.length > 0);
}
