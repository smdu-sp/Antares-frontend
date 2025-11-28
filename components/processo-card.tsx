/** @format */

"use client";

import { IProcesso } from "@/types/processo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  SquarePen,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUltimoAndamento,
  calcularDiasRestantes,
  getStatusPrazo,
} from "@/app/(rotas-auth)/processos/_components/utils";
import { StatusAndamento } from "@/types/processo";
import ModalProcesso from "@/app/(rotas-auth)/processos/_components/modal-processo";
import ModalDeleteProcesso from "@/app/(rotas-auth)/processos/_components/modal-delete-processo";
import Link from "next/link";

export default function ProcessoCard({ processo }: { processo: IProcesso }) {
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

  const Icone = statusPrazo?.icone;

  // Função para determinar a cor da borda baseada no status
  const getBorderColor = () => {
    if (!ultimoAndamento) return "border-l-gray-400";

    // Se concluído, sempre verde
    if (ultimoAndamento.status === StatusAndamento.CONCLUIDO) {
      return "border-l-green-500";
    }

    // Se em andamento, verifica o prazo
    if (diasRestantes !== null) {
      if (diasRestantes < 0) return "border-l-red-500"; // Atrasado
      if (diasRestantes === 0) return "border-l-orange-500"; // Vencendo hoje
      if (diasRestantes <= 7) return "border-l-yellow-500"; // Em andamento (próximo do prazo)
    }

    return "border-l-yellow-500"; // Em andamento (padrão)
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-200 border-l-4",
        getBorderColor()
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-mono">
                {processo.numero_sei}
              </Badge>
              {ultimoAndamento && statusPrazo && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-medium",
                    statusPrazo.bg,
                    statusPrazo.cor
                  )}
                >
                  {statusPrazo.texto}
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold leading-tight line-clamp-2">
              {processo.assunto}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações de Prazo */}
        {ultimoAndamento ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Prazo:</span>
              <span className="font-medium">
                {new Date(ultimoAndamento.prazo).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {ultimoAndamento.prorrogacao && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Prorrogado até:</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {new Date(ultimoAndamento.prorrogacao).toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            )}

            {diasRestantes !== null &&
              ultimoAndamento.status !== "CONCLUIDO" && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md text-sm font-medium",
                    statusPrazo?.bg,
                    statusPrazo?.cor
                  )}
                >
                  {Icone && <Icone className="h-4 w-4" />}
                  <span>
                    {diasRestantes < 0
                      ? `Atrasado há ${Math.abs(diasRestantes)} dias`
                      : diasRestantes === 0
                      ? "Vence hoje"
                      : diasRestantes === 1
                      ? "Vence amanhã"
                      : `${diasRestantes} dias restantes`}
                  </span>
                </div>
              )}

            {ultimoAndamento.status === "CONCLUIDO" && (
              <div className="flex items-center gap-2 p-2 rounded-md text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Concluído</span>
              </div>
            )}

            {/* Origem e Destino */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center justify-between">
                <span>{ultimoAndamento.origem}</span>
                <span>→</span>
                <span>{ultimoAndamento.destino}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-2">
            Nenhum andamento registrado
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-2 border-t">
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link href={`/processos/${processo.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Link>
          </Button>
          <ModalProcesso processo={processo} isUpdating={true} />
          <ModalDeleteProcesso id={processo.id} />
        </div>
      </CardContent>
    </Card>
  );
}
