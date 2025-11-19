/** @format */

import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { FileText, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessosMetricsProps {
  total: number;
  vencendoHoje: number;
  atrasados: number;
  emAndamento?: number;
}

export default function ProcessosMetrics({
  total,
  vencendoHoje,
  atrasados,
  emAndamento = 0,
}: ProcessosMetricsProps) {
  const metricas = [
    {
      titulo: "Total de Processos",
      valor: total,
      descricao: "Processos cadastrados no sistema",
      icone: FileText,
      cor: "text-blue-600 dark:text-blue-400",
      bgIcone: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      titulo: "Em Andamento",
      valor: emAndamento,
      descricao: "Processos ativos no momento",
      icone: Clock,
      cor: "text-indigo-600 dark:text-indigo-400",
      bgIcone: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      titulo: "Vencendo Hoje",
      valor: vencendoHoje,
      descricao: "Processos com prazo para hoje",
      icone: AlertTriangle,
      cor: "text-orange-600 dark:text-orange-400",
      bgIcone: "bg-orange-100 dark:bg-orange-900/30",
      destaque: vencendoHoje > 0,
    },
    {
      titulo: "Atrasados",
      valor: atrasados,
      descricao: "Processos com prazo vencido",
      icone: AlertTriangle,
      cor: "text-red-600 dark:text-red-400",
      bgIcone: "bg-red-100 dark:bg-red-900/30",
      destaque: atrasados > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metricas.map((metrica, index) => {
        const Icone = metrica.icone;
        return (
          <Card
            key={index}
            className={cn(
              "transition-all hover:shadow-md",
              metrica.destaque && "ring-2 ring-orange-500/20"
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardDescription className="text-sm font-medium mb-2">
                    {metrica.titulo}
                  </CardDescription>
                  <CardTitle
                    className={cn("text-4xl font-bold mb-1", metrica.cor)}
                  >
                    {metrica.valor.toLocaleString("pt-BR")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrica.descricao}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", metrica.bgIcone)}>
                  <Icone className={cn("h-6 w-6", metrica.cor)} />
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
