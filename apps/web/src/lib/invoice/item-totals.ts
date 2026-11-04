import Decimal from "decimal.js";

export type FinancialSubItem = {
  type: string;
  amount?: Decimal.Value;
  quantity?: Decimal.Value;
  unitPrice?: Decimal.Value;
};
export type FinancialItem = { quantity: Decimal.Value; unitPrice: Decimal.Value; subItems?: FinancialSubItem[] };
export const Money = Decimal.clone({ precision: 64, rounding: Decimal.ROUND_HALF_UP });
export function getSubItemAmount(sub: FinancialSubItem): Decimal {
  if (sub.type === "priced") return new Money(sub.amount ?? 0);
  if (sub.type === "quantity_price") return new Money(sub.quantity ?? 0).times(sub.unitPrice ?? 0);
  return new Money(0);
}
export function getItemAmount(item: FinancialItem): Decimal {
  return (item.subItems ?? []).reduce(
    (sum, sub) => sum.plus(getSubItemAmount(sub)),
    new Money(item.quantity).times(item.unitPrice),
  );
}
