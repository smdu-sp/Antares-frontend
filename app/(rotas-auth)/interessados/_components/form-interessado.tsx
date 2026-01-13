/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import * as interessado from "@/services/interessados";
import { IInteressado } from "@/types/interessado";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  valor: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
});

interface FormInteressadoProps {
  isUpdating?: boolean;
  interessado?: Partial<IInteressado>;
}

export default function FormInteressado({
  isUpdating,
  interessado: interessadoData,
}: FormInteressadoProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor: interessadoData?.valor || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      if (isUpdating && interessadoData?.id) {
        const resp = await interessado.server.atualizar(interessadoData.id, {
          valor: values.valor,
        });

        if (resp.error) {
          toast.error("Algo deu errado", { description: resp.error });
        }

        if (resp.ok) {
          toast.success("Interessado Atualizado", {
            description: "Interessado atualizado com sucesso",
          });
          window.location.reload();
        }
      } else {
        const resp = await interessado.server.criar({
          valor: values.valor,
        });
        if (resp.error) {
          toast.error("Algo deu errado", { description: resp.error });
        }
        if (resp.ok) {
          toast.success("Interessado Criado", {
            description: "Interessado criado com sucesso",
          });
          window.location.reload();
        }
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Interessado</FormLabel>
              <FormControl>
                <Input placeholder="Nome do interessado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 items-center justify-end">
          <DialogClose asChild>
            <Button variant={"outline"}>Voltar</Button>
          </DialogClose>
          <Button disabled={isPending} type="submit">
            {isUpdating ? (
              <>Atualizar {isPending && <Loader2 className="animate-spin" />}</>
            ) : (
              <>Adicionar {isPending && <Loader2 className="animate-spin" />}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
