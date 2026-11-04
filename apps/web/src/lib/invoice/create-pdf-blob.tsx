import { PdfTemplateName } from "@/app/(dashboard)/create/invoice/invoiceHelpers/invoice-templates";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { normalizeInvoiceFields } from "./normalize-invoice";
import { DefaultPDF, VercelPDF } from "@/components/pdf";
import { createSerialTaskQueue } from "./serial-task";
import { pdf } from "@react-pdf/renderer";

interface CreatePdfBlobProps {
  template: PdfTemplateName;
  invoiceData: ZodCreateInvoiceSchema;
}

const renderSerially = createSerialTaskQueue();

export const createPdfBlob = ({ invoiceData, template }: CreatePdfBlobProps): Promise<Blob> => {
  // Parse produces an independent snapshot and repairs legacy optional sections before rendering.
  const data = createInvoiceSchema.parse(normalizeInvoiceFields(invoiceData));
  return renderSerially(async () => {
    const Template = getPdfTemplate(template);
    return pdf(<Template data={data} />).toBlob();
  });
};

const getPdfTemplate = (template: CreatePdfBlobProps["template"]) => {
  // if there is no template, fallback to default
  if (!template) {
    return DefaultPDF;
  }

  // else return the specified tempalte
  switch (template) {
    case "vercel":
      return VercelPDF;
    default:
      return DefaultPDF;
  }
};
