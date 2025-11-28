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
	FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ICreateAndamento } from '@/types/processo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as andamento from '@/services/andamentos';
import * as unidade from '@/services/unidades';
import { useTransition, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MultiSelect } from '@/components/multi-select';
import { IUnidade } from '@/types/unidade';

const formSchema = z.object({
	origem: z.string().min(2, 'Origem deve ter ao menos 2 caracteres'),
	destinos: z.array(z.string()).min(1, 'Selecione ao menos uma unidade de destino'),
	prazo: z.string().min(1, 'Prazo é obrigatório'),
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
	const { data: session } = useSession();
	const [unidades, setUnidades] = useState<IUnidade[]>([]);
	const [loadingUnidades, setLoadingUnidades] = useState(true);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			origem: '',
			destinos: [],
			prazo: '',
		},
	});

	// Buscar lista de unidades
	useEffect(() => {
		if (session?.access_token) {
			unidade.listaCompleta(session.access_token).then((response) => {
				if (response.ok && response.data) {
					setUnidades(response.data as IUnidade[]);
				}
				setLoadingUnidades(false);
			});
		}
	}, [session]);

	async function onSubmit(data: z.infer<typeof formSchema>) {
		startTransition(async () => {
			// Converte a data para ISO string
			const prazoISO = data.prazo
				? new Date(data.prazo + 'T00:00:00').toISOString()
				: '';

			// Criar andamentos para cada destino selecionado
			const promises = data.destinos.map((destinoId) => {
				const unidadeDestino = unidades.find(u => u.id === destinoId);
				return andamento.server.criar({
					processo_id: processoId,
					origem: data.origem,
					destino: unidadeDestino?.sigla || destinoId,
					prazo: prazoISO,
				} as ICreateAndamento);
			});

			const results = await Promise.all(promises);
			const failed = results.filter(r => !r.ok);

			if (failed.length > 0) {
				if (failed.length === results.length) {
					toast.error('Erro', { 
						description: 'Não foi possível criar os andamentos' 
					});
				} else {
					toast.warning('Atenção', { 
						description: `${results.length - failed.length} andamento(s) criado(s), ${failed.length} falhou(am)` 
					});
				}
			} else {
				toast.success(
					data.destinos.length === 1 
						? 'Andamento criado com sucesso'
						: `${data.destinos.length} andamentos criados com sucesso`
				);
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
					name='destinos'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Unidades de Destino</FormLabel>
							<FormControl>
								{loadingUnidades ? (
									<div className="flex items-center justify-center py-2">
										<Loader2 className="h-4 w-4 animate-spin" />
										<span className="ml-2 text-sm text-muted-foreground">Carregando unidades...</span>
									</div>
								) : (
									<MultiSelect
										options={unidades.map(u => ({
											label: `${u.sigla} - ${u.nome}`,
											value: u.id,
										}))}
										onValueChange={field.onChange}
										defaultValue={field.value}
										placeholder="Selecione uma ou mais unidades"
										variant="inverted"
										maxCount={3}
									/>
								)}
							</FormControl>
							<FormDescription>
								Selecione múltiplas unidades para criar andamentos automáticos
							</FormDescription>
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

