"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContentContainer,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderContainer,
  DialogIcon,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createInvoiceItemSchema, ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { SubItemSummary } from "@/components/invoice/sub-item-summary";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { BoxIcon, BoxPlusIcon, TrashIcon } from "@/assets/icons";
import { getInvoiceItemTotal } from "@/constants/pdf-helpers";
import { FormInput } from "@/components/ui/form/form-input";
import { GripVerticalIcon, PencilIcon } from "lucide-react";
import { formatCurrencyText } from "@/constants/currency";
import { BulkInvoiceItems } from "./bulk-invoice-items";
import { zodResolver } from "@hookform/resolvers/zod";
import FormRow from "@/components/ui/form/form-row";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Reorder } from "motion/react";

interface InvoiceItemsSectionProps {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
}
type InvoiceItem = ZodCreateInvoiceSchema["items"][number];

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({ form }) => {
  const { fields, append, remove, update, move } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onReorder = (newIds: string[]) => {
    const oldIds = fields.map((field) => field.id);
    const reorder = getSingleMove(oldIds, newIds);
    if (reorder) move(reorder.from, reorder.to);
  };

  return (
    <div className="flex flex-col gap-2">
      <BulkInvoiceItems form={form} append={append} />
      {/* Rendering the items */}
      {fields.length > 0 && (
        <Reorder.Group
          axis="y"
          values={fields.map((field) => field.id)}
          onReorder={onReorder}
          className="flex flex-col gap-2"
        >
          {fields.map((field, index) => (
            <Reorder.Item
              value={field.id}
              key={field.id}
              className="bg-muted/50 flex w-full cursor-grab flex-row justify-between gap-2 rounded-md p-3 active:cursor-grabbing"
            >
              <div className="flex min-w-0 flex-1 flex-row gap-2">
                <div className="text-muted-foreground grid h-full place-items-center">
                  <GripVerticalIcon className="size-4" />
                </div>
                <div className="bg-muted-foreground/20 grid size-8 shrink-0 place-items-center rounded-md">
                  <BoxIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-sm font-medium">{field.name}</div>
                  <div className="text-muted-foreground line-clamp-1 text-xs">{field.description}</div>
                  <div className="mt-2 pl-2">
                    {(field.subItems ?? []).map((sub, i) => (
                      <SubItemSummary key={i} sub={sub} currency={form.watch("invoiceDetails.currency")} />
                    ))}
                  </div>
                  <div className="text-primary text-[10px] font-medium">
                    {formatCurrencyText(form.watch("invoiceDetails.currency"), field.unitPrice)}{" "}
                    <span className="text-muted-foreground">x {field.quantity} Qty</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-row gap-2">
                <div className="flex flex-col items-end justify-between gap-1">
                  <div className="flex flex-row gap-1.5">
                    <HandleItemModal type="edit" append={append} update={update} editingIndex={index} data={field}>
                      <Button
                        type="button"
                        aria-label={`Edit item ${index + 1}`}
                        className="text-muted-foreground h-5.5 w-5.5 rounded"
                        variant="ghost"
                        size="icon"
                      >
                        <PencilIcon className="size-3" />
                      </Button>
                    </HandleItemModal>
                    <Button
                      type="button"
                      aria-label={`Remove item ${index + 1}`}
                      className="h-5.5 w-5.5 rounded"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                  <div className="flex flex-row items-center gap-1">
                    <p className="space-x-1 text-[10px] whitespace-nowrap">
                      <span>Total:</span>
                      <span>
                        {formatCurrencyText(form.watch("invoiceDetails.currency"), getInvoiceItemTotal(field))}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
      {/* Dialog for adding a new item */}
      <HandleItemModal type="add" append={append} update={update}>
        <Button type="button" className="w-full border-dashed" variant="outline">
          <BoxPlusIcon />
          Add Item
        </Button>
      </HandleItemModal>
    </div>
  );
};

export default InvoiceItemsSection;

// Derives a single move(from, to) from the old vs new id ordering produced by a drag.
const getSingleMove = (oldIds: string[], newIds: string[]): { from: number; to: number } | null => {
  let start = 0;
  while (start < oldIds.length && oldIds[start] === newIds[start]) start++;

  let end = oldIds.length - 1;
  while (end >= 0 && oldIds[end] === newIds[end]) end--;

  if (start > end) return null;

  // Forward move if the element at `start` slid down to `end`, otherwise backward.
  return oldIds[start] === newIds[end] ? { from: start, to: end } : { from: end, to: start };
};

interface AddItemModalProps {
  type: "add" | "edit";
  children: React.ReactNode;
  data?: InvoiceItem;
  editingIndex?: number | null;
  append: (data: InvoiceItem) => void;
  update: (index: number, data: InvoiceItem) => void;
}

const HandleItemModal = ({ type, append, update, editingIndex, data, children }: AddItemModalProps) => {
  const [open, setOpen] = useState(false);

  const invoiceItemForm = useForm<InvoiceItem>({
    resolver: zodResolver(createInvoiceItemSchema),
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      quantity: data?.quantity || 1,
      unitPrice: data?.unitPrice ?? 1,
      subItems: data?.subItems || [],
    },
  });

  const onHandleSubmit = (data: InvoiceItem) => {
    if (type === "edit" && typeof editingIndex === "number") {
      update(editingIndex, data);
    } else {
      append(data);
    }

    // Clean up the form
    invoiceItemForm.reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen)
          invoiceItemForm.reset({
            name: data?.name ?? "",
            description: data?.description ?? "",
            quantity: data?.quantity ?? 1,
            unitPrice: data?.unitPrice ?? 1,
            subItems: data?.subItems ?? [],
          });
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <Form {...invoiceItemForm}>
          <form onSubmit={invoiceItemForm.handleSubmit(onHandleSubmit)}>
            <DialogHeaderContainer>
              <DialogIcon>
                <BoxPlusIcon />
              </DialogIcon>
              <DialogHeader>
                <DialogTitle>{type === "edit" ? "Edit Item" : "Add Item"}</DialogTitle>
                <DialogDescription>Add an item to the invoice</DialogDescription>
              </DialogHeader>
            </DialogHeaderContainer>
            <DialogContentContainer>
              <FormInput label="Item Name" name="name" placeholder="Item Name" reactform={invoiceItemForm} />
              <FormInput
                label="Item Description"
                name="description"
                placeholder="Item Description"
                reactform={invoiceItemForm}
              />
              <FormRow>
                <FormInput
                  type="number"
                  label="Quantity"
                  name="quantity"
                  placeholder="Quantity"
                  reactform={invoiceItemForm}
                />
                <FormInput
                  type="number"
                  label="Unit Price"
                  name="unitPrice"
                  placeholder="Unit Price"
                  reactform={invoiceItemForm}
                />
              </FormRow>
              <SubItemsEditor form={invoiceItemForm} />
            </DialogContentContainer>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{type === "edit" ? "Save Item" : "Add Item"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const SubItemsEditor = ({ form }: { form: UseFormReturn<InvoiceItem> }) => {
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "subItems" });
  const subItems = form.watch("subItems") ?? [];
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Sub-items</span>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ type: "text", text: "" })}>
          Add sub-item
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">Prices are added once to this item, regardless of its quantity.</p>
      {fields.map((field, index) => {
        const sub = subItems[index];
        return (
          <div key={field.id} className="space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs" htmlFor={`sub-item-type-${index}`}>
                Content
              </label>
              <select
                id={`sub-item-type-${index}`}
                className="bg-background h-10 w-full min-w-0 rounded border px-3 text-sm sm:w-64"
                value={sub?.type ?? "text"}
                onChange={(e) => {
                  const value = sub?.type === "text" ? sub.text : (sub?.name ?? "");
                  form.setValue(
                    `subItems.${index}`,
                    e.target.value === "text"
                      ? { type: "text", text: value }
                      : e.target.value === "name"
                        ? { type: "name", name: value }
                        : e.target.value === "hours"
                          ? { type: "hours", name: value, hours: sub?.type === "hours" ? sub.hours : 0 }
                          : e.target.value === "quantity_price"
                            ? {
                                type: "quantity_price",
                                name: value,
                                quantity: sub?.type === "quantity_price" ? sub.quantity : 1,
                                unitPrice: sub?.type === "quantity_price" ? sub.unitPrice : 0,
                              }
                            : { type: "priced", name: value, amount: sub?.type === "priced" ? sub.amount : 0 },
                    { shouldDirty: true, shouldValidate: true },
                  );
                }}
              >
                <option value="text">Text / description</option>
                <option value="name">Name</option>
                <option value="priced">Name + price</option>
                <option value="hours">Name + Hours</option>
                <option value="quantity_price">Name + Quantity + Unit price</option>
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move sub-item ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move sub-item ${index + 1} down`}
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove sub-item ${index + 1}`}
                onClick={() => remove(index)}
              >
                ×
              </Button>
            </div>
            {sub?.type === "text" ? (
              <FormTextarea
                label="Text"
                name={`subItems.${index}.text`}
                placeholder="Description or list"
                reactform={form}
              />
            ) : (
              <FormInput label="Name" name={`subItems.${index}.name`} placeholder="Name" reactform={form} />
            )}
            {sub?.type === "hours" && (
              <FormInput
                type="number"
                min="0"
                step="any"
                label="Hours (descriptive only)"
                name={`subItems.${index}.hours`}
                reactform={form}
              />
            )}
            {sub?.type === "quantity_price" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormInput
                  type="number"
                  min="0"
                  step="any"
                  label="Quantity"
                  name={`subItems.${index}.quantity`}
                  reactform={form}
                />
                <FormInput
                  type="number"
                  min="0"
                  step="0.01"
                  label="Unit price"
                  name={`subItems.${index}.unitPrice`}
                  reactform={form}
                />
              </div>
            )}
            {sub?.type === "priced" && (
              <FormInput
                type="number"
                min="0"
                step="0.01"
                label="Amount"
                name={`subItems.${index}.amount`}
                placeholder="0"
                reactform={form}
              />
            )}
          </div>
        );
      })}
    </section>
  );
};
