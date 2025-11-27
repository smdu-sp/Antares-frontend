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
import { IProcesso, ICreateProcesso, IUpdateProcesso } from '@/types/processo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as processo from '@/services/processos';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const formSchema = z.object({
	numero_sei: z.string().min(3, 'Número SEI deve ter ao menos 3 caracteres'),
	assunto: z.string().min(5, 'Assunto deve ter ao menos 5 caracteres'),
});

export default function FormProcesso({
	processo: processoData,
	isUpdating,
	onSuccess,
}: {
	processo?: Partial<IProcesso>;
	isUpdating: boolean;
	onSuccess?: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const pathname = usePathname();

	const form = useForm<ICreateProcesso | IUpdateProcesso>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			numero_sei: processoData?.numero_sei || '',
			assunto: processoData?.assunto || '',
		},
	});

	async function onSubmit(data: ICreateProcesso | IUpdateProcesso) {
		startTransition(async () => {
			let resp;
			if (isUpdating && processoData?.id) {
				resp = await processo.server.atualizar(processoData.id, data);
			} else {
				resp = await processo.server.criar(data as ICreateProcesso);
			}

			if (!resp.ok) {
				toast.error('Erro', { description: resp.error });
			} else {
				toast.success(
					isUpdating
						? 'Processo atualizado com sucesso'
						: 'Processo criado com sucesso',
				);
				form.reset();
				// Limpa os filtros e busca da URL
				router.push(pathname);
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
					name='numero_sei'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Número SEI</FormLabel>
							<FormControl>
								<Input
									placeholder='1234567'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='assunto'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Assunto</FormLabel>
							<FormControl>
								<Textarea
									placeholder='Descreva o assunto do processo'
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
					) : isUpdating ? (
						'Atualizar'
					) : (
						'Criar'
					)}
				</Button>
			</form>
		</Form>
	);
}

