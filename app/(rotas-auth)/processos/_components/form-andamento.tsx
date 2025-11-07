/** @format */

'use client';

import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ICreateAndamento } from '@/types/processo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as andamento from '@/services/andamentos';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
	origem: z.string().min(2, 'Origem deve ter ao menos 2 caracteres'),
	destino: z.string().min(2, 'Destino deve ter ao menos 2 caracteres'),
	prazo: z.string().min(1, 'Prazo é obrigatório'),
	observacao: z.string().optional(),
});

export default function FormAndamento({
	processoId,
	onSuccess,
}: {
	processoId: string;
	onSuccess?: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<ICreateAndamento>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			processo_id: processoId,
			origem: '',
			destino: '',
			prazo: '',
			observacao: '',
		},
	});

	async function onSubmit(data: ICreateAndamento) {
		startTransition(async () => {
			// Converte a data para ISO string (apenas data, sem hora)
			// Define a hora como 00:00:00 para garantir que seja apenas a data
			const prazoISO = data.prazo
				? new Date(data.prazo + 'T00:00:00').toISOString()
				: '';
			
			const resp = await andamento.server.criar({
				...data,
				processo_id: processoId,
				prazo: prazoISO,
			});

			if (!resp.ok) {
				toast.error('Erro', { description: resp.error });
			} else {
				toast.success('Andamento criado com sucesso');
				form.reset();
				router.refresh();
				onSuccess?.();
			}
		});
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className='space-y-4'>
				<FormField
					control={form.control}
					name='origem'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Unidade de Origem</FormLabel>
							<FormControl>
								<Input
									placeholder='EXPEDIENTE'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='destino'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Unidade de Destino</FormLabel>
							<FormControl>
								<Input
									placeholder='COORDENADORIA_JURIDICA'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='prazo'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Prazo (Data Limite)</FormLabel>
							<FormControl>
								<Input
									type='date'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='observacao'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Observações (Opcional)</FormLabel>
							<FormControl>
								<Textarea
									placeholder='Observações sobre o andamento'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type='submit'
					disabled={isPending}
					className='w-full'>
					{isPending ? (
						<Loader2 className='animate-spin' />
					) : (
						'Criar Andamento'
					)}
				</Button>
			</form>
		</Form>
	);
}

