import { subItemDetails, type SubItem } from "@/lib/invoice/sub-item-details";
import { Text, View } from "@react-pdf/renderer";
export function PdfSubItems({ items, currency, dark = false }: { items: SubItem[]; currency: string; dark?: boolean }) {
  if (!items.length) return null;
  return (
    <View style={{ marginTop: 6, paddingLeft: 6, color: dark ? "#a3a3a3" : "#737373", fontSize: 9, lineHeight: 1.4 }}>
      {items.map((sub, i) => (
        <View key={i} style={{ marginBottom: 5 }}>
          <Text minPresenceAhead={14}>{sub.type === "text" ? sub.text : sub.name}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2 }}>
            {subItemDetails(sub, currency).map((detail) => (
              <View key={detail.label} style={{ minWidth: 55, marginRight: 12, marginBottom: 2 }}>
                <Text style={{ fontSize: 7 }}>{detail.label}</Text>
                <Text>{detail.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
