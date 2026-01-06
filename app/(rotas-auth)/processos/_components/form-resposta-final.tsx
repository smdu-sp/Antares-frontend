/** @format */

"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IProcesso } from "@/types/processo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as processo from "@/services/processos";
import * as andamentoService from "@/services/andamentos";
import { StatusAndamento } from "@/types/processo";
import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import DateInput from "@/components/ui/date-input";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  data_resposta_final: z.date({
    required_error: "Data de resposta final é obrigatória",
  }),
  resposta: z.string().min(10, "Resposta deve ter ao menos 10 caracteres"),
});

export default function FormRespostaFinal({
  processoData,
  onSuccess,
}: {
  processoData: IProcesso;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_resposta_final: new Date(), // Pré-preenchido com data atual
      resposta: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        // 1. Primeiro, verificar se há andamentos em andamento e concluí-los
        const andamentosEmAndamento = processoData.andamentos?.filter(
          (and) => and.status === StatusAndamento.EM_ANDAMENTO
        );

        if (andamentosEmAndamento && andamentosEmAndamento.length > 0) {
          // Concluir todos os andamentos em andamento usando a função de lote
          const ids = andamentosEmAndamento.map((and) => and.id);
          const concluirResp = await andamentoService.server.atualizarLote({
            ids,
            operacao: "concluir",
          });

          if (!concluirResp.ok) {
            toast.error("Erro ao concluir andamentos em andamento", {
              description: concluirResp.error,
            });
            return;
          }

          toast.success(
            `${andamentosEmAndamento.length} andamento(s) concluído(s) automaticamente`
          );
        }

        // 2. Enviando resposta final
        const dataFormatada = {
          processo_id: processoData.id,
          data_resposta_final: data.data_resposta_final.toISOString(),
          resposta_final: data.resposta,
          unidade_respondida_id: processoData.origem || "",
        };

        const resp = await processo.server.criarRespostaFinal(dataFormatada);

        if (!resp.ok) {
          toast.error("Erro", { description: resp.error });
          return;
        }

        toast.success(
          "Resposta final registrada e processo concluído com sucesso"
        );

        form.reset();
        router.refresh();
        onSuccess?.();
      } catch (err) {
        toast.error("Erro ao processar resposta final");
      }
    });
  }

  if (!processoData.origem) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-base">
          Não é possível criar resposta final sem unidade de origem cadastrada.
        </p>
        <p className="text-sm mt-2">
          A unidade de origem deve ser definida na criação do processo.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="data_resposta_final"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Resposta Final</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? new Date())}
                  placeholder="DD/MM/AAAA"
                  calendarProps={{
                    locale: ptBR,
                    initialFocus: true,
                    disabled: (date: Date) =>
                      date > new Date() || date < new Date("1900-01-01"),
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Unidade Respondida</FormLabel>
          <FormControl>
            <Input
              value={processoData.origem || ""}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </FormControl>
        </FormItem>

        <FormField
          control={form.control}
          name="resposta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre a resposta final..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Registrar Resposta Final"
          )}
        </Button>
      </form>
    </Form>
  );
}
