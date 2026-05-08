/** @format */

import { auth } from "@/lib/auth/auth";
import { canAdmin } from "@/lib/access-control";
import { redirect } from "next/navigation";
import * as log from "@/services/logs";
import LogsTable from "./_components/logs-table";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/data-table";
import Pagination from "@/components/pagination";
import { AccessState } from "../_components/access-state";

export default async function LogsPageSuspense({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <LogsPage searchParams={searchParams} />
    </Suspense>
  );
}

async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();

  if (!session?.access_token) {
    redirect("/login");
  }

  // Verifica se é admin ou dev
  const permissao = session.usuario?.permissao;
  if (!canAdmin(session) && permissao !== "DEV") {
    redirect("/");
  }

  if (!session.grupoAtivo?.id) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Logs do Sistema</h1>
        <AccessState
          title="Selecione um grupo ativo para continuar"
          description="Abra o menu do usuário e escolha um grupo ativo antes de acessar logs."
        />
      </div>
    );
  }

  const params = await searchParams;
  const pagina = params.pagina ? Number(params.pagina) : 1;
  const limite = params.limite ? Number(params.limite) : 50;
  const tipoAcao = params.tipoAcao as string | undefined;
  const entidadeTipo = params.entidadeTipo as string | undefined;
  const entidadeId = params.entidadeId as string | undefined;
  const usuario_id = params.usuario_id as string | undefined;
  const dataInicio = params.dataInicio as string | undefined;
  const dataFim = params.dataFim as string | undefined;

  const response = await log.query.buscarTudo(
    session.access_token as string,
    pagina,
    limite,
    tipoAcao,
    entidadeTipo,
    entidadeId,
    usuario_id,
    dataInicio,
    dataFim,
    session.grupoAtivo.id,
  );

  if (!response.ok || !response.data) {
    if (response.status === 403) {
      return (
        <div className="container mx-auto p-6 space-y-4">
          <h1 className="text-2xl font-bold mb-4">Logs do Sistema</h1>
          <AccessState
            title="Acesso negado para o grupo ativo"
            description="Seu grupo ativo não possui permissão para consultar logs."
          />
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Logs do Sistema</h1>
        <p className="text-destructive">
          {response.error || "Erro ao carregar logs"}
        </p>
      </div>
    );
  }

  const {
    data,
    total,
    pagina: paginaAtual,
    limite: limiteAtual,
  } = response.data;

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Logs do Sistema</h1>
      </div>

      <LogsTable logs={data} />

      {total > 0 && (
        <Pagination total={total} pagina={paginaAtual} limite={limiteAtual} />
      )}
    </div>
  );
}
