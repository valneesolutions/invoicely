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
import { BoxIcon, BoxPlusIcon, TrashIcon } from "@/assets/icons";
import { FormInput } from "@/components/ui/form/form-input";
import { formatCurrencyText } from "@/constants/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import FormRow from "@/components/ui/form/form-row";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface InvoiceItemsSectionProps {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
}
type InvoiceItem = ZodCreateInvoiceSchema["items"][number];

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({ form }) => {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Rendering the items */}
      {fields.length > 0 && (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => {
            const isCredit = field.type === "credit";
            return (
              <div
                className={cn(
                  "flex w-full flex-row justify-between gap-2 rounded-md p-3",
                  isCredit ? "border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20" : "bg-muted/50",
                )}
                key={field.id}
              >
                <div className="flex w-full flex-row gap-2">
                  <div
                    className={cn(
                      "grid aspect-square h-full place-items-center rounded-md",
                      isCredit ? "bg-red-100 dark:bg-red-900/30" : "bg-muted-foreground/20",
                    )}
                  >
                    <BoxIcon className={cn(isCredit ? "text-red-500" : "")} />
                  </div>
                  <div className="w-full">
                    <div className="flex items-center gap-1.5">
                      <div className="line-clamp-1 text-sm font-medium">{field.name}</div>
                      {isCredit && (
                        <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                          CREDIT
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground line-clamp-1 text-xs">{field.description}</div>
                    <div className={cn("text-[10px] font-medium", isCredit ? "text-red-500" : "text-primary")}>
                      {isCredit ? "− " : ""}
                      {formatCurrencyText(form.watch("invoiceDetails.currency"), field.unitPrice)}{" "}
                      <span className="text-muted-foreground">x {field.quantity} Qty</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex flex-col items-end justify-between gap-1">
                    <div className="flex flex-row gap-1.5">
                      <HandleItemModal
                        type="edit"
                        itemType={field.type ?? "item"}
                        append={append}
                        update={update}
                        editingIndex={index}
                        data={field}
                      >
                        <Button
                          type="button"
                          className="text-muted-foreground h-5.5 w-5.5 rounded"
                          variant="ghost"
                          size="icon"
                        >
                          <PencilIcon className="size-3" />
                        </Button>
                      </HandleItemModal>
                      <Button
                        className="h-5.5 w-5.5 rounded"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <TrashIcon className="size-3" />
                      </Button>
                    </div>
                    <div className="flex flex-row items-center gap-1">
                      <p className={cn("space-x-1 text-[10px] whitespace-nowrap", isCredit ? "text-red-500" : "")}>
                        <span>{isCredit ? "Deduct:" : "Total:"}</span>
                        <span>
                          {isCredit ? "− " : ""}
                          {formatCurrencyText(form.watch("invoiceDetails.currency"), field.unitPrice * field.quantity)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Buttons for adding item / credit */}
      <div className="flex flex-col gap-1.5 sm:flex-row">
        <HandleItemModal type="add" itemType="item" append={append} update={update}>
          <Button type="button" className="w-full border-dashed" variant="outline">
            <BoxPlusIcon />
            Add Item
          </Button>
        </HandleItemModal>
        <HandleItemModal type="add" itemType="credit" append={append} update={update}>
          <Button
            type="button"
            className="w-full border-dashed border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400"
            variant="outline"
          >
            <BoxPlusIcon />
            Add Credit
          </Button>
        </HandleItemModal>
      </div>
    </div>
  );
};

export default InvoiceItemsSection;

interface AddItemModalProps {
  type: "add" | "edit";
  itemType: "item" | "credit";
  children: React.ReactNode;
  data?: InvoiceItem;
  editingIndex?: number | null;
  append: (data: InvoiceItem) => void;
  update: (index: number, data: InvoiceItem) => void;
}

const HandleItemModal = ({ type, itemType, append, update, editingIndex, data, children }: AddItemModalProps) => {
  const [open, setOpen] = useState(false);

  const invoiceItemForm = useForm<InvoiceItem>({
    resolver: zodResolver(createInvoiceItemSchema),
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      quantity: data?.quantity || 1,
      unitPrice: data?.unitPrice || 1,
      type: data?.type ?? itemType,
    },
  });

  const onHandleSubmit = (formData: InvoiceItem) => {
    const itemWithType: InvoiceItem = { ...formData, type: data?.type ?? itemType };
    if (type === "edit" && typeof editingIndex === "number") {
      update(editingIndex, itemWithType);
    } else {
      append(itemWithType);
    }

    invoiceItemForm.reset();
    setOpen(false);
  };

  const isCredit = itemType === "credit";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Form {...invoiceItemForm}>
          <form onSubmit={invoiceItemForm.handleSubmit(onHandleSubmit)}>
            <DialogHeaderContainer>
              <DialogIcon>
                <BoxPlusIcon />
              </DialogIcon>
              <DialogHeader>
                <DialogTitle>{isCredit ? "Add Credit" : "Add Item"}</DialogTitle>
                <DialogDescription>
                  {isCredit
                    ? "Add a credit (refund/deduction) to the invoice. The amount will be subtracted from the total."
                    : "Add an item to the invoice"}
                </DialogDescription>
              </DialogHeader>
            </DialogHeaderContainer>
            <DialogContentContainer>
              <FormInput
                label={isCredit ? "Credit Name" : "Item Name"}
                name="name"
                placeholder={isCredit ? "Refund for Widget" : "Item Name"}
                reactform={invoiceItemForm}
              />
              <FormInput
                label="Description"
                name="description"
                placeholder={isCredit ? "Reason for credit" : "Item Description"}
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
                  label={isCredit ? "Credit Amount (per unit)" : "Unit Price"}
                  name="unitPrice"
                  placeholder="Amount"
                  reactform={invoiceItemForm}
                />
              </FormRow>
            </DialogContentContainer>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                className={isCredit ? "bg-red-600 text-white hover:bg-red-700" : ""}
              >
                {isCredit ? "Add Credit" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
