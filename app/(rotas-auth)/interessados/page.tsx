/** @format */

import DataTable, { TableSkeleton } from "@/components/data-table";
import { Filtros } from "@/components/filtros";
import Pagination from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import * as interessado from "@/services/interessados";
import { IInteressado } from "@/types/interessado";
import { Suspense } from "react";
import { columns } from "./_components/columns";
import ModalUpdateAndCreate from "./_components/modal-update-create";

export default async function InteressadosSuspense({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Interessados searchParams={searchParams} />
    </Suspense>
  );
}

async function Interessados({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let { pagina = 1, limite = 10, total = 0 } = await searchParams;
  let ok = false;
  const { busca = "" } = await searchParams;
  let dados: IInteressado[] = [];

  const session = await auth();
  if (session && session.access_token) {
    const response = await interessado.query.listar(session.access_token);
    const { data } = response;
    ok = response.ok;
    if (ok && data) {
      dados = data as IInteressado[];
      total = dados.length;
    }
  }

  return (
    <>
      <div className="flex flex-row gap-2 items-center justify-between mb-4 lg:mb-0">
        <h1 className="text-2xl font-bold">Interessados</h1>
        <ModalUpdateAndCreate />
      </div>
      <Filtros
        camposFiltraveis={[
          {
            nome: "Buscar Interessado",
            tag: "busca",
            tipo: 0,
            placeholder: "Digite o nome do interessado...",
          },
        ]}
        showSearchButton={false}
        showClearButton={false}
        autoSearch={true}
      />
      <DataTable columns={columns} data={dados} />
      <Pagination total={+total} pagina={+pagina} limite={+limite} />
    </>
  );
}
