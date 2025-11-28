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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IProcesso } from "@/types/processo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as processo from "@/services/processos";
import { useTransition, useMemo } from "react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  data_resposta_final: z.date({
    required_error: "Data de resposta final é obrigatória",
  }),
  resposta: z.string().min(10, "Resposta deve ter ao menos 10 caracteres"),
  unidade_respondida_id: z.string().min(1, "Selecione uma unidade"),
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
      unidade_respondida_id: "",
    },
  });

  // Extrair unidades únicas dos andamentos anteriores
  const unidadesAndamentos = useMemo(() => {
    if (!processoData.andamentos || processoData.andamentos.length === 0) {
      return [];
    }

    const unidadesMap = new Map<string, string>();

    processoData.andamentos.forEach((andamento) => {
      // Adiciona origem
      if (andamento.origem && !unidadesMap.has(andamento.origem)) {
        unidadesMap.set(andamento.origem, andamento.origem);
      }
      // Adiciona destino
      if (andamento.destino && !unidadesMap.has(andamento.destino)) {
        unidadesMap.set(andamento.destino, andamento.destino);
      }
    });

    return Array.from(unidadesMap.entries()).map(([id, nome]) => ({
      id,
      nome,
    }));
  }, [processoData.andamentos]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Converte a data para ISO string
      const dataFormatada = {
        processo_id: processoData.id,
        data_resposta_final: data.data_resposta_final.toISOString(),
        resposta: data.resposta,
        unidade_respondida_id: data.unidade_respondida_id,
      };

      const resp = await processo.server.criarRespostaFinal(dataFormatada);

      if (!resp.ok) {
        toast.error("Erro", { description: resp.error });
      } else {
        toast.success("Resposta final registrada com sucesso");
        form.reset();
        router.refresh();
        onSuccess?.();
      }
    });
  }

  if (unidadesAndamentos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-base">
          Não é possível criar resposta final sem andamentos cadastrados.
        </p>
        <p className="text-sm mt-2">
          Crie pelo menos um andamento antes de registrar a resposta final.
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
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Data em que o gabinete respondeu o processo ao solicitante
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unidade_respondida_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade Respondida</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {unidadesAndamentos.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Unidade que está sendo respondida
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resposta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resposta Final</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva a resposta final ao processo..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Texto da resposta que será enviada ao solicitante
              </FormDescription>
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
