/** @format */

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import DateInput from "@/components/ui/date-input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Loader2, Clock } from "lucide-react";
import * as andamento from "@/services/andamentos";
import { atualizar } from "@/services/andamentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { IAndamento } from "@/types/processo";

const formSchema = z.object({
  nova_prorrogacao: z.date({ required_error: "Data é obrigatória" }),
});

export default function ModalProrrogarAndamento({
  andamento,
  onSuccess,
}: {
  andamento: IAndamento;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nova_prorrogacao: andamento.prorrogacao
        ? new Date(andamento.prorrogacao)
        : new Date(),
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const iso = data.nova_prorrogacao.toISOString();
      const resp = await atualizar(andamento.id, {
        prorrogacao: iso,
        status: "PRORROGADO",
      } as any);

      if (!resp.ok) {
        toast.error("Erro ao prorrogar andamento", { description: resp.error });
      } else {
        toast.success("Andamento prorrogado com sucesso");
        setOpen(false);
        onSuccess?.();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="hover:bg-orange-500 hover:text-white"
        >
          <Clock className="h-4 w-4 mr-2" />
          Prorrogar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prorrogar Andamento</DialogTitle>
          <DialogDescription>
            Defina a nova data limite para este andamento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nova_prorrogacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Data</FormLabel>
                  <FormControl>
                    <DateInput
                      value={field.value ?? null}
                      onChange={(d) => field.onChange(d ?? new Date())}
                      placeholder="DD/MM/AAAA"
                      calendarProps={{ locale: ptBR }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Confirmar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
