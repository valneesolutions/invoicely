"use client";
import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import type { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/client-auth";
import { useTRPC } from "@/trpc/client";
export function SavedClientSelector({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) {
  const trpc = useTRPC(),
    { data: session } = useSession();
  const clients = useQuery({ ...trpc.clients.list.queryOptions(), enabled: !!session?.user });
  if (!session?.user) return null;
  return (
    <div className="space-y-1">
      <label htmlFor="saved-client" className="text-xs font-medium">
        Saved client
      </label>
      <select
        id="saved-client"
        value=""
        disabled={clients.isPending || clients.isError}
        className="bg-background w-full min-w-0 rounded border p-2 text-sm"
        onChange={(e) => {
          const client = clients.data?.find((c) => c.id === e.target.value);
          if (!client) return;
          if (
            form.formState.dirtyFields.clientDetails &&
            !window.confirm("Replace the edited client details with this saved client?")
          )
            return;
          form.setValue(
            "clientDetails",
            { name: client.name, address: client.address, metadata: structuredClone(client.metadata) },
            { shouldDirty: true, shouldValidate: true },
          );
        }}
      >
        <option value="">{clients.isPending ? "Loading clients…" : "Choose a saved client"}</option>
        {clients.data?.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
            {client.address ? ` — ${client.address.split("\n")[0]}` : ""}
          </option>
        ))}
      </select>
      {clients.isError && (
        <p role="alert" className="text-destructive text-xs">
          Could not load saved clients. You can still enter details manually.
        </p>
      )}
    </div>
  );
}
