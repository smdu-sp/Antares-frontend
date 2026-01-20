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
import DateInput from "@/components/ui/date-input";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IUnidade } from "@/types/unidade";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  destino: z.string().min(1, "Destino é obrigatório"),
  data_envio: z.date({
    required_error: "Data de envio é obrigatória",
  }),
  prazo: z.date({
    required_error: "Prazo é obrigatório",
  }),
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
      destino: "",
      data_envio: new Date(), // Pré-preenchido com data atual
      prazo: undefined,
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
      const prazoISO = data.prazo ? data.prazo.toISOString() : "";

      const dataEnvioISO = data.data_envio
        ? data.data_envio.toISOString()
        : new Date().toISOString();

      // Criar andamento
      const unidadeDestino = unidades.find((u) => u.id === data.destino);
      const result = await andamento.server.criar({
        processo_id: processoId,
        origem: processoOrigem,
        destino: unidadeDestino?.sigla || data.destino,
        data_envio: dataEnvioISO,
        prazo: prazoISO,
      } as ICreateAndamento);

      if (!result.ok) {
        toast.error("Erro", {
          description: "Não foi possível criar o andamento",
        });
      } else {
        toast.success("Andamento criado com sucesso");
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
          name="destino"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade de Destino</FormLabel>
              <FormControl>
                {loadingUnidades ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Carregando unidades...
                    </span>
                  </div>
                ) : (
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione uma unidade</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.sigla} - {u.nome}
                      </option>
                    ))}
                  </select>
                )}
              </FormControl>
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
        <FormField
          control={form.control}
          name="prazo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo (Data Limite)</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? undefined)}
                  placeholder="DD/MM/AAAA"
                />
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
