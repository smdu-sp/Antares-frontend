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
    <div className="w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold">Interessados</h1>
      <div className="flex flex-col max-w-sm mx-auto md:max-w-full gap-3 my-5 w-full">
        <Filtros
          camposFiltraveis={[
            {
              nome: "Busca",
              tag: "busca",
              tipo: 0,
              placeholder: "Digite o nome do interessado...",
            },
          ]}
        />
        <DataTable columns={columns} data={dados || []} />

        {dados && dados.length > 0 && (
          <Pagination total={+total} pagina={+pagina} limite={+limite} />
        )}
      </div>
      <div className="absolute bottom-10 md:bottom-5 right-2 md:right-8 hover:scale-110">
        <ModalUpdateAndCreate isUpdating={false} />
      </div>
    </div>
  );
}
