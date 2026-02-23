/** @format */

import { Filtros } from "@/components/filtros";
import Pagination from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import * as processo from "@/services/processos";
import * as unidade from "@/services/unidades";
import * as interessado from "@/services/interessados";
import * as andamento from "@/services/andamentos";
import {
  IPaginadoProcesso,
  IProcesso,
  IAndamento,
  StatusAndamento,
} from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import { IInteressado } from "@/types/interessado";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import FiltroVencendoHoje from "./processos/_components/filtro-vencendo-hoje";
import FiltroAtrasados from "./processos/_components/filtro-atrasados";
import FiltroConcluidos from "./processos/_components/filtro-concluidos";
import { ProcessosGrid } from "./_components/processos-grid";
import { BtnLimparFiltros } from "@/components/btn-limpar-filtros";
import MetricsToggle from "./_components/metrics-toggle";

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
  const {
    busca = "",
    interessado: interessadoFiltro = "",
    unidade: unidadeFiltro = "",
    vencendoHoje = "",
    atrasados = "",
    concluidos = "",
  } = await searchParams;

  // Garantir que os parâmetros sejam strings
  const buscaStr = Array.isArray(busca) ? busca[0] || "" : busca;
  const interessadoFiltroStr = Array.isArray(interessadoFiltro)
    ? interessadoFiltro[0] || ""
    : interessadoFiltro;
  const unidadeFiltroStr = Array.isArray(unidadeFiltro)
    ? unidadeFiltro[0] || ""
    : unidadeFiltro;
  const vencendoHojeStr = Array.isArray(vencendoHoje)
    ? vencendoHoje[0] || ""
    : vencendoHoje;
  const atrasadosStr = Array.isArray(atrasados)
    ? atrasados[0] || ""
    : atrasados;
  const concluidosStr = Array.isArray(concluidos)
    ? concluidos[0] || ""
    : concluidos;
  let dados: IProcesso[] = [];
  let unidadesLista: IUnidade[] = [];
  let interessadosLista: IInteressado[] = [];
  let totalVencendoHoje = 0;
  let totalAtrasados = 0;
  let totalProcessos = 0;
  let totalConcluidos = 0;
  let totalEmAndamento = 0;
  let andamentosEmAndamento = 0;
  let andamentosVencidos = 0;
  let andamentosVencendoHoje = 0;
  let andamentosConcluidos = 0;

  const session = await auth();
  if (session && session.access_token) {
    // Buscar TODOS os processos sem filtros do backend (porque os filtros do backend não estão funcionando corretamente)
    const response = await processo.query.buscarTudo(
      session.access_token || "",
      1,
      1000, // Buscar muitos processos para filtrar no frontend
      buscaStr as string,
      false, // Não usar filtro do backend
      false, // Não usar filtro do backend
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

        // Filtrar apenas processos ativos (soft delete)
        dados = dados.filter((p) => p.ativo === true);
      }
    }

    // IMPORTANTE: Carregar unidades e interessados SEMPRE, independente de haver processos
    // Pois são necessários para os editores autocomplete funcionarem na grid
    const unidadesResponse = await unidade.listaCompleta(session.access_token);
    const interessadosResult = await interessado.query.listaCompleta(
      session.access_token,
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

    // Enriquecer processos com dados de interessados e unidades (se houver processos)
    if (dados.length > 0) {
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
              8,
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
              8,
            )}...)`;
          }
        }

        // Filtrar apenas andamentos ativos (soft delete)
        if (proc.andamentos && Array.isArray(proc.andamentos)) {
          proc.andamentos = proc.andamentos.filter(
            (a: IAndamento) => a.ativo === true,
          );
        }

        return proc;
      });

      // Aplicar filtros client-side (porque o backend não está filtrando corretamente)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Filtro de busca (procura em numero_sei, assunto, interessado, resposta_final e campos dos andamentos)
      if (buscaStr.trim()) {
        const termoBusca = buscaStr.toLowerCase().trim();
        dados = dados.filter((p: any) => {
          // Busca nos campos principais do processo
          const buscaProcesso =
            p.numero_sei?.toLowerCase().includes(termoBusca) ||
            p.assunto?.toLowerCase().includes(termoBusca) ||
            p.interessado?.toLowerCase().includes(termoBusca) ||
            p.resposta_final?.toLowerCase().includes(termoBusca);

          // Busca nas observações e outros campos dos andamentos
          const buscaAndamentos = p.andamentos?.some(
            (andamento: any) =>
              andamento.observacao?.toLowerCase().includes(termoBusca) ||
              andamento.origem?.toLowerCase().includes(termoBusca) ||
              andamento.destino?.toLowerCase().includes(termoBusca) ||
              andamento.resposta?.toLowerCase().includes(termoBusca),
          );

          return buscaProcesso || buscaAndamentos;
        });
      }

      // Filtro por interessado
      if (interessadoFiltroStr.trim()) {
        const interessadoBusca = interessadoFiltroStr.toLowerCase().trim();
        dados = dados.filter((p: any) => {
          return p.interessado?.toLowerCase().includes(interessadoBusca);
        });
      }

      // Filtro por unidade (remetente ou destinatária)
      if (unidadeFiltroStr.trim()) {
        const unidadeBusca = unidadeFiltroStr.toLowerCase().trim();
        dados = dados.filter((p: any) => {
          // Busca na unidade remetente (nome ou sigla)
          const unidadeRemBusca =
            p.unidadeRemetente?.nome?.toLowerCase().includes(unidadeBusca) ||
            p.unidadeRemetente?.sigla?.toLowerCase().includes(unidadeBusca);

          // Busca na unidade destinatária (nome ou sigla)
          const unidadeDestBusca =
            p.unidadeDestino?.nome?.toLowerCase().includes(unidadeBusca) ||
            p.unidadeDestino?.sigla?.toLowerCase().includes(unidadeBusca);

          return unidadeRemBusca || unidadeDestBusca;
        });
      }

      if (vencendoHojeStr === "true") {
        dados = dados.filter((p: any) => {
          if (!p.prazo) return false;
          const prazo = new Date(p.prazo);
          prazo.setHours(0, 0, 0, 0);
          return prazo.getTime() === hoje.getTime();
        });
      }

      if (atrasadosStr === "true") {
        dados = dados.filter((p: any) => {
          // Excluir processos concluídos
          if (p.data_resposta_final || p.resposta_final) {
            return false;
          }
          if (p.andamentos && p.andamentos.length > 0) {
            if (p.andamentos.every((a: any) => a.status === "CONCLUIDO")) {
              return false;
            }
          }

          // Verificar se tem prazo vencido
          if (!p.prazo) return false;
          const prazo = new Date(p.prazo);
          prazo.setHours(0, 0, 0, 0);
          return prazo.getTime() < hoje.getTime();
        });
      }

      if (concluidosStr === "true") {
        dados = dados.filter((p: any) => {
          // Um processo é considerado concluído se:
          // 1. Tem resposta final (data_resposta_final existe), OU
          // 2. Todos os andamentos estão com status CONCLUIDO
          if (p.data_resposta_final || p.resposta_final) {
            return true;
          }

          if (p.andamentos && p.andamentos.length > 0) {
            return p.andamentos.every((a: any) => a.status === "CONCLUIDO");
          }

          return false;
        });
      }

      // Aplicar paginação após filtragem
      const startIndex = (Number(pagina) - 1) * Number(limite);
      const endIndex = startIndex + Number(limite);
      const dadosPaginados = dados.slice(startIndex, endIndex);

      // Atualizar total com o número de itens filtrados
      total = dados.length;
      dados = dadosPaginados;
    }

    // Buscar total geral (sem filtros) para o dashboard
    const totalGeralResponse = await processo.query.buscarTudo(
      session.access_token,
      1,
      1, // Busca apenas 1 item, só precisamos do total
      "", // Sem busca
      false, // Sem filtro vencendo hoje
      false, // Sem filtro atrasados
    );

    if (totalGeralResponse.ok && totalGeralResponse.data) {
      totalProcessos =
        (totalGeralResponse.data as IPaginadoProcesso).total || 0;
    }

    // Buscar métricas específicas
    const [vencendoHojeRes, atrasadosRes, concluidosRes, emAndamentoRes] = await Promise.all([
      processo.query.contarVencendoHoje(session.access_token),
      processo.query.contarAtrasados(session.access_token),
      processo.query.contarConcluidos(session.access_token),
      processo.query.contarEmAndamento(session.access_token),
    ]);

    if (vencendoHojeRes.ok && vencendoHojeRes.data !== null) {
      totalVencendoHoje = vencendoHojeRes.data;
    }
    if (atrasadosRes.ok && atrasadosRes.data !== null) {
      totalAtrasados = atrasadosRes.data;
    }
    if (concluidosRes.ok && concluidosRes.data !== null) {
      totalConcluidos = concluidosRes.data;
    }
    if (emAndamentoRes.ok && emAndamentoRes.data !== null) {
      totalEmAndamento = emAndamentoRes.data;
    }

    // Buscar andamentos para calcular métricas
    // Nota: Busca um limite alto para pegar todos os andamentos disponíveis
    // Idealmente, o backend deveria ter endpoints específicos de contagem como tem para processos
    const andamentosResponse = await andamento.query.buscarTudo(
      session.access_token,
      1,
      999999,
    );

    if (andamentosResponse.ok && andamentosResponse.data) {
      const andamentosPaginados = andamentosResponse.data as any;
      const andamentosLista = (andamentosPaginados.data || []).filter(
        (a: IAndamento) => a.ativo === true, // Filtrar apenas andamentos ativos
      );
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      andamentosLista.forEach((a: IAndamento) => {
        if (a.status === StatusAndamento.CONCLUIDO) {
          andamentosConcluidos++;
        } else {
          // Verificar prazo
          const prazo = new Date(a.prazo);
          prazo.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil(
            (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (diffDays < 0) {
            andamentosVencidos++;
          } else if (diffDays === 0) {
            andamentosVencendoHoje++;
          } else {
            andamentosEmAndamento++;
          }
        }
      });
    }
  }

  return (
    <div className="w-full flex justify-center relative pb-20 md:pb-14 h-full">
      <div className="w-full px-1.5 sm:px-4 md:px-8 min-w-0">
        {/* Header com Título */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 mt-4 sm:gap-4 sm:mb-6 sm:mt-6">
          <h1 className="text-lg sm:text-1xl md:text-3xl font-bold">
            Processos
          </h1>
        </div>

        {/* Métricas com Toggle */}
        <MetricsToggle
          processos={{
            total: totalProcessos,
            vencendoHoje: totalVencendoHoje,
            atrasados: totalAtrasados,
            emAndamento: totalEmAndamento,
          }}
          andamentos={{
            emAndamento: andamentosEmAndamento,
            vencidos: andamentosVencidos,
            vencendoHoje: andamentosVencendoHoje,
            concluidos: andamentosConcluidos,
          }}
        />

        <div className="flex flex-col gap-2 my-3 sm:gap-4 sm:my-5 w-full min-w-0">
          {/* Barra de Busca com Auto-Search */}
          <Filtros
            camposFiltraveis={[
              {
                nome: "Buscar Processo",
                tag: "busca",
                tipo: 0,
                placeholder:
                  "Buscar em número SEI, assunto, interessado, observações...",
              },
              {
                nome: "Interessado",
                tag: "interessado",
                tipo: 0,
                placeholder: "Filtrar por interessado...",
              },
              {
                nome: "Unidade (Remetente/Destinatária)",
                tag: "unidade",
                tipo: 0,
                placeholder: "Filtrar por unidade remetente ou destinatária...",
              },
            ]}
            showSearchButton={false}
            showClearButton={false}
            autoSearch={true}
            debounceMs={300}
            clearOtherFiltersOnSearch={false}
          />

          {/* Filtros Rápidos com Botão Limpar */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 items-stretch sm:items-center flex-wrap min-w-0">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground flex-shrink-0">
              Filtros rápidos:
            </span>
            <div className="flex flex-wrap gap-1 sm:gap-2 flex-1 min-w-0">
              <FiltroVencendoHoje />
              <FiltroAtrasados />
              <FiltroConcluidos />
            </div>
            <BtnLimparFiltros />
          </div>
        </div>

        {/* Visualização de Processos com Seleção */}
        <ProcessosGrid
          processos={dados}
          unidades={unidadesLista}
          interessados={interessadosLista}
          busca={buscaStr}
          interessado={interessadoFiltroStr}
          unidade={unidadeFiltroStr}
          vencendoHoje={vencendoHojeStr === "true"}
          atrasados={atrasadosStr === "true"}
          concluidos={concluidosStr === "true"}
        />

        {dados && dados.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <Pagination total={+total} pagina={+pagina} limite={+limite} />
          </div>
        )}
      </div>
    </div>
  );
}
