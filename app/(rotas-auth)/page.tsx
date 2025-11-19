/** @format */

import { Filtros } from "@/components/filtros";
import Pagination from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import * as processo from "@/services/processos";
import { IPaginadoProcesso, IProcesso } from "@/types/processo";
import { Suspense } from "react";
import ModalProcesso from "./processos/_components/modal-processo";
import { Skeleton } from "@/components/ui/skeleton";
import FiltroVencendoHoje from "./processos/_components/filtro-vencendo-hoje";
import FiltroAtrasados from "./processos/_components/filtro-atrasados";
import ProcessosMetrics from "@/components/processos-metrics";
import ProcessoCard from "@/components/processo-card";
import { BtnLimparFiltros } from "@/components/btn-limpar-filtros";

export default async function HomeSuspense({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<ProcessosGridSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

function ProcessosGridSkeleton() {
  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let { pagina = 1, limite = 10, total = 0 } = await searchParams;
  let ok = false;
  const { busca = "", vencendoHoje = "", atrasados = "" } = await searchParams;
  let dados: IProcesso[] = [];
  let totalVencendoHoje = 0;
  let totalAtrasados = 0;
  let totalProcessos = 0;

  const session = await auth();
  if (session && session.access_token) {
    // Buscar processos paginados (com filtros aplicados)
    const response = await processo.query.buscarTudo(
      session.access_token || "",
      +pagina,
      +limite,
      busca as string,
      vencendoHoje === "true",
      atrasados === "true"
    );
    const { data } = response;
    ok = response.ok;
    if (ok) {
      if (data) {
        const paginado = data as IPaginadoProcesso;
        pagina = paginado.pagina || 1;
        limite = paginado.limite || 10;
        total = paginado.total || 0;
        dados = paginado.data || [];
      }
    }

    // Buscar total geral (sem filtros) para o dashboard
    const totalGeralResponse = await processo.query.buscarTudo(
      session.access_token,
      1,
      1, // Busca apenas 1 item, só precisamos do total
      "", // Sem busca
      false, // Sem filtro vencendo hoje
      false // Sem filtro atrasados
    );

    if (totalGeralResponse.ok && totalGeralResponse.data) {
      totalProcessos =
        (totalGeralResponse.data as IPaginadoProcesso).total || 0;
    }

    // Buscar métricas específicas
    const [vencendoHojeRes, atrasadosRes] = await Promise.all([
      processo.query.contarVencendoHoje(session.access_token),
      processo.query.contarAtrasados(session.access_token),
    ]);

    if (vencendoHojeRes.ok && vencendoHojeRes.data !== null) {
      totalVencendoHoje = vencendoHojeRes.data;
    }
    if (atrasadosRes.ok && atrasadosRes.data !== null) {
      totalAtrasados = atrasadosRes.data;
    }
  }

  // Calcular "Em Andamento" = Total - Atrasados (sempre valores reais)
  const emAndamentoCount = Math.max(0, totalProcessos - totalAtrasados);

  return (
    <div className="w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto">
      {/* Header com Título e Botão Criar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-4xl font-bold">Processos</h1>
        <ModalProcesso isUpdating={false} showText={true} />
      </div>

      {/* Métricas */}
      <ProcessosMetrics
        total={totalProcessos}
        vencendoHoje={totalVencendoHoje}
        atrasados={totalAtrasados}
        emAndamento={emAndamentoCount}
      />

      <div className="flex flex-col max-w-sm mx-auto md:max-w-full gap-4 my-5 w-full">
        {/* Barra de Busca com Auto-Search */}
        <Filtros
          camposFiltraveis={[
            {
              nome: "Buscar Processo",
              tag: "busca",
              tipo: 0,
              placeholder: "Digite o número SEI ou assunto do processo...",
            },
          ]}
          showSearchButton={false}
          showClearButton={false}
          autoSearch={true}
          debounceMs={600}
        />

        {/* Filtros Rápidos com Botão Limpar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">
            Filtros rápidos:
          </span>
          <div className="flex flex-wrap gap-2 flex-1">
            <FiltroVencendoHoje />
            <FiltroAtrasados />
          </div>
          <BtnLimparFiltros />
        </div>

        {/* Grid de Cards */}
        {dados && dados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dados.map((processo) => (
              <ProcessoCard key={processo.id} processo={processo} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Nenhum processo encontrado</p>
            <p className="text-sm mt-2">
              Tente ajustar os filtros ou criar um novo processo
            </p>
          </div>
        )}

        {dados && dados.length > 0 && (
          <Pagination total={+total} pagina={+pagina} limite={+limite} />
        )}
      </div>
    </div>
  );
}
