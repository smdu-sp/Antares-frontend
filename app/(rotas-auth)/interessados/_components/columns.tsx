/** @format */

"use client";

import { IInteressado } from "@/types/interessado";
import { ColumnDef } from "@tanstack/react-table";
import ModalUpdateCreate from "./modal-update-create";
import ModalDelete from "./modal-delete";

export const columns: ColumnDef<IInteressado>[] = [
  {
    accessorKey: "valor",
    header: "Nome do Interessado",
  },
  {
    accessorKey: "actions",
    header: () => <p className="text-center">Ações</p>,
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 items-center justify-center" key={row.id}>
          <ModalUpdateCreate interessado={row.original} isUpdating={true} />
          <ModalDelete id={row.original.id} />
        </div>
      );
    },
  },
];
