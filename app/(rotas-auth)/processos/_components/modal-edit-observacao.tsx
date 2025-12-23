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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import * as andamento from "@/services/andamentos";

const formSchema = z.object({
  observacao: z.string().min(1, "Observação é obrigatória"),
});

interface ModalEditObservacaoProps {
  processoId: string;
  andamentoId: string;
  observacaoOriginal: string;
  indiceObservacao: number;
  onSuccess?: () => void;
}

export default function ModalEditObservacao({
  processoId,
  andamentoId,
  observacaoOriginal,
  indiceObservacao,
  onSuccess,
}: ModalEditObservacaoProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();

  // Parseia a observação original para extrair apenas o texto
  const parsearObservacao = (obs: string) => {
    const obsTrimmed = obs.trim();
    const match = obsTrimmed.match(/^\[([^\]]+)\]\s+([^:]+):\s*(.*)$/s);
    if (match && match.length >= 4) {
      return {
        dataHora: match[1].trim(),
        autor: match[2].trim(),
        texto: match[3].trim(),
      };
    }
    // Fallback: se não tem formato, retorna o texto completo
    return {
      dataHora: "",
      autor: "",
      texto: obsTrimmed,
    };
  };

  const parsed = parsearObservacao(observacaoOriginal);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observacao: parsed.texto,
    },
  });

  const handleSuccess = () => {
    setOpen(false);
    form.reset();
    onSuccess?.();
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!session?.access_token) {
      toast.error("Não autorizado");
      return;
    }

    startTransition(async () => {
      try {
        // Busca o andamento atual
        const response = await andamento.query.buscarPorProcesso(
          session.access_token,
          processoId
        );

        if (!response.ok || !response.data || !Array.isArray(response.data)) {
          toast.error("Erro", {
            description: "Não foi possível encontrar o andamento",
          });
          return;
        }

        const andamentoAtual = response.data.find((a) => a.id === andamentoId);
        if (!andamentoAtual) {
          toast.error("Erro", {
            description: "Andamento não encontrado",
          });
          return;
        }

        // Divide as observações (já vêm na ordem original: mais antiga primeiro)
        const observacoes = andamentoAtual.observacao
          ? andamentoAtual.observacao
              .split(/\n\s*---\s*\n/)
              .filter((obs) => obs.trim().length > 0)
          : [];

        // Atualiza a observação no índice especificado
        // O índice já é o índice original (antes do reverse no display)
        if (indiceObservacao >= 0 && indiceObservacao < observacoes.length) {
          // Mantém o formato original [data] autor: mas atualiza o texto
          const obsOriginal = observacoes[indiceObservacao];
          const match = obsOriginal.trim().match(/^\[([^\]]+)\]\s+([^:]+):/);

          if (match && match.length >= 3) {
            // Mantém data e autor, atualiza apenas o texto
            const novaObservacao = `[${match[1]}] ${
              match[2]
            }:\n${data.observacao.trim()}`;
            observacoes[indiceObservacao] = novaObservacao;
          } else {
            // Se não tem formato, cria novo formato com data atual
            const agora = new Date();
            const dataFormatada = agora.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const usuarioNome =
              session?.usuario?.nomeSocial ||
              session?.usuario?.nome ||
              "Usuário";
            observacoes[
              indiceObservacao
            ] = `[${dataFormatada}] ${usuarioNome}:\n${data.observacao.trim()}`;
          }

          // Junta todas as observações mantendo a ordem original
          const observacoesAtualizadas = observacoes.join("\n\n---\n\n");

          // Atualiza o andamento
          const resp = await andamento.server.atualizar(andamentoId, {
            observacao: observacoesAtualizadas,
          });

          if (!resp.ok) {
            toast.error("Erro", { description: resp.error });
          } else {
            toast.success("Observação atualizada com sucesso");
            handleSuccess();
          }
        } else {
          toast.error("Erro", {
            description: "Índice de observação inválido",
          });
        }
      } catch (error) {
        toast.error("Erro", {
          description: "Não foi possível atualizar a observação",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Observação</DialogTitle>
          <DialogDescription>Edite o texto da observação</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite sua observação..."
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
                {isPending ? <Loader2 className="animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
