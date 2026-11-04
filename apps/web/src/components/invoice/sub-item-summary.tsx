import { subItemDetails, type SubItem } from "@/lib/invoice/sub-item-details";
export function SubItemSummary({ sub, currency }: { sub: SubItem; currency: string }) {
  return (
    <div className="text-muted-foreground space-y-1 py-1 text-xs">
      <p className="break-words whitespace-pre-wrap">{sub.type === "text" ? sub.text : sub.name}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {subItemDetails(sub, currency).map((detail) => (
          <div key={detail.label}>
            <span className="mr-2 text-[10px]">{detail.label}</span>
            <span className="font-medium">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
