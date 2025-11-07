/** @format */

'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { IAndamento } from '@/types/processo';
import { SquarePen } from 'lucide-react';
import FormEditAndamento from './form-edit-andamento';
import { useState } from 'react';

export default function ModalEditAndamento({
	andamento,
	onSuccess,
}: {
	andamento: IAndamento;
	onSuccess?: () => void;
}) {
	const [open, setOpen] = useState(false);

	const handleSuccess = () => {
		setOpen(false);
		onSuccess?.();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size='sm'
					variant='outline'
					className='hover:bg-primary hover:text-white'>
					<SquarePen className='h-4 w-4 mr-2' />
					Editar
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Andamento</DialogTitle>
					<DialogDescription>
						Atualize as informações do andamento
					</DialogDescription>
				</DialogHeader>
				<FormEditAndamento
					andamento={andamento}
					onSuccess={handleSuccess}
				/>
			</DialogContent>
		</Dialog>
	);
}

