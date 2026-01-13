/** @format */

import { Filtros } from "@/components/filtros";
import Pagination from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import * as processo from "@/services/processos";
import * as unidade from "@/services/unidades";
import * as interessado from "@/services/interessados";
import { IPaginadoProcesso, IProcesso } from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import { IInteressado } from "@/types/interessado";
import { Suspense } from "react";
import ModalProcesso from "./processos/_components/modal-processo";
import { Skeleton } from "@/components/ui/skeleton";
import FiltroVencendoHoje from "./processos/_components/filtro-vencendo-hoje";
import FiltroAtrasados from "./processos/_components/filtro-atrasados";
import FiltroConcluidos from "./processos/_components/filtro-concluidos";
import ProcessosMetrics from "@/components/processos-metrics";
import ProcessosSpreadsheet from "@/components/processos-spreadsheet";
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
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let { pagina = 1, limite = 100, total = 0 } = await searchParams;
  let ok = false;
  const { busca = "", vencendoHoje = "", atrasados = "" } = await searchParams;
  let dados: IProcesso[] = [];
  let unidadesLista: IUnidade[] = [];
  let interessadosLista: IInteressado[] = [];
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

        // Enriquecer dados com informações das unidades e interessados
        if (dados.length > 0) {
          // Buscar lista de unidades e interessados
          const unidadesResponse = await unidade.listaCompleta(
            session.access_token
          );
          const interessadosResult = await interessado.query.listaCompleta(
            session.access_token
          );

          let unidadesMap = new Map<string, IUnidade>();
          if (unidadesResponse.ok && unidadesResponse.data) {
            const unidades = unidadesResponse.data as IUnidade[];
            unidadesLista = unidades; // Armazenar para uso no spreadsheet
            unidadesMap = new Map(unidades.map((u) => [u.id, u]));
          }

          let interessadosMap = new Map<string, IInteressado>();
          if (interessadosResult && Array.isArray(interessadosResult)) {
            interessadosLista = interessadosResult;
            interessadosMap = new Map(interessadosResult.map((i) => [i.id, i]));
          }

          // Enriquecer processos com dados de interessados e unidades
          dados = dados.map((p) => {
            const proc = p as any;

            // Processar interessado se tiver interessado_id
            if (proc.interessado_id) {
              const interessadoObj = interessadosMap.get(proc.interessado_id);
              if (interessadoObj) {
                proc.interessado = interessadoObj.valor;
              } else {
                proc.interessado = `Interessado não encontrado (ID: ${proc.interessado_id.substring(
                  0,
                  8
                )}...)`;
              }
            }

            // Processar unidade remetente
            if (proc.unidade_remetente_id) {
              const unidadeRem = unidadesMap.get(proc.unidade_remetente_id);
              if (unidadeRem) {
                proc.unidadeRemetente = unidadeRem;
              } else {
                // Unidade não encontrada - pode estar inativa ou deletada
                proc.unidade_remetente = `Unidade não encontrada (ID: ${proc.unidade_remetente_id.substring(
                  0,
                  8
                )}...)`;
              }
            }
            return proc;
          });
        }
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
      {/* Header com Título e Botão */}
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
            {
              nome: "Interessado",
              tag: "interessado",
              tipo: 0,
              placeholder: "Filtrar por interessado...",
            },
            {
              nome: "Unidade de Origem",
              tag: "origem",
              tipo: 0,
              placeholder: "Filtrar por unidade de origem...",
            },
          ]}
          showSearchButton={false}
          showClearButton={false}
          autoSearch={true}
          debounceMs={600}
          clearOtherFiltersOnSearch={false}
        />

        {/* Filtros Rápidos com Botão Limpar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">
            Filtros rápidos:
          </span>
          <div className="flex flex-wrap gap-2 flex-1">
            <FiltroVencendoHoje />
            <FiltroAtrasados />
            <FiltroConcluidos />
          </div>
          <BtnLimparFiltros />
        </div>

        {/* Visualização de Processos */}
        <ProcessosSpreadsheet
          processos={dados}
          unidades={unidadesLista}
          interessados={interessadosLista}
        />

        {dados && dados.length > 0 && (
          <Pagination total={+total} pagina={+pagina} limite={+limite} />
        )}
      </div>
    </div>
  );
}
