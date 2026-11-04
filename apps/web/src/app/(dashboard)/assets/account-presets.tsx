"use client";
import {
  savedClientSchema,
  paymentPreferencesSchema,
  type SavedClientInput,
  type PaymentPreferencesInput,
} from "@/zod-schemas/invoice/presets";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDefaultDetails } from "@/lib/indexdb-queries/defaultDetails";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { FormInput } from "@/components/ui/form/form-input";
import { useForm, useFieldArray } from "react-hook-form";
import { useTRPC, trpcProxyClient } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/client-auth";
import { useState } from "react";
import { toast } from "sonner";
const emptyClient: SavedClientInput = { name: "", address: "", metadata: [] };

export function AccountPresets() {
  const { data: session } = useSession();
  if (!session?.user)
    return (
      <p className="text-muted-foreground p-4 text-sm">
        Sign in to save clients and payment information across devices.
      </p>
    );
  return (
    <div className="space-y-8">
      <SavedClients />
      <PaymentDefaults />
    </div>
  );
}
function SavedClients() {
  const trpc = useTRPC(),
    cache = useQueryClient();
  const clients = useQuery(trpc.clients.list.queryOptions());
  const local = useQuery({ queryKey: ["idb-default-details"], queryFn: getDefaultDetails });
  const [editing, setEditing] = useState<string | null>(null);
  const form = useForm<SavedClientInput>({ resolver: zodResolver(savedClientSchema), defaultValues: emptyClient });
  const fields = useFieldArray({ control: form.control, name: "metadata" });
  const refresh = () => cache.invalidateQueries({ queryKey: trpc.clients.list.queryKey() });
  const save = useMutation({
    mutationFn: (input: SavedClientInput) =>
      editing
        ? trpcProxyClient.clients.update.mutate({ ...input, id: editing })
        : trpcProxyClient.clients.create.mutate(input),
    onSuccess: () => {
      refresh();
      setEditing(null);
      form.reset(emptyClient);
      toast.success("Client saved to your account");
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    ...trpc.clients.delete.mutationOptions(),
    onSuccess: () => {
      refresh();
      setEditing(null);
      form.reset(emptyClient);
    },
    onError: (e) => toast.error(e.message),
  });
  const copyLocal = useMutation({
    ...trpc.clients.create.mutationOptions(),
    onSuccess: () => {
      refresh();
      toast.success("Browser client imported into your account");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Saved clients</h3>
        <p className="text-muted-foreground text-xs">
          Available on any device when you sign in. Changes apply to future selections.
        </p>
      </div>
      {clients.isPending ? (
        <p>Loading clients…</p>
      ) : clients.isError ? (
        <p role="alert">{clients.error.message}</p>
      ) : (
        <div className="space-y-2">
          {clients.data.map((client) => (
            <div key={client.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-muted-foreground text-xs whitespace-pre-wrap">{client.address}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(client.id);
                    form.reset({ name: client.name, address: client.address, metadata: client.metadata });
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete saved client “${client.name}”? Existing invoices will retain their details.`,
                      )
                    )
                      remove.mutate({ id: client.id });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {local.data?.clientDetails.name && (
        <Button
          type="button"
          variant="outline"
          disabled={copyLocal.isPending || clients.isPending}
          onClick={() => {
            const parsed = savedClientSchema.safeParse(local.data?.clientDetails);
            if (!parsed.success) {
              toast.error("Complete the browser client details before importing");
              return;
            }
            if (
              clients.data?.some(
                (c) =>
                  c.name === parsed.data.name &&
                  c.address === parsed.data.address &&
                  JSON.stringify(c.metadata) === JSON.stringify(parsed.data.metadata),
              )
            ) {
              toast.info("This client is already saved");
              return;
            }
            copyLocal.mutate(parsed.data);
          }}
        >
          Import browser client
        </Button>
      )}
      <Form {...form}>
        <form className="space-y-3 rounded border p-4" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
          <div className="flex items-center justify-between">
            <h4>{editing ? "Edit client" : "New client"}</h4>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  form.reset(emptyClient);
                }}
              >
                Cancel edit
              </Button>
            )}
          </div>
          <FormInput reactform={form} name="name" label="Client name" />
          <FormTextarea reactform={form} name="address" label="Address" />
          {fields.fields.map((f, i) => (
            <div key={f.id} className="flex items-end gap-2">
              <FormInput reactform={form} name={`metadata.${i}.label`} label="Field" />
              <FormInput reactform={form} name={`metadata.${i}.value`} label="Value" />
              <Button type="button" variant="ghost" aria-label="Remove client field" onClick={() => fields.remove(i)}>
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => fields.append({ label: "", value: "" })}>
            Add client field
          </Button>
          <div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save client"}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
function PaymentDefaults() {
  const trpc = useTRPC();
  const preferences = useQuery(trpc.preferences.get.queryOptions());
  if (preferences.isPending) return <p>Loading payment information…</p>;
  if (preferences.isError) return <p role="alert">{preferences.error.message}</p>;
  return <PaymentForm initial={preferences.data} />;
}
function PaymentForm({ initial }: { initial: PaymentPreferencesInput }) {
  const trpc = useTRPC(),
    cache = useQueryClient();
  const form = useForm<PaymentPreferencesInput>({
    resolver: zodResolver(paymentPreferencesSchema),
    defaultValues: initial,
  });
  const fields = useFieldArray({ control: form.control, name: "paymentInformation" });
  const save = useMutation({
    ...trpc.preferences.update.mutationOptions(),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: trpc.preferences.get.queryKey() });
      toast.success("Default payment information saved");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Form {...form}>
      <form className="space-y-3" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <h3 className="text-lg font-medium">Default payment information</h3>
        <p className="text-muted-foreground text-xs">
          Automatically filled on new invoices. Saved and imported invoices keep their own payment details.
        </p>
        {fields.fields.map((f, i) => (
          <div key={f.id} className="flex items-end gap-2">
            <FormInput
              reactform={form}
              name={`paymentInformation.${i}.label`}
              label="Label"
              placeholder="Bank / Account / UPI"
            />
            <FormInput reactform={form} name={`paymentInformation.${i}.value`} label="Value" />
            <Button type="button" variant="ghost" aria-label="Remove payment field" onClick={() => fields.remove(i)}>
              ×
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => fields.append({ label: "", value: "" })}>
          Add payment field
        </Button>
        <div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save payment information"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
