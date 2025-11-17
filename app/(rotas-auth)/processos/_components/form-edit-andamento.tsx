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
import { IAndamento, IUpdateAndamento, StatusAndamento } from '@/types/processo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as andamento from '@/services/andamentos';
import { atualizar } from '@/services/andamentos';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

const formSchema = z.object({
	origem: z.string().min(2, 'Origem deve ter ao menos 2 caracteres').optional(),
	destino: z.string().min(2, 'Destino deve ter ao menos 2 caracteres').optional(),
	prazo: z.string().optional(),
	prorrogacao: z.string().optional(),
	conclusao: z.string().optional(),
});

export default function FormEditAndamento({
	andamento,
	onSuccess,
}: {
	andamento: IAndamento;
	onSuccess?: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	
	// Estados para controlar se os campos estão habilitados
	const [temProrrogacao, setTemProrrogacao] = useState(!!andamento.prorrogacao);
	const [temConclusao, setTemConclusao] = useState(!!andamento.conclusao);

	// Formata data para input date (apenas data, sem hora)
	const formatDateForInput = (date: Date | string | null | undefined) => {
		if (!date) return '';
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const form = useForm<IUpdateAndamento>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			origem: andamento.origem,
			destino: andamento.destino,
			prazo: formatDateForInput(andamento.prazo),
			prorrogacao: formatDateForInput(andamento.prorrogacao),
			conclusao: formatDateForInput(andamento.conclusao),
		},
	});

	async function onSubmit(data: IUpdateAndamento) {
		startTransition(async () => {
			// Converte datas para ISO string (apenas data, sem hora)
			// Se o checkbox não estiver marcado, envia null para limpar no backend
			const updateData: IUpdateAndamento = {
				...data,
				prazo: data.prazo
					? new Date(data.prazo + 'T00:00:00').toISOString()
					: undefined,
				prorrogacao: temProrrogacao && data.prorrogacao
					? new Date(data.prorrogacao + 'T00:00:00').toISOString()
					: null, // Envia null para limpar quando checkbox desmarcado
				conclusao: temConclusao && data.conclusao
					? new Date(data.conclusao + 'T00:00:00').toISOString()
					: null, // Envia null para limpar quando checkbox desmarcado
			};
			
			// Atualiza o status automaticamente baseado nos campos preenchidos
			if (temConclusao && updateData.conclusao) {
				updateData.status = StatusAndamento.CONCLUIDO;
			} else if (temProrrogacao && updateData.prorrogacao) {
				updateData.status = StatusAndamento.PRORROGADO;
			} else if (!temConclusao && !temProrrogacao) {
				// Se ambos os checkboxes estiverem desmarcados, volta para EM_ANDAMENTO
				updateData.status = StatusAndamento.EM_ANDAMENTO;
			}

			const resp = await atualizar(andamento.id, updateData);

			if (!resp.ok) {
				toast.error('Erro', { description: resp.error });
			} else {
				toast.success('Andamento atualizado com sucesso');
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
				{/* Campo de Prorrogação com Checkbox */}
				<div className='flex items-center gap-2'>
					<Checkbox
						checked={temProrrogacao}
						onCheckedChange={(checked) => {
							setTemProrrogacao(!!checked);
							if (!checked) {
								form.setValue('prorrogacao', '');
							}
						}}
					/>
					<FormField
						control={form.control}
						name='prorrogacao'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>Prorrogação</FormLabel>
								<FormControl>
									<Input
										type='date'
										{...field}
										value={field.value || ''}
										disabled={!temProrrogacao}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Campo de Conclusão com Checkbox */}
				<div className='flex items-center gap-2'>
					<Checkbox
						checked={temConclusao}
						onCheckedChange={(checked) => {
							setTemConclusao(!!checked);
							if (!checked) {
								form.setValue('conclusao', '');
							}
						}}
					/>
					<FormField
						control={form.control}
						name='conclusao'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>Data de Conclusão</FormLabel>
								<FormControl>
									<Input
										type='date'
										{...field}
										value={field.value || ''}
										disabled={!temConclusao}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button
					type='submit'
					disabled={isPending}
					className='w-full'>
					{isPending ? (
						<Loader2 className='animate-spin' />
					) : (
						'Atualizar Andamento'
					)}
				</Button>
			</form>
		</Form>
	);
}

