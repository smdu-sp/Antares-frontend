/** @format */

"use client";

import { IProcesso } from "@/types/processo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Clock } from "lucide-react";
import ModalProcesso from "@/app/(rotas-auth)/processos/_components/modal-processo";
import ModalDeleteProcesso from "@/app/(rotas-auth)/processos/_components/modal-delete-processo";
import {
  getUltimoAndamento,
  calcularDiasRestantes,
  getStatusPrazo,
} from "@/app/(rotas-auth)/processos/_components/utils";
import { cn } from "@/lib/utils";

export default function ProcessoDetalhesHeader({
  processo,
}: {
  processo: IProcesso;
}) {
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

  return (
    <Card
      className={cn(
        "border-l-4",
        ultimoAndamento && diasRestantes !== null && diasRestantes < 0
          ? "border-l-red-500"
          : ultimoAndamento && diasRestantes !== null && diasRestantes <= 3
          ? "border-l-orange-500"
          : ultimoAndamento && diasRestantes !== null && diasRestantes <= 7
          ? "border-l-yellow-500"
          : "border-l-green-500"
      )}
    >
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-sm">
                {processo.numero_sei}
              </Badge>
              {ultimoAndamento && statusPrazo && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-sm font-medium",
                    statusPrazo.bg,
                    statusPrazo.cor
                  )}
                >
                  <span className="flex items-center gap-1">
                    {Icone && <Icone className="h-3 w-3" />}
                    {statusPrazo.texto}
                  </span>
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold leading-tight">
              {processo.assunto}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <ModalProcesso processo={processo} isUpdating={true} />
            <ModalDeleteProcesso id={processo.id} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Criado em</p>
              <p className="text-sm font-medium">
                {new Date(processo.criadoEm).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {ultimoAndamento && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prazo Atual</p>
                <p className="text-sm font-medium">
                  {ultimoAndamento.prorrogacao
                    ? new Date(ultimoAndamento.prorrogacao).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : new Date(ultimoAndamento.prazo).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                </p>
              </div>
            </div>
          )}

          {ultimoAndamento && diasRestantes !== null && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div
                className={cn(
                  "p-2 rounded-md",
                  diasRestantes < 0
                    ? "bg-red-100 dark:bg-red-900/30"
                    : diasRestantes <= 3
                    ? "bg-orange-100 dark:bg-orange-900/30"
                    : "bg-green-100 dark:bg-green-900/30"
                )}
              >
                <Clock
                  className={cn(
                    "h-5 w-5",
                    diasRestantes < 0
                      ? "text-red-600 dark:text-red-400"
                      : diasRestantes <= 3
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-green-600 dark:text-green-400"
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status do Prazo</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    diasRestantes < 0
                      ? "text-red-600 dark:text-red-400"
                      : diasRestantes <= 3
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-green-600 dark:text-green-400"
                  )}
                >
                  {diasRestantes < 0
                    ? `Atrasado ${Math.abs(diasRestantes)} dias`
                    : diasRestantes === 0
                    ? "Vence hoje"
                    : `${diasRestantes} dias restantes`}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
