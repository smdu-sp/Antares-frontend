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
import { Plus } from 'lucide-react';
import FormAndamento from './form-andamento';
import { useState } from 'react';

export default function ModalAndamento({
	processoId,
	onSuccess,
}: {
	processoId: string;
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
					variant='default'>
					<Plus className='h-4 w-4 mr-2' />
					Novo Andamento
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Criar Andamento</DialogTitle>
					<DialogDescription>
						Registre o envio do processo para uma unidade
					</DialogDescription>
				</DialogHeader>
				<FormAndamento
					processoId={processoId}
					onSuccess={handleSuccess}
				/>
			</DialogContent>
		</Dialog>
	);
}

