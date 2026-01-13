/** @format */

"use client";

import { IProcesso, StatusAndamento } from "@/types/processo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  getUltimoAndamento,
  calcularDiasRestantes,
  getStatusPrazo,
} from "@/app/(rotas-auth)/processos/_components/utils";

interface ProcessosTableProps {
  processos: IProcesso[];
}

export default function ProcessosTable({ processos }: ProcessosTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[140px]">SEI</TableHead>
            <TableHead className="w-[150px]">Interessado</TableHead>
            <TableHead className="w-[150px]">Unidade Remetente</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead className="w-[120px]">Prazo</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processos.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-lg">Nenhum processo encontrado</p>
                <p className="text-sm mt-2">
                  Tente ajustar os filtros ou criar um novo processo
                </p>
              </TableCell>
            </TableRow>
          ) : (
            processos.map((processo) => (
              <ProcessoRow key={processo.id} processo={processo} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ProcessoRow({ processo }: { processo: IProcesso }) {
  const [isOpen, setIsOpen] = useState(false);

  const ultimoAndamento = getUltimoAndamento(processo.andamentos);
  const diasRestantes = ultimoAndamento
    ? calcularDiasRestantes(
        new Date(ultimoAndamento.prazo),
        ultimoAndamento.prorrogacao
      )
    : null;
  const statusPrazo =
    ultimoAndamento && diasRestantes !== null
      ? getStatusPrazo(diasRestantes, ultimoAndamento.status)
      : null;

  // Função para determinar a cor da linha baseada no status
  const getRowColor = () => {
    if (!ultimoAndamento) return "";

    // Se concluído, sempre verde claro
    if (ultimoAndamento.status === StatusAndamento.CONCLUIDO) {
      return "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30";
    }

    // Se em andamento, verifica o prazo
    if (diasRestantes !== null) {
      if (diasRestantes < 0)
        return "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"; // Atrasado
      if (diasRestantes === 0)
        return "bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30"; // Vencendo hoje
      if (diasRestantes <= 7)
        return "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30"; // Próximo do prazo
    }

    return "hover:bg-muted/50"; // Em andamento (padrão)
  };

  const Icone = statusPrazo?.icone;

  return (
    <TableRow className={cn("transition-colors", getRowColor())}>
      {/* SEI */}
      <TableCell className="font-mono font-medium">
        {processo.numero_sei}
      </TableCell>

      {/* Interessado */}
      <TableCell>
        {(() => {
          const unidade =
            processo.unidadeInteressada ||
            (processo as any).unidade_interessada;
          if (unidade) {
            return (
              <span className="text-sm">
                <span className="font-medium">{unidade.sigla}</span>
                {" - "}
                <span className="text-muted-foreground">{unidade.nome}</span>
              </span>
            );
          }
          if (processo.interessado) {
            return (
              <span className="text-sm text-muted-foreground">
                {processo.interessado}
              </span>
            );
          }
          return (
            <span className="text-xs text-muted-foreground italic">
              Não informado
            </span>
          );
        })()}
      </TableCell>

      {/* Unidade Remetente */}
      <TableCell>
        {(() => {
          const unidade =
            processo.unidadeRemetente ||
            (processo as any).unidade_remetente_obj;
          if (unidade && typeof unidade === "object" && "sigla" in unidade) {
            return (
              <span className="text-sm">
                <span className="font-medium">{unidade.sigla}</span>
                {" - "}
                <span className="text-muted-foreground">{unidade.nome}</span>
              </span>
            );
          }
          if (
            processo.unidade_remetente &&
            typeof processo.unidade_remetente === "string"
          ) {
            return (
              <span className="text-sm text-muted-foreground">
                {processo.unidade_remetente}
              </span>
            );
          }
          return (
            <span className="text-xs text-muted-foreground italic">
              Não informado
            </span>
          );
        })()}
      </TableCell>

      {/* Assunto com Toggle */}
      <TableCell>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-start gap-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-transparent"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <div className="flex-1 min-w-0">
              <CollapsibleContent className="text-sm">
                {processo.assunto}
              </CollapsibleContent>
              {!isOpen && (
                <p className="text-sm line-clamp-1">{processo.assunto}</p>
              )}
            </div>
          </div>
        </Collapsible>
      </TableCell>

      {/* Prazo */}
      <TableCell>
        {processo.prazo ? (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {new Date(processo.prazo).toLocaleDateString("pt-BR")}
            </div>
            {ultimoAndamento?.status !== StatusAndamento.CONCLUIDO &&
              (() => {
                const diasRestantesProcesso = calcularDiasRestantes(
                  new Date(processo.prazo),
                  null
                );
                return diasRestantesProcesso !== null ? (
                  <div className="text-xs text-muted-foreground">
                    {diasRestantesProcesso < 0
                      ? `${Math.abs(diasRestantesProcesso)}d atrasado`
                      : diasRestantesProcesso === 0
                      ? "Vence hoje"
                      : diasRestantesProcesso === 1
                      ? "Vence amanhã"
                      : `${diasRestantesProcesso}d restantes`}
                  </div>
                ) : null;
              })()}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Sem prazo definido
          </span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        {ultimoAndamento && statusPrazo ? (
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium gap-1",
              statusPrazo.bg,
              statusPrazo.cor
            )}
          >
            {Icone && <Icone className="h-3 w-3" />}
            {statusPrazo.texto}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Sem Status
          </Badge>
        )}
      </TableCell>

      {/* Ações */}
      <TableCell className="text-center">
        <Link href={`/processos/${processo.id}`}>
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <Eye className="h-4 w-4" />
            Ver
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}
