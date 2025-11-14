/** @format */

'use client';

import { IUnidade } from '@/types/unidade';
import { ColumnDef } from '@tanstack/react-table';
import ModalUpdateCreate from './modal-update-create';
import ModalDelete from './modal-delete';

export const columns: ColumnDef<IUnidade>[] = [
	{
		accessorKey: 'nome',
		header: 'Nome',
	},
	{
		accessorKey: 'sigla',
		header: 'Sigla',
	},
	{
		accessorKey: 'actions',
		header: () => <p className='text-center'>Ações</p>,
		cell: ({ row }) => {
			return (
				<div
					className='flex gap-2 items-center justify-center'
					key={row.id}>
					<ModalUpdateCreate
						unidade={row.original}
						isUpdating={true}
					/>
					<ModalDelete
						id={row.original.id}
					/>
				</div>
			);
		},
	},
];



