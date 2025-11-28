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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ICreateAndamento } from "@/types/processo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as andamento from "@/services/andamentos";
import * as unidade from "@/services/unidades";
import { useTransition, useState, useEffect } from "react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MultiSelect } from "@/components/multi-select";
import { IUnidade } from "@/types/unidade";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  destinos: z
    .array(z.string())
    .min(1, "Selecione ao menos uma unidade de destino"),
  data_envio: z.date({
    required_error: "Data de envio é obrigatória",
  }),
  prazo: z.string().min(1, "Prazo é obrigatório"),
});

export default function FormAndamento({
  processoId,
  processoOrigem,
  onSuccess,
}: {
  processoId: string;
  processoOrigem: string;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { data: session } = useSession();
  const [unidades, setUnidades] = useState<IUnidade[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinos: [],
      data_envio: new Date(), // Pré-preenchido com data atual
      prazo: "",
    },
  });

  // Buscar lista de unidades
  useEffect(() => {
    if (session?.access_token) {
      unidade.listaCompleta(session.access_token).then((response) => {
        if (response.ok && response.data) {
          setUnidades(response.data as IUnidade[]);
        }
        setLoadingUnidades(false);
      });
    }
  }, [session]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Converte as datas para ISO string
      const prazoISO = data.prazo
        ? new Date(data.prazo + "T00:00:00").toISOString()
        : "";

      const dataEnvioISO = data.data_envio
        ? data.data_envio.toISOString()
        : new Date().toISOString();

      // Criar andamentos para cada destino selecionado
      const promises = data.destinos.map((destinoId) => {
        const unidadeDestino = unidades.find((u) => u.id === destinoId);
        return andamento.server.criar({
          processo_id: processoId,
          origem: processoOrigem,
          destino: unidadeDestino?.sigla || destinoId,
          data_envio: dataEnvioISO,
          prazo: prazoISO,
        } as ICreateAndamento);
      });

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        if (failed.length === results.length) {
          toast.error("Erro", {
            description: "Não foi possível criar os andamentos",
          });
        } else {
          toast.warning("Atenção", {
            description: `${
              results.length - failed.length
            } andamento(s) criado(s), ${failed.length} falhou(am)`,
          });
        }
      } else {
        toast.success(
          data.destinos.length === 1
            ? "Andamento criado com sucesso"
            : `${data.destinos.length} andamentos criados com sucesso`
        );
        form.reset();
        router.refresh();
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="destinos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidades de Destino</FormLabel>
              <FormControl>
                {loadingUnidades ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Carregando unidades...
                    </span>
                  </div>
                ) : (
                  <MultiSelect
                    options={unidades.map((u) => ({
                      label: `${u.sigla} - ${u.nome}`,
                      value: u.id,
                    }))}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Selecione uma ou mais unidades"
                    variant="inverted"
                    maxCount={3}
                  />
                )}
              </FormControl>
              <FormDescription>
                Selecione múltiplas unidades para criar andamentos automáticos
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data_envio"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Envio</FormLabel>
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
                Data em que o gabinete enviou o processo para a unidade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prazo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo (Data Limite)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="animate-spin" /> : "Criar Andamento"}
        </Button>
      </form>
    </Form>
  );
}
