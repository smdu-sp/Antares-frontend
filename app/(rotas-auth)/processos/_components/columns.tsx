/** @format */

'use client';

import { IProcesso } from '@/types/processo';
import { ColumnDef } from '@tanstack/react-table';
import ModalProcesso from './modal-processo';
import ModalDeleteProcesso from './modal-delete-processo';

export const columns: ColumnDef<IProcesso>[] = [
	{
		accessorKey: 'numero_sei',
		header: 'Número SEI',
	},
	{
		accessorKey: 'assunto',
		header: 'Assunto',
	},
	{
		accessorKey: 'criadoEm',
		header: 'Data de Criação',
		cell: ({ row }) => {
			const date = new Date(row.original.criadoEm);
			return date.toLocaleDateString('pt-BR');
		},
	},
	{
		accessorKey: 'actions',
		header: () => <p className='text-center'>Ações</p>,
		cell: ({ row }) => {
			return (
				<div
					className='flex gap-2 items-center justify-center'
					key={row.id}>
					<ModalProcesso
						processo={row.original}
						isUpdating={true}
					/>
					<ModalDeleteProcesso id={row.original.id} />
				</div>
			);
		},
	},
];
