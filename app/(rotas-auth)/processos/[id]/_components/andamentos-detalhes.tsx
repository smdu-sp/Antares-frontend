/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import { IAndamento, IProcesso, StatusAndamento } from "@/types/processo";
import * as andamento from "@/services/andamentos";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  User,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calcularDiasRestantes,
  getStatusPrazo,
} from "@/app/(rotas-auth)/processos/_components/utils";
import ModalAndamento from "@/app/(rotas-auth)/processos/_components/modal-andamento";
import ModalRespostaFinal from "@/app/(rotas-auth)/processos/_components/modal-resposta-final";
import ModalEditAndamento from "@/app/(rotas-auth)/processos/_components/modal-edit-andamento";
import ModalDeleteAndamento from "@/app/(rotas-auth)/processos/_components/modal-delete-andamento";
import ModalAdicionarObservacao from "@/app/(rotas-auth)/processos/_components/modal-adicionar-observacao";
import ModalEditObservacao from "@/app/(rotas-auth)/processos/_components/modal-edit-observacao";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function AndamentosDetalhes({
  processo,
}: {
  processo: IProcesso;
}) {
  const { data: session } = useSession();
  const [andamentos, setAndamentos] = useState<IAndamento[]>(
    processo.andamentos || []
  );
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historicoAberto, setHistoricoAberto] = useState(false);

  const fetchAndamentos = useCallback(async () => {
    if (session?.access_token) {
      setLoading(true);
      const response = await andamento.query.buscarPorProcesso(
        session.access_token as string,
        processo.id
      );
      if (response.ok && response.data) {
        setAndamentos(response.data as IAndamento[]);
      }
      setLoading(false);
    }
  }, [session?.access_token, processo.id]);

  useEffect(() => {
    if (session && refreshKey > 0) {
      fetchAndamentos();
    }
  }, [session, fetchAndamentos, refreshKey]);

  const refreshFn = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Ordena andamentos por data de criação (mais recente primeiro)
  const andamentosOrdenados = [...andamentos].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  );

  // Separa andamentos em andamento (status EM_ANDAMENTO) dos históricos (outros status)
  const andamentosEmAndamento = andamentosOrdenados.filter(
    (a) => a.status === StatusAndamento.EM_ANDAMENTO
  );
  const andamentosHistorico = andamentosOrdenados.filter(
    (a) => a.status !== StatusAndamento.EM_ANDAMENTO
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Botões de Criar Andamento e Resposta Final */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold">Andamentos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe a tramitação do processo
          </p>
        </div>
        <div className="flex gap-2">
          <ModalAndamento
            processoId={processo.id}
            onSuccess={refreshFn}
            size="lg"
            variant="default"
          />
          <ModalRespostaFinal
            processo={processo}
            onSuccess={refreshFn}
            size="lg"
            variant="outline"
          />
        </div>
      </div>

      {/* Andamentos em Andamento */}
      {andamentosEmAndamento.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {andamentosEmAndamento.length === 1
              ? "Andamento Atual"
              : `Andamentos em Andamento (${andamentosEmAndamento.length})`}
          </h3>
          {andamentosEmAndamento.map((andamento) => (
            <Card key={andamento.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {andamento.origem} → {andamento.destino}
                    </CardTitle>
                    <CardDescription>Processo em tramitação</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <ModalAdicionarObservacao
                      processoId={processo.id}
                      onSuccess={refreshFn}
                    />
                    <ModalEditAndamento
                      andamento={andamento}
                      onSuccess={refreshFn}
                    />
                    {session?.usuario?.permissao &&
                      ["DEV", "ADM", "TEC"].includes(
                        session.usuario.permissao.toString()
                      ) && (
                        <ModalDeleteAndamento
                          andamento={andamento}
                          onSuccess={refreshFn}
                        />
                      )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AndamentoCard
                  andamento={andamento}
                  processoId={processo.id}
                  onRefresh={refreshFn}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico de Andamentos - Collapsible */}
      {andamentosHistorico.length > 0 && (
        <Collapsible
          open={historicoAberto}
          onOpenChange={setHistoricoAberto}
          className="space-y-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-between h-12 text-base"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">
                  Histórico de Andamentos ({andamentosHistorico.length})
                </span>
              </div>
              {historicoAberto ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Origem → Destino</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Resposta</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {andamentosHistorico.map((and) => (
                      <AndamentoRow
                        key={and.id}
                        andamento={and}
                        processoId={processo.id}
                        onRefresh={refreshFn}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Mensagem quando não há andamentos */}
      {andamentosEmAndamento.length === 0 &&
        andamentosHistorico.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-base">
                  Nenhum andamento cadastrado para este processo.
                </p>
                <p className="text-sm mt-2">
                  Clique no botão acima para adicionar o primeiro andamento.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

// Componente para Card de Andamento Detalhado
function AndamentoCard({
  andamento,
  processoId,
  onRefresh,
}: {
  andamento: IAndamento;
  processoId: string;
  onRefresh: () => void;
}) {
  const diasRestantes = calcularDiasRestantes(
    new Date(andamento.prazo),
    andamento.prorrogacao
  );
  const statusPrazo = getStatusPrazo(diasRestantes, andamento.status);
  const Icone = statusPrazo.icone;

  return (
    <div className="space-y-4">
      {/* Status e Prazo */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant={
            andamento.status === StatusAndamento.PRORROGADO
              ? "secondary"
              : "outline"
          }
        >
          {andamento.status === StatusAndamento.EM_ANDAMENTO
            ? "Em Andamento"
            : andamento.status === StatusAndamento.PRORROGADO
            ? "Prorrogado"
            : "Concluído"}
        </Badge>
        {andamento.status !== StatusAndamento.CONCLUIDO && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium",
              statusPrazo.bg,
              statusPrazo.cor
            )}
          >
            <Icone className="h-4 w-4" />
            <span>{statusPrazo.texto}</span>
          </div>
        )}
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Origem</p>
            <p className="text-base font-medium">{andamento.origem}</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Destino</p>
            <p className="text-base font-medium">{andamento.destino}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Prazo Original</p>
              <p className="text-base font-medium">
                {new Date(andamento.prazo).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          {andamento.usuario && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Responsável</p>
                <p className="text-base font-medium">
                  {andamento.usuario.nomeSocial || andamento.usuario.nome}
                </p>
              </div>
            </div>
          )}
          {andamento.prorrogacao && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Prazo Prorrogado
                </p>
                <p className="text-base font-medium text-orange-600 dark:text-orange-400">
                  {new Date(andamento.prorrogacao).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {andamento.usuarioProrrogacao && (
                  <p className="text-xs text-muted-foreground mt-1">
                    por{" "}
                    {andamento.usuarioProrrogacao.nomeSocial ||
                      andamento.usuarioProrrogacao.nome}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Observações */}
      {andamento.observacao && (
        <ObservacoesSection
          observacao={andamento.observacao}
          andamentoId={andamento.id}
          processoId={processoId}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

// Componente para linha da tabela de andamentos históricos
function AndamentoRow({
  andamento,
  processoId,
  onRefresh,
}: {
  andamento: IAndamento;
  processoId: string;
  onRefresh: () => void;
}) {
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);

  // Função para obter o estilo do badge baseado no status
  const getStatusBadge = (status: StatusAndamento) => {
    switch (status) {
      case StatusAndamento.CONCLUIDO:
        return {
          label: "Concluído",
          className:
            "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300",
        };
      case StatusAndamento.PRORROGADO:
        return {
          label: "Prorrogado",
          className:
            "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300",
        };
      case StatusAndamento.EM_ANDAMENTO:
        return {
          label: "Em Andamento",
          className:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300",
        };
      default:
        return {
          label: "Desconhecido",
          className:
            "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-300",
        };
    }
  };

  const statusBadge = getStatusBadge(andamento.status);

  return (
    <>
      <TableRow>
        <TableCell className="w-12">
          {andamento.observacao && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <span>{andamento.origem}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span>{andamento.destino}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm">
          {new Date(andamento.prazo).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </TableCell>
        <TableCell className="text-sm">
          {andamento.conclusao
            ? new Date(andamento.conclusao).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-"}
        </TableCell>
        <TableCell className="text-sm">
          {andamento.usuario?.nomeSocial || andamento.usuario?.nome || "-"}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex gap-1 justify-end">
            <ModalEditAndamento andamento={andamento} onSuccess={onRefresh} />
            {session?.usuario?.permissao &&
              ["DEV", "ADM", "TEC"].includes(
                session.usuario.permissao.toString()
              ) && (
                <ModalDeleteAndamento
                  andamento={andamento}
                  onSuccess={onRefresh}
                />
              )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && andamento.observacao && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30">
            <ObservacoesSection
              observacao={andamento.observacao}
              andamentoId={andamento.id}
              processoId={processoId}
              onRefresh={onRefresh}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Componente para seção de observações
function ObservacoesSection({
  observacao,
  andamentoId,
  processoId,
  onRefresh,
}: {
  observacao: string;
  andamentoId: string;
  processoId: string;
  onRefresh: () => void;
}) {
  const parsearObservacao = (obs: string) => {
    const obsTrimmed = obs.trim();
    if (!obsTrimmed) return null;

    const match = obsTrimmed.match(/^\[([^\]]+)\]\s+([^:]+):\s*([\s\S]*)$/);
    if (match && match.length >= 4) {
      const dataHora = match[1]?.trim();
      const autor = match[2]?.trim();
      const texto = match[3]?.trim() || "";

      if (dataHora && autor) {
        return { dataHora, autor, texto };
      }
    }

    return null;
  };

  const observacoes = observacao
    .split(/\n\s*---\s*\n/)
    .filter((obs) => obs.trim().length > 0)
    .reverse();

  return (
    <div className="space-y-3 mt-4">
      {/* Header com mais destaque */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-lg">
        <div className="p-2 bg-blue-500 rounded-md">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
          Observações
        </h3>
      </div>

      {/* Lista de observações com mais espaço */}
      <div className="space-y-3 pl-2">
        {observacoes.map((obs, idx) => {
          const parsed = parsearObservacao(obs);
          const totalObservacoes = observacoes.length;
          const indiceOriginal = totalObservacoes - 1 - idx;

          if (parsed) {
            return (
              <div
                key={idx}
                className="bg-background p-4 rounded-lg space-y-3 border-2 border-muted hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold text-foreground">
                        {parsed.autor}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{parsed.dataHora}</span>
                    </div>
                  </div>
                  <ModalEditObservacao
                    processoId={processoId}
                    andamentoId={andamentoId}
                    observacaoOriginal={obs}
                    indiceObservacao={indiceOriginal}
                    onSuccess={onRefresh}
                  />
                </div>
                {parsed.texto && (
                  <div className="bg-muted/30 p-4 rounded-md border-l-4 border-blue-500">
                    <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                      {parsed.texto}
                    </p>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="bg-background p-4 rounded-lg border-2 border-muted hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="bg-muted/30 p-4 rounded-md border-l-4 border-blue-500 flex-1">
                  <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                    {obs.trim()}
                  </p>
                </div>
                <ModalEditObservacao
                  processoId={processoId}
                  andamentoId={andamentoId}
                  observacaoOriginal={obs}
                  indiceObservacao={indiceOriginal}
                  onSuccess={onRefresh}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
