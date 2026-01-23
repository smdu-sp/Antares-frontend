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
import { listarAutocomplete as listarUnidadesAutocomplete } from "@/services/unidades";
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

const formSchema = z.object({
  numero_sei: z.string().min(3, "Número SEI deve ter ao menos 3 caracteres"),
  assunto: z.string().min(5, "Assunto deve ter ao menos 5 caracteres"),
  interessado_id: z.string().optional(),
  unidade_remetente_id: z.string().optional(),
  origem: z.string().min(2, "Unidade de origem deve ter ao menos 2 caracteres"),
  data_recebimento: z.date({
    required_error: "Data de recebimento é obrigatória",
  }),
  data_envio_unidade: z.date().optional(),
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

  const [interessados, setInteressados] = useState<IInteressado[]>([]);
  const [loadingInteressados, setLoadingInteressados] = useState(true);

  useEffect(() => {
    async function carregarInteressados() {
      if (!session?.access_token) return;
      try {
        const resposta = await interessado.query.listaCompleta(
          session.access_token,
        );
        if (Array.isArray(resposta)) {
          setInteressados(resposta);
        } else {
          toast.error("Erro ao carregar interessados");
        }
      } catch (error) {
        console.error("Erro ao carregar interessados:", error);
        toast.error("Erro ao conectar com o servidor de interessados");
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
      data_envio_unidade: processoData?.data_envio_unidade
        ? new Date(processoData.data_envio_unidade)
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

      // Adiciona data_envio_unidade se fornecida
      if (data.data_envio_unidade) {
        dataFormatada.data_envio_unidade =
          data.data_envio_unidade.toISOString();
      }

      // Adiciona interessado_id e unidade_remetente_id se fornecidos
      if (data.interessado_id) {
        dataFormatada.interessado_id = data.interessado_id;
      }
      if (data.unidade_remetente_id) {
        dataFormatada.unidade_remetente_id = data.unidade_remetente_id;
      }

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
            : "Processo criado com sucesso",
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
          render={({ field }) => {
            const [suggestionsInteressado, setSuggestionsInteressado] =
              useState<IInteressado[]>([]);
            const [showSuggestionsInteressado, setShowSuggestionsInteressado] =
              useState(false);
            const [inputInteressado, setInputInteressado] = useState("");
            const [selectedInteressadoId, setSelectedInteressadoId] =
              useState("");
            const timeoutRefInteressado = useRef<NodeJS.Timeout | null>(null);

            // Inicializa o input quando o form tem dados
            useEffect(() => {
              if (
                field.value &&
                field.value !== selectedInteressadoId &&
                interessados.length > 0
              ) {
                const interessadoSelecionado = interessados.find(
                  (i) => i.id === field.value,
                );
                if (interessadoSelecionado) {
                  setInputInteressado(interessadoSelecionado.valor);
                  setSelectedInteressadoId(field.value);
                }
              }
            }, [field.value, interessados, selectedInteressadoId]);

            function fetchSuggestionsInteressado(q: string) {
              if (!q || q.length < 1) {
                // Se vazio, mostra todos os interessados
                setSuggestionsInteressado(interessados);
                return;
              }
              // Busca na lista completa já carregada
              const filtrados = interessados.filter((i) =>
                i.valor.toLowerCase().includes(q.toLowerCase()),
              );
              setSuggestionsInteressado(filtrados);
            }

            function handleChangeInteressado(
              e: React.ChangeEvent<HTMLInputElement>,
            ) {
              const value = e.target.value;
              setInputInteressado(value);
              field.onChange("");
              setSelectedInteressadoId("");
              if (timeoutRefInteressado.current)
                clearTimeout(timeoutRefInteressado.current);
              timeoutRefInteressado.current = setTimeout(() => {
                fetchSuggestionsInteressado(value);
                setShowSuggestionsInteressado(true);
              }, 250);
            }

            function handleSelectInteressado(inter: IInteressado) {
              setInputInteressado(inter.valor);
              field.onChange(inter.id);
              setSelectedInteressadoId(inter.id);
              setShowSuggestionsInteressado(false);
              setSuggestionsInteressado([]);
            }

            return (
              <FormItem className="relative">
                <FormLabel>Interessado</FormLabel>
                <FormControl>
                  <div>
                    {loadingInteressados ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder="Busque pelo nome do interessado"
                          value={inputInteressado}
                          onChange={handleChangeInteressado}
                          autoComplete="off"
                          onBlur={() =>
                            setTimeout(
                              () => setShowSuggestionsInteressado(false),
                              200,
                            )
                          }
                          onFocus={() => {
                            fetchSuggestionsInteressado(inputInteressado);
                            setShowSuggestionsInteressado(true);
                          }}
                        />
                        {showSuggestionsInteressado &&
                          suggestionsInteressado.length > 0 && (
                            <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
                              {suggestionsInteressado.map((inter) => (
                                <li
                                  key={inter.id}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                                  onMouseDown={() =>
                                    handleSelectInteressado(inter)
                                  }
                                >
                                  {inter.valor}
                                </li>
                              ))}
                            </ul>
                          )}
                      </>
                    )}
                  </div>
                </FormControl>
                <FormDescription>Interessado no processo</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="unidade_remetente_id"
          render={({ field }) => {
            const [suggestionsUnidades, setSuggestionsUnidades] = useState<
              IUnidade[]
            >([]);
            const [showSuggestionsUnidades, setShowSuggestionsUnidades] =
              useState(false);
            const [inputUnidade, setInputUnidade] = useState("");
            const [selectedUnidadeId, setSelectedUnidadeId] = useState("");
            const timeoutRefUnidade = useRef<NodeJS.Timeout | null>(null);

            // Inicializa o input quando o form tem dados
            useEffect(() => {
              if (
                field.value &&
                field.value !== selectedUnidadeId &&
                processoData?.unidadeRemetente
              ) {
                setInputUnidade(
                  `${processoData.unidadeRemetente.sigla} - ${processoData.unidadeRemetente.nome}`,
                );
                setSelectedUnidadeId(field.value);
              }
            }, [
              field.value,
              processoData?.unidadeRemetente,
              selectedUnidadeId,
            ]);

            async function fetchSuggestionsUnidades(q: string) {
              if (!q || q.length < 1) {
                setSuggestionsUnidades([]);
                return;
              }
              try {
                const token = session?.access_token;
                if (!token) return;
                const resposta = await listarUnidadesAutocomplete(token, q);
                if (resposta.ok && Array.isArray(resposta.data)) {
                  setSuggestionsUnidades(resposta.data as IUnidade[]);
                } else {
                  setSuggestionsUnidades([]);
                }
              } catch {
                setSuggestionsUnidades([]);
              }
            }

            function handleChangeUnidade(
              e: React.ChangeEvent<HTMLInputElement>,
            ) {
              const value = e.target.value;
              setInputUnidade(value);
              field.onChange("");
              setSelectedUnidadeId("");
              if (timeoutRefUnidade.current)
                clearTimeout(timeoutRefUnidade.current);
              timeoutRefUnidade.current = setTimeout(() => {
                fetchSuggestionsUnidades(value);
                setShowSuggestionsUnidades(true);
              }, 250);
            }

            function handleSelectUnidade(unidade: IUnidade) {
              setInputUnidade(`${unidade.sigla} - ${unidade.nome}`);
              field.onChange(unidade.id);
              setSelectedUnidadeId(unidade.id);
              setShowSuggestionsUnidades(false);
              setSuggestionsUnidades([]);
            }

            return (
              <FormItem className="relative">
                <FormLabel>Unidade Remetente</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      placeholder="Busque por sigla ou nome da unidade"
                      value={inputUnidade}
                      onChange={handleChangeUnidade}
                      autoComplete="off"
                      onBlur={() =>
                        setTimeout(() => setShowSuggestionsUnidades(false), 200)
                      }
                      onFocus={() => {
                        fetchSuggestionsUnidades(inputUnidade);
                        setShowSuggestionsUnidades(true);
                      }}
                      style={{ appearance: "none" }}
                    />
                    {showSuggestionsUnidades &&
                      suggestionsUnidades.length > 0 && (
                        <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
                          {suggestionsUnidades.map((unidade) => (
                            <li
                              key={unidade.id}
                              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                              onMouseDown={() => handleSelectUnidade(unidade)}
                            >
                              {unidade.sigla} - {unidade.nome}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                </FormControl>
                <FormDescription>Unidade que enviou o processo</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="origem"
          render={({ field }) => {
            const [suggestionsOrigem, setSuggestionsOrigem] = useState<
              IUnidade[]
            >([]);
            const [showSuggestionsOrigem, setShowSuggestionsOrigem] =
              useState(false);
            const [inputOrigem, setInputOrigem] = useState("");
            const timeoutRefOrigem = useRef<NodeJS.Timeout | null>(null);

            // Inicializa o input quando o form tem dados
            useEffect(() => {
              if (field.value && !inputOrigem) {
                setInputOrigem(field.value);
              }
            }, [field.value, inputOrigem]);

            async function fetchSuggestionsOrigem(q: string) {
              if (!q || q.length < 1) {
                setSuggestionsOrigem([]);
                return;
              }
              try {
                const token = session?.access_token;
                if (!token) return;
                const resposta = await listarUnidadesAutocomplete(token, q);
                if (resposta.ok && Array.isArray(resposta.data)) {
                  setSuggestionsOrigem(resposta.data as IUnidade[]);
                } else {
                  setSuggestionsOrigem([]);
                }
              } catch {
                setSuggestionsOrigem([]);
              }
            }

            function handleChangeOrigem(
              e: React.ChangeEvent<HTMLInputElement>,
            ) {
              const value = e.target.value;
              setInputOrigem(value);
              field.onChange("");
              if (timeoutRefOrigem.current)
                clearTimeout(timeoutRefOrigem.current);
              timeoutRefOrigem.current = setTimeout(() => {
                fetchSuggestionsOrigem(value);
                setShowSuggestionsOrigem(true);
              }, 250);
            }

            function handleSelectOrigem(unidade: IUnidade) {
              const nomeUnidade = `${unidade.sigla} - ${unidade.nome}`;
              setInputOrigem(nomeUnidade);
              field.onChange(nomeUnidade);
              setShowSuggestionsOrigem(false);
              setSuggestionsOrigem([]);
            }

            return (
              <FormItem className="relative">
                <FormLabel>Unidade de Origem</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      placeholder="Busque por sigla ou nome da unidade"
                      value={inputOrigem}
                      onChange={handleChangeOrigem}
                      autoComplete="off"
                      onBlur={() =>
                        setTimeout(() => setShowSuggestionsOrigem(false), 200)
                      }
                      onFocus={() => {
                        fetchSuggestionsOrigem(inputOrigem);
                        setShowSuggestionsOrigem(true);
                      }}
                      style={{ appearance: "none" }}
                    />
                    {showSuggestionsOrigem && suggestionsOrigem.length > 0 && (
                      <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
                        {suggestionsOrigem.map((unidade) => (
                          <li
                            key={unidade.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                            onMouseDown={() => handleSelectOrigem(unidade)}
                          >
                            {unidade.sigla} - {unidade.nome}
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
          name="data_envio_unidade"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Envio para Unidade</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? undefined)}
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
                Data em que o processo foi enviado para a unidade responsável
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
