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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as processo from "@/services/processos";
import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  numero_sei: z.string().min(3, "Número SEI deve ter ao menos 3 caracteres"),
  assunto: z.string().min(5, "Assunto deve ter ao menos 5 caracteres"),
  origem: z.string().min(2, "Unidade de origem deve ter ao menos 2 caracteres"),
  data_recebimento: z.date({
    required_error: "Data de recebimento é obrigatória",
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_sei: processoData?.numero_sei || "",
      assunto: processoData?.assunto || "",
      origem: processoData?.origem || "",
      data_recebimento: processoData?.data_recebimento
        ? new Date(processoData.data_recebimento)
        : undefined,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Converte a data para ISO string
      const dataFormatada = {
        ...data,
        data_recebimento: data.data_recebimento.toISOString(),
      };

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
          name="origem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade de Origem</FormLabel>
              <FormControl>
                <Input placeholder="EXPEDIENTE" {...field} />
              </FormControl>
              <FormDescription>Unidade que originou o processo</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data_recebimento"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Recebimento</FormLabel>
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
                Data em que o gabinete recebeu o processo
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
