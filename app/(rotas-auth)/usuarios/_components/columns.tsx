/** @format */

"use client";

import { Badge } from "@/components/ui/badge";
import { canAdmin, canEdit } from "@/lib/access-control";
import { IUsuario } from "@/types/usuario";
import { ColumnDef } from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import ModalDelete from "./modal-delete";
import ModalGovernancaDev from "./modal-governanca-dev";
import ModalUpdateCreate from "./modal-update-create";

function hasGrupoVinculado(user: IUsuario): boolean {
  const raw = user as unknown as {
    grupoId?: string;
    grupo_id?: string;
    grupos?: Array<{ id?: string }>;
  };

  return Boolean(raw.grupoId || raw.grupo_id || raw.grupos?.[0]?.id);
}

function getConfiguracaoDevStatus(user: IUsuario): "aplicada" | "pendente" {
  const hasGrupo = hasGrupoVinculado(user);

  return hasGrupo ? "aplicada" : "pendente";
}

function UserActionsCell({ user }: { user: IUsuario }) {
  const { data: session } = useSession();
  const hasEditPermission = canEdit(session?.usuario);
  const hasAdminPermission = canAdmin(session?.usuario);
  const isDev = session?.usuario?.permissao === "DEV";

  if (!hasEditPermission) {
    return (
      <div className="text-center text-xs text-muted-foreground">
        Somente leitura
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center justify-center">
      <ModalUpdateCreate user={user} isUpdating={true} />
      {isDev && <ModalGovernancaDev user={user} />}
      {hasAdminPermission && <ModalDelete status={!user.status} id={user.id} />}
    </div>
  );
}

export const columns: ColumnDef<IUsuario>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "login",
    header: "Usuário",
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },
  {
    accessorKey: "unidade",
    header: "Unidade",
    cell: ({ row }) => {
      const unidade = row.original.unidade;
      return <div>{unidade ? `${unidade.nome} (${unidade.sigla})` : "-"}</div>;
    },
  },
  {
    accessorKey: "configuracaoDev",
    header: "Configuração DEV",
    cell: ({ row }) => {
      const status = getConfiguracaoDevStatus(row.original);

      return (
        <div className="flex items-center justify-center">
          <Badge variant={status === "aplicada" ? "default" : "secondary"}>
            {status === "aplicada" ? "Aplicada" : "Pendente"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <p className="text-center">Status</p>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex items-center justify-center">
          <Badge variant={`${status == false ? "destructive" : "default"}`}>
            {status ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "actions",
    header: () => <p className="text-center">Ações</p>,
    cell: ({ row }) => <UserActionsCell user={row.original} />,
  },
];
