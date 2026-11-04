import { subItemDetails, type SubItem } from "@/lib/invoice/sub-item-details";
import { groupSubItems } from "@/lib/invoice/sub-item-groups";
import { Text, View } from "@react-pdf/renderer";
import { Fragment } from "react";

const columns = {
  text: [{ label: "Description", width: "100%" }],
  name: [{ label: "Subject", width: "100%" }],
  hours: [
    { label: "Subject", width: "82%" },
    { label: "Hours", width: "18%" },
  ],
  priced: [
    { label: "Subject", width: "75%" },
    { label: "Amount", width: "25%" },
  ],
  quantity_price: [
    { label: "Subject", width: "52%" },
    { label: "Quantity", width: "12%" },
    { label: "Unit price", width: "18%" },
    { label: "Amount", width: "18%" },
  ],
} as const;

export function PdfSubItems({ items, currency, dark = false }: { items: SubItem[]; currency: string; dark?: boolean }) {
  if (!items.length) return null;
  return (
    <>
      {groupSubItems(items).map((group, groupIndex) => (
        <Fragment key={group.type}>
          <View
            minPresenceAhead={32}
            style={{
              flexDirection: "row",
              marginTop: groupIndex ? 10 : 8,
              color: dark ? "#a3a3a3" : "#737373",
              lineHeight: 1.4,
              paddingBottom: 4,
              borderBottomWidth: 0.5,
              borderBottomColor: dark ? "#525252" : "#d4d4d4",
            }}
          >
            {columns[group.type].map((column, index) => (
              <Text
                key={column.label}
                style={{
                  width: column.width,
                  paddingRight: index ? 0 : 8,
                  textAlign: index ? "right" : "left",
                  fontSize: 8,
                  fontWeight: 600,
                }}
              >
                {column.label}
              </Text>
            ))}
          </View>
          {group.items.map((sub, index) => {
            const cells = [
              sub.type === "text" ? sub.text : sub.name,
              ...subItemDetails(sub, currency).map((detail) => detail.value),
            ];
            return (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  paddingTop: 2,
                  paddingBottom: 2,
                  color: dark ? "#a3a3a3" : "#737373",
                  fontSize: 9,
                  lineHeight: 1.4,
                }}
              >
                {cells.map((value, columnIndex) => (
                  <Text
                    key={columnIndex}
                    style={{
                      width: columns[group.type][columnIndex]!.width,
                      paddingRight: columnIndex ? 0 : 8,
                      paddingLeft: columnIndex ? 6 : 0,
                      textAlign: columnIndex ? "right" : "left",
                    }}
                  >
                    {value}
                  </Text>
                ))}
              </View>
            );
          })}
        </Fragment>
      ))}
    </>
  );
}
