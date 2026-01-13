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
import { IProcesso, ICreateProcesso, IUpdateProcesso } from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import { IInteressado } from "@/types/interessado";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as processo from "@/services/processos";
import { listaCompleta as listaCompletaUnidades } from "@/services/unidades";
import * as interessado from "@/services/interessados";
import { useTransition, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import DateInput from "@/components/ui/date-input";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/multi-select";

const formSchema = z.object({
  numero_sei: z.string().min(3, "Número SEI deve ter ao menos 3 caracteres"),
  assunto: z.string().min(5, "Assunto deve ter ao menos 5 caracteres"),
  interessado_id: z.string().optional(),
  unidade_remetente_id: z.string().optional(),
  origem: z.string().min(2, "Unidade de origem deve ter ao menos 2 caracteres"),
  data_recebimento: z.date({
    required_error: "Data de recebimento é obrigatória",
  }),
  prazo: z.date({
    required_error: "Prazo do processo é obrigatório",
  }),
});

export default function FormProcesso({
  processo: processoData,
  isUpdating,
  onSuccess,
}: {
  processo?: Partial<IProcesso>;
  isUpdating: boolean;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [unidades, setUnidades] = useState<IUnidade[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [interessados, setInteressados] = useState<IInteressado[]>([]);
  const [loadingInteressados, setLoadingInteressados] = useState(true);

  useEffect(() => {
    async function carregarUnidades() {
      if (!session?.access_token) return;
      try {
        const resposta = await listaCompletaUnidades(session.access_token);
        if (resposta.ok && Array.isArray(resposta.data)) {
          setUnidades(resposta.data as IUnidade[]);
        }
      } catch (error) {
        console.error("Erro ao carregar unidades:", error);
      } finally {
        setLoadingUnidades(false);
      }
    }
    carregarUnidades();
  }, [session?.access_token]);

  useEffect(() => {
    async function carregarInteressados() {
      if (!session?.access_token) return;
      try {
        const resposta = await interessado.query.listaCompleta(
          session.access_token
        );
        if (Array.isArray(resposta)) {
          setInteressados(resposta);
        }
      } catch (error) {
        console.error("Erro ao carregar interessados:", error);
      } finally {
        setLoadingInteressados(false);
      }
    }
    carregarInteressados();
  }, [session?.access_token]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_sei: processoData?.numero_sei || "",
      assunto: processoData?.assunto || "",
      interessado_id: processoData?.interessado_id || "",
      unidade_remetente_id:
        processoData?.unidadeRemetente?.id ||
        processoData?.unidade_remetente ||
        "",
      origem: processoData?.origem || "",
      data_recebimento: processoData?.data_recebimento
        ? new Date(processoData.data_recebimento)
        : undefined,
      prazo: processoData?.prazo ? new Date(processoData.prazo) : undefined,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Converte as datas para ISO string e mapeia os campos
      const dataFormatada: any = {
        numero_sei: data.numero_sei,
        assunto: data.assunto,
        origem: data.origem,
        data_recebimento: data.data_recebimento.toISOString(),
        prazo: data.prazo.toISOString(),
      };

      // Adiciona interessado_id e unidade_remetente_id se fornecidos
      if (data.interessado_id) {
        dataFormatada.interessado_id = data.interessado_id;
      }
      if (data.unidade_remetente_id) {
        dataFormatada.unidade_remetente_id = data.unidade_remetente_id;
      }

      console.log("📤 Dados sendo enviados ao backend:", dataFormatada);

      let resp;
      if (isUpdating && processoData?.id) {
        resp = await processo.server.atualizar(processoData.id, dataFormatada);
      } else {
        resp = await processo.server.criar(dataFormatada as ICreateProcesso);
      }

      if (!resp.ok) {
        toast.error("Erro", { description: resp.error });
      } else {
        toast.success(
          isUpdating
            ? "Processo atualizado com sucesso"
            : "Processo criado com sucesso"
        );
        form.reset();
        // Limpa os filtros e busca da URL
        router.push(pathname);
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
          name="numero_sei"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número SEI</FormLabel>
              <FormControl>
                <Input placeholder="1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assunto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assunto</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o assunto do processo"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interessado_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interessado</FormLabel>
              <FormControl>
                {loadingInteressados ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <MultiSelect
                    options={interessados.map((i) => ({
                      label: i.valor,
                      value: i.id,
                    }))}
                    onValueChange={(values) => field.onChange(values[0] || "")}
                    value={field.value ? [field.value] : []}
                    placeholder="Selecione o interessado"
                    variant="default"
                    maxCount={1}
                  />
                )}
              </FormControl>
              <FormDescription>Interessado no processo</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unidade_remetente_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade Remetente</FormLabel>
              <FormControl>
                {loadingUnidades ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <MultiSelect
                    options={unidades.map((u) => ({
                      label: `${u.sigla} - ${u.nome}`,
                      value: u.id,
                    }))}
                    onValueChange={(values) => field.onChange(values[0] || "")}
                    value={field.value ? [field.value] : []}
                    placeholder="Selecione a unidade remetente"
                    variant="default"
                    maxCount={1}
                  />
                )}
              </FormControl>
              <FormDescription>Unidade que enviou o processo</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="origem"
          render={({ field }) => {
            const [suggestions, setSuggestions] = useState<string[]>([]);
            const [showSuggestions, setShowSuggestions] = useState(false);
            const timeoutRef = useRef<NodeJS.Timeout | null>(null);

            async function fetchSuggestions(q: string) {
              if (!q || q.length < 2) {
                setSuggestions([]);
                return;
              }
              try {
                const token = session?.access_token;
                const headers = token
                  ? { Authorization: `Bearer ${token}` }
                  : undefined;
                const res = await fetch(
                  `http://localhost:3000/processos/origens/autocomplete?q=${encodeURIComponent(
                    q
                  )}`,
                  { headers }
                );
                if (res.ok) {
                  const data = await res.json();
                  setSuggestions(Array.isArray(data) ? data : []);
                } else {
                  setSuggestions([]);
                }
              } catch {
                setSuggestions([]);
              }
            }

            function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
              field.onChange(e);
              const value = e.target.value;
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                fetchSuggestions(value);
                setShowSuggestions(true);
              }, 250);
            }

            function handleSelectSuggestion(s: string) {
              field.onChange(s);
              setShowSuggestions(false);
            }

            return (
              <FormItem className="relative">
                <FormLabel>Unidade de Origem</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      placeholder="EXPEDIENTE"
                      {...field}
                      onChange={handleChange}
                      autoComplete="off"
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      onFocus={() =>
                        field.value && fetchSuggestions(field.value)
                      }
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
                        {suggestions.map((s, i) => (
                          <li
                            key={s + i}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                            onMouseDown={() => handleSelectSuggestion(s)}
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Unidade que originou o processo
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="data_recebimento"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Recebimento</FormLabel>
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
              <FormDescription>
                Data em que o gabinete recebeu o processo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prazo"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Prazo do Processo</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? new Date())}
                  placeholder="DD/MM/AAAA"
                  calendarProps={{
                    locale: ptBR,
                    initialFocus: true,
                    disabled: (date: Date) => date < new Date("1900-01-01"),
                  }}
                />
              </FormControl>
              <FormDescription>
                Data limite para conclusão do processo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : isUpdating ? (
            "Atualizar"
          ) : (
            "Criar"
          )}
        </Button>
      </form>
    </Form>
  );
}
