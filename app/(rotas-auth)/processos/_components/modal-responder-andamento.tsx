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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import * as andamento from "@/services/andamentos";
import { atualizar } from "@/services/andamentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { IAndamento, StatusAndamento } from "@/types/processo";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  data_resposta: z.date({ required_error: "Data é obrigatória" }),
  resposta: z.string().min(1, "Resposta é obrigatória"),
});

export default function ModalResponderAndamento({
  andamento,
  processoId,
  onSuccess,
}: {
  andamento: IAndamento;
  processoId: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_resposta: andamento.conclusao
        ? new Date(andamento.conclusao)
        : new Date(),
      resposta: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Formata observação com data/hora e autor
      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const usuarioNome =
        session?.usuario?.nomeSocial || session?.usuario?.nome || "Usuário";
      const novaObservacao = `[${dataFormatada}] ${usuarioNome} - Resposta:\n${data.resposta.trim()}`;

      // Prepend a nova resposta acima das observações existentes
      const separador = "\n\n---\n\n";
      const observacaoCompleta = andamento.observacao
        ? `${novaObservacao}${separador}${andamento.observacao.trim()}`
        : novaObservacao;

      // Atualiza o andamento: marca como concluído e adiciona observação
      const payload = {
        conclusao: data.data_resposta.toISOString(),
        status: StatusAndamento.CONCLUIDO,
        observacao: observacaoCompleta,
        resposta: data.resposta.trim(),
      } as any;

      const resp = await atualizar(andamento.id, payload);

      if (!resp.ok) {
        toast.error("Erro ao registrar resposta do andamento", {
          description: resp.error,
        });
      } else {
        toast.success("Resposta registrada e andamento concluído");
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
          className="hover:bg-green-500 hover:text-white"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Responder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Resposta do Andamento</DialogTitle>
          <DialogDescription>
            Insira a data e o texto da resposta deste andamento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="data_resposta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Resposta</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full text-left pl-3",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resposta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resposta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a resposta..."
                      className="min-h-[120px]"
                      {...field}
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
                {isPending ? <Loader2 className="animate-spin" /> : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
