/** @format */

"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProcessosMetrics from "@/components/processos-metrics";
import AndamentosMetrics from "@/components/andamentos-metrics";

interface MetricsToggleProps {
  processos: {
    total: number;
    vencendoHoje: number;
    atrasados: number;
    emAndamento: number;
  };
  andamentos: {
    emAndamento: number;
    vencidos: number;
    vencendoHoje: number;
    concluidos: number;
  };
}

export default function MetricsToggle({
  processos,
  andamentos,
}: MetricsToggleProps) {
  const [showMetrics, setShowMetrics] = useState(true);

  const toggleMetrics = useCallback(() => {
    setShowMetrics((prev) => !prev);
  }, []);

  return (
    <div className="w-full space-y-2 sm:space-y-4 overflow-hidden">
      {/* Toggle Button - Positioned Right */}
      <div className="flex justify-end w-full overflow-hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMetrics}
          className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0 h-8 sm:h-10"
        >
          {showMetrics ? (
            <>
              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Ocultar Resumo</span>
              <span className="sm:hidden">Ocultar</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mostrar Resumo</span>
              <span className="sm:hidden">Mostrar</span>
            </>
          )}
        </Button>
      </div>

      {/* Métricas - Condicionalmente renderizadas */}
      {showMetrics && (
        <div className="space-y-3 sm:space-y-6">
          {/* Header com Título */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
            <h2 className="text-base sm:text-1xl md:text-2xl font-bold">
              Processos
            </h2>
          </div>

          {/* Métricas de Processos */}
          <ProcessosMetrics
            total={processos.total}
            vencendoHoje={processos.vencendoHoje}
            atrasados={processos.atrasados}
            emAndamento={processos.emAndamento}
          />

          {/* Header com Título */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mt-4 sm:mt-6">
            <h2 className="text-base sm:text-1xl md:text-2xl font-bold">
              Andamentos
            </h2>
          </div>

          {/* Métricas de Andamentos */}
          <AndamentosMetrics
            emAndamento={andamentos.emAndamento}
            vencidos={andamentos.vencidos}
            vencendoHoje={andamentos.vencendoHoje}
            concluidos={andamentos.concluidos}
          />
        </div>
      )}
    </div>
  );
}
