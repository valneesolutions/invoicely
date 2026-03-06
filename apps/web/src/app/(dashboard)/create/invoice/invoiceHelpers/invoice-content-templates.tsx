"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContentContainer,
  DialogFooter,
  DialogHeader,
  DialogHeaderContainer,
  DialogIcon,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "@/assets/icons";
import { BookmarkIcon, BookmarkPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { useSession } from "@/lib/client-auth";
import { useTRPC } from "@/trpc/client";
import React, { useState } from "react";
import { toast } from "sonner";

interface InvoiceContentTemplatesProps {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
}

const InvoiceContentTemplates: React.FC<InvoiceContentTemplatesProps> = ({ form }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Fetch user's saved templates
  const templates = useQuery({
    ...trpc.template.list.queryOptions(),
    enabled: !!session?.user,
  });

  // Save template mutation
  const saveTemplateMutation = useMutation(
    trpc.template.insert.mutationOptions({
      onSuccess: () => {
        toast.success("Template saved!", { description: `"${templateName}" has been saved.` });
        queryClient.invalidateQueries({ queryKey: trpc.template.list.queryKey() });
        setTemplateName("");
        setSaveDialogOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to save template", { description: error.message });
      },
    }),
  );

  // Delete template mutation
  const deleteTemplateMutation = useMutation(
    trpc.template.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Template deleted");
        queryClient.invalidateQueries({ queryKey: trpc.template.list.queryKey() });
        if (selectedTemplateId) setSelectedTemplateId(null);
      },
      onError: (error) => {
        toast.error("Failed to delete template", { description: error.message });
      },
    }),
  );

  // Get full template data when selected
  const selectedTemplate = useQuery({
    ...trpc.template.get.queryOptions({ id: selectedTemplateId ?? "" }),
    enabled: !!selectedTemplateId,
  });

  const handleLoadTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // Apply template data to form when fetched
  React.useEffect(() => {
    if (selectedTemplate.data) {
      const rawData = selectedTemplate.data.data as ZodCreateInvoiceSchema & {
        invoiceDetails: {
          date: string | Date;
          dueDate?: string | Date | null;
        };
      };
      // Parse dates (stored as JSON strings in the DB)
      form.reset({
        ...rawData,
        invoiceDetails: {
          ...rawData.invoiceDetails,
          date: new Date(), // reset to today
          dueDate: rawData.invoiceDetails.dueDate ? new Date(rawData.invoiceDetails.dueDate) : undefined,
        },
      });
      toast.success("Template loaded", {
        description: "Invoice form has been pre-filled. You can adjust the dates.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate.data]);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplateMutation.mutate({ name: templateName.trim(), data: form.getValues() });
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTemplateMutation.mutate({ id });
  };

  const templateList = templates.data ?? [];

  return (
    <div className="flex flex-row items-center gap-2">
      {/* Template Loader dropdown */}
      <Select
        value={selectedTemplateId ?? undefined}
        onValueChange={handleLoadTemplate}
        disabled={!session?.user || templates.isLoading}
      >
        <SelectTrigger className="h-8 min-w-34 text-xs">
          <SelectValue placeholder={templates.isLoading ? "Loading..." : "Load template"} />
        </SelectTrigger>
        <SelectContent align="end">
          {templateList.length === 0 ? (
            <div className="text-muted-foreground px-2 py-4 text-center text-xs">No saved templates</div>
          ) : (
            templateList.map((tpl) => (
              <SelectItem key={tpl.id} value={tpl.id} className="pr-2">
                <div className="flex w-full flex-row items-center justify-between gap-2">
                  <span className="truncate">{tpl.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-4 w-4 shrink-0"
                    onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                    disabled={deleteTemplateMutation.isPending}
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Save as Template button */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={!session?.user}
          >
            <BookmarkPlusIcon className="size-3" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeaderContainer>
            <DialogIcon>
              <BookmarkIcon />
            </DialogIcon>
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
            </DialogHeader>
          </DialogHeaderContainer>
          <DialogContentContainer>
            <div className="flex flex-col gap-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Standard Client Invoice"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTemplate();
                }}
              />
              <p className="text-muted-foreground text-xs">
                Saves the current form state (company, client, items, billing) as a reusable template.
              </p>
            </div>
          </DialogContentContainer>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || saveTemplateMutation.isPending}
            >
              {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceContentTemplates;
