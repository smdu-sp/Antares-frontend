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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import * as andamento from '@/services/andamentos';

const formSchema = z.object({
	observacao: z.string().min(1, 'Observação é obrigatória'),
});

export default function ModalAdicionarObservacao({
	processoId,
	onSuccess,
}: {
	processoId: string;
	onSuccess?: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const { data: session } = useSession();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			observacao: '',
		},
	});

	const handleSuccess = () => {
		setOpen(false);
		form.reset();
		onSuccess?.();
	};

	async function onSubmit(data: z.infer<typeof formSchema>) {
		if (!session?.access_token) {
			toast.error('Não autorizado');
			return;
		}

		startTransition(async () => {
			try {
				// Buscar o último andamento do processo para adicionar a observação
				const response = await andamento.query.buscarPorProcesso(
					session.access_token,
					processoId,
				);

				if (!response.ok || !response.data || response.data.length === 0) {
					toast.error('Erro', { 
						description: 'Não foi possível encontrar um andamento para adicionar a observação' 
					});
					return;
				}

				// Pega o último andamento (mais recente)
				const ultimoAndamento = response.data[0];

				// Formata a nova observação com data/hora e autor
				const agora = new Date();
				const dataFormatada = agora.toLocaleDateString('pt-BR', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				});
				const usuarioNome = session?.usuario?.nomeSocial || session?.usuario?.nome || 'Usuário';
				// Garante que o formato seja: [data] autor:\ntexto
				const novaObservacao = `[${dataFormatada}] ${usuarioNome}:\n${data.observacao.trim()}`;

				// Concatena com observação existente se houver
				// Usa separador consistente
				const separador = '\n\n---\n\n';
				const observacaoCompleta = ultimoAndamento.observacao
					? `${ultimoAndamento.observacao.trim()}${separador}${novaObservacao}`
					: novaObservacao;

				// Atualiza o andamento com a observação concatenada
				const resp = await andamento.server.atualizar(ultimoAndamento.id, {
					observacao: observacaoCompleta,
				});

				if (!resp.ok) {
					toast.error('Erro', { description: resp.error });
				} else {
					toast.success('Observação adicionada com sucesso');
					handleSuccess();
				}
			} catch (error) {
				toast.error('Erro', { 
					description: 'Não foi possível adicionar a observação' 
				});
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size='sm'
					variant='outline'
					className='hover:bg-blue-500 hover:text-white'>
					<MessageSquarePlus className='h-4 w-4 mr-2' />
					Observação
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar Observação</DialogTitle>
					<DialogDescription>
						Adicione uma observação ao processo
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-4'>
						<FormField
							control={form.control}
							name='observacao'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Observação</FormLabel>
									<FormControl>
										<Textarea
											placeholder='Digite sua observação...'
											className='min-h-[120px]'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='flex gap-2 justify-end'>
							<Button
								type='button'
								variant='outline'
								onClick={() => setOpen(false)}>
								Cancelar
							</Button>
							<Button
								type='submit'
								disabled={isPending}>
								{isPending ? (
									<Loader2 className='animate-spin' />
								) : (
									'Adicionar'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

