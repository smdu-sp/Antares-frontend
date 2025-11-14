/** @format */

'use client';

import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import * as usuario from '@/services/usuarios';
import { listaCompleta } from '@/services/unidades/query-functions';
import { IPermissao, IUsuario } from '@/types/usuario';
import { IUnidade } from '@/types/unidade';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchemaUsuario = z.object({
	nome: z.string(),
	login: z.string(),
	email: z.string().email(),
	permissao: z.enum(['DEV', 'TEC', 'ADM', 'USR']),
	unidade_id: z.string().min(1, 'Unidade é obrigatória'),
});

const formSchema = z.object({
	login: z.string(),
});

interface FormUsuarioProps {
	isUpdating: boolean;
	user?: Partial<IUsuario>;
}

export default function FormUsuario({ isUpdating, user }: FormUsuarioProps) {
	const [isPending, startTransition] = useTransition();
	const [unidades, setUnidades] = useState<IUnidade[]>([]);
	const [loadingUnidades, setLoadingUnidades] = useState(true);
	
	const formUsuario = useForm<z.infer<typeof formSchemaUsuario>>({
		resolver: zodResolver(formSchemaUsuario),
		defaultValues: {
			email: user?.email || '',
			login: user?.login || '',
			nome: user?.nome || '',
			permissao:
				(user?.permissao as unknown as 'DEV' | 'TEC' | 'ADM' | 'USR') ?? 'USR',
			unidade_id: user?.unidade_id || '',
		},
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			login: '',
		},
	});

	const { data: session, update } = useSession();

	// Buscar unidades ao montar o componente
	useEffect(() => {
		async function carregarUnidades() {
			if (session?.access_token) {
				try {
					const response = await listaCompleta(session.access_token);
					if (response.ok && response.data) {
						setUnidades(response.data as IUnidade[]);
					}
				} catch (error) {
					console.error('Erro ao carregar unidades:', error);
				} finally {
					setLoadingUnidades(false);
				}
			}
		}
		carregarUnidades();
	}, [session]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const token = session?.access_token;
		if (!token) {
			toast.error('Não autorizado');
			return;
		}
		const { login } = values;
		const resp = await usuario.buscarNovo(login, token);

		if (resp.error) {
			toast.error('Algo deu errado', { description: resp.error });
		}

		if (resp.ok && resp.data) {
			const usuario = resp.data as IUsuario;
			toast.success('Usuário encontrado', { description: usuario.nome });
			formUsuario.setValue('nome', usuario.nome);
			formUsuario.setValue('email', usuario.email);
			formUsuario.setValue('login', usuario.login);
		}
	}

	async function onSubmitUser(values: z.infer<typeof formSchemaUsuario>) {
		startTransition(async () => {
			if (isUpdating && user?.id) {
				const resp = await usuario.atualizar(user?.id, {
					permissao: values.permissao as unknown as IPermissao,
					unidade_id: values.unidade_id,
				});

				if (resp.error) {
					toast.error('Algo deu errado', { description: resp.error });
				}

				if (resp.ok) {
					await update({
						...session,
						usuario: {
							...session?.usuario,
							permissao: IPermissao,
						},
					});

					toast.success('Usuário Atualizado', { description: resp.status });
				}
			} else {
				const { email, login, nome, permissao, unidade_id } = values;
				const resp = await usuario.criar({
					email,
					login,
					nome,
					permissao: permissao as unknown as IPermissao,
					unidade_id,
				});
				if (resp.error) {
					toast.error('Algo deu errado', { description: resp.error });
				}
				if (resp.ok) {
					toast.success('Usuário Criado', { description: resp.status });
				}
			}
		});
	}

	return (
		<>
			{!isUpdating && (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className=' flex items-end gap-2 w-full mb-5'>
						<FormField
							control={form.control}
							name='login'
							render={({ field }) => (
								<FormItem className='w-full'>
									<FormLabel>Login de rede</FormLabel>
									<FormControl>
										<Input
											placeholder='Login do usuário'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							disabled={form.formState.isLoading || !form.formState.isValid}
							type='submit'>
							{form.formState.isLoading || form.formState.isSubmitting ? (
								<>
									Buscar <Loader2 className='animate-spin' />
								</>
							) : (
								<>
									Buscar <ArrowRight />
								</>
							)}
						</Button>
					</form>
				</Form>
			)}

			<Form {...formUsuario}>
				<form
					onSubmit={formUsuario.handleSubmit(onSubmitUser)}
					className='space-y-4'>
					<FormField
						control={formUsuario.control}
						name='login'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Login de rede</FormLabel>
								<FormControl>
									<Input
										disabled
										placeholder='Login do usuário'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={formUsuario.control}
						name='nome'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nome</FormLabel>
								<FormControl>
									<Input
										disabled
										placeholder='Nome do usuário'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={formUsuario.control}
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormLabel>E-mail</FormLabel>
								<FormControl>
									<Input
										disabled
										type='email'
										placeholder='E-mail do usuário'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={formUsuario.control}
						name='permissao'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Permissão</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={'Defina a permissão'} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value='DEV'>Desenvolvedor</SelectItem>
										<SelectItem value='TEC'>Técnico</SelectItem>
										<SelectItem value='ADM'>Administrador</SelectItem>
										<SelectItem value='USR'>Usuário</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={formUsuario.control}
						name='unidade_id'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Unidade</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={loadingUnidades}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={loadingUnidades ? 'Carregando...' : 'Selecione a unidade'} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{unidades.map((unidade) => (
											<SelectItem
												key={unidade.id}
												value={unidade.id}>
												{unidade.nome} ({unidade.sigla})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className='flex gap-2 items-center justify-end'>
						<DialogClose asChild>
							<Button variant={'outline'}>Voltar</Button>
						</DialogClose>
						<Button
							disabled={isPending}
							type='submit'>
							{isUpdating ? (
								<>
									Atualizar {isPending && <Loader2 className='animate-spin' />}
								</>
							) : (
								<>
									Adicionar {isPending && <Loader2 className='animate-spin' />}
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}
