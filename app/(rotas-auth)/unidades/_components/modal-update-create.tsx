/** @format */

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { IUnidade } from '@/types/unidade';
import { Plus, SquarePen } from 'lucide-react';
import FormUnidade from './form-unidade';

export default function ModalUpdateAndCreate({
	isUpdating,
	unidade,
}: {
	isUpdating: boolean;
	unidade?: Partial<IUnidade>;
}) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size={'icon'}
					variant={'outline'}
					className={`${
						isUpdating
							? 'bg-background hover:bg-primary '
							: 'bg-primary hover:bg-primary hover:opacity-70'
					} group transition-all ease-linear duration-200`}>
					{isUpdating ? (
						<SquarePen
							size={28}
							className='text-primary group-hover:text-white group'
						/>
					) : (
						<Plus
							size={28}
							className='text-white group'
						/>
					)}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isUpdating ? 'Editar ' : 'Criar '}Unidade</DialogTitle>
					<DialogDescription>
						Gerencie as informações da unidade selecionada.
					</DialogDescription>
				</DialogHeader>
				<FormUnidade
					unidade={unidade}
					isUpdating={isUpdating}
				/>
			</DialogContent>
		</Dialog>
	);
}



