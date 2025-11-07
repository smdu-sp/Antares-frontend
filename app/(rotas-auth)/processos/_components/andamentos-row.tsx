/** @format */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { IAndamento } from '@/types/processo';
import * as andamento from '@/services/andamentos';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { StatusAndamento } from '@/types/processo';
import { Skeleton } from '@/components/ui/skeleton';
import ModalEditAndamento from './modal-edit-andamento';
import { cn } from '@/lib/utils';
import { calcularDiasRestantes, getStatusPrazo } from './utils';

export default function AndamentosRow({
	processoId,
	onRefresh,
}: {
	processoId: string;
	onRefresh?: (refreshFn: () => void) => void;
}) {
	const { data: session } = useSession();
	const [andamentos, setAndamentos] = useState<IAndamento[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshKey, setRefreshKey] = useState(0);

	const fetchAndamentos = useCallback(async () => {
		if (session?.access_token) {
			setLoading(true);
			const response = await andamento.query.buscarPorProcesso(
				session.access_token as string,
				processoId,
			);
			if (response.ok && response.data) {
				setAndamentos(response.data as IAndamento[]);
			}
			setLoading(false);
		}
	}, [session?.access_token, processoId]);

	useEffect(() => {
		if (session) {
			fetchAndamentos();
		}
	}, [session, fetchAndamentos, refreshKey]);

	// Cria função de refresh e expõe para o componente pai
	const refreshFn = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	const onRefreshRef = useRef(onRefresh);
	useEffect(() => {
		onRefreshRef.current = onRefresh;
	}, [onRefresh]);

	useEffect(() => {
		if (onRefreshRef.current) {
			// Usa requestAnimationFrame para evitar atualizar durante a renderização
			requestAnimationFrame(() => {
				onRefreshRef.current?.(refreshFn);
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Executa apenas uma vez na montagem, mas usa ref atualizado

	if (loading) {
		return (
			<div className='space-y-2'>
				<Skeleton className='h-12 w-full' />
				<Skeleton className='h-12 w-full' />
			</div>
		);
	}

	if (andamentos.length === 0) {
		return (
			<p className='text-muted-foreground text-sm'>
				Nenhum andamento cadastrado para este processo.
			</p>
		);
	}

	return (
		<div className='space-y-2'>
			{andamentos.map((and) => {
				// Calcula dias restantes usando a prorrogação se existir, senão usa o prazo original
				const diasRestantes = calcularDiasRestantes(
					new Date(and.prazo),
					and.prorrogacao,
				);
				const statusPrazo = getStatusPrazo(diasRestantes, and.status);
				const Icone = statusPrazo.icone;

				return (
					<div
						key={and.id}
						className='border rounded-lg p-4 space-y-3 bg-background'>
						<div className='flex justify-between items-start gap-4'>
							<div className='flex-1 space-y-2'>
								<div className='flex gap-2 items-center flex-wrap'>
									<Badge
										variant={
											and.status === StatusAndamento.CONCLUIDO
												? 'default'
												: and.status === StatusAndamento.PRORROGADO
													? 'secondary'
													: 'outline'
										}>
										{and.status === StatusAndamento.EM_ANDAMENTO
											? 'Em Andamento'
											: and.status === StatusAndamento.CONCLUIDO
												? 'Concluído'
												: 'Prorrogado'}
									</Badge>
									{/* Indicador de dias restantes - só mostra se não estiver concluído */}
									{and.status !== StatusAndamento.CONCLUIDO && (
										<div
											className={cn(
												'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
												statusPrazo.bg,
												statusPrazo.cor,
											)}>
											<Icone className='h-3 w-3' />
											<span>{statusPrazo.texto}</span>
										</div>
									)}
								</div>

								{/* Linha informando conclusão ou prorrogação */}
								{and.conclusao && (
									<div className='bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-2 rounded-md text-sm font-medium'>
										✓ <strong>CONCLUÍDO</strong> em{' '}
										{new Date(and.conclusao).toLocaleDateString('pt-BR', {
											day: '2-digit',
											month: '2-digit',
											year: 'numeric',
										})}
									</div>
								)}
								{and.prorrogacao && !and.conclusao && (
									<div className='bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-2 rounded-md text-sm font-medium'>
										⏱️ <strong>PRORROGADO</strong> - Nova data limite:{' '}
										{new Date(and.prorrogacao).toLocaleDateString('pt-BR', {
											day: '2-digit',
											month: '2-digit',
											year: 'numeric',
										})}
									</div>
								)}

								<div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm'>
									<div>
										<p>
											<strong>Origem:</strong> {and.origem}
										</p>
										<p>
											<strong>Destino:</strong> {and.destino}
										</p>
									</div>
									<div>
										<p>
											<strong>Prazo Original:</strong>{' '}
											{new Date(and.prazo).toLocaleDateString('pt-BR', {
												day: '2-digit',
												month: '2-digit',
												year: 'numeric',
											})}
										</p>
										{and.prorrogacao && (
											<p className='text-orange-600 dark:text-orange-400'>
												<strong>Prazo Prorrogado:</strong>{' '}
												{new Date(and.prorrogacao).toLocaleDateString('pt-BR', {
													day: '2-digit',
													month: '2-digit',
													year: 'numeric',
												})}
											</p>
										)}
									</div>
								</div>

								{and.observacao && (
									<div className='text-sm text-muted-foreground bg-muted/50 p-2 rounded'>
										<strong>Observação:</strong> {and.observacao}
									</div>
								)}
							</div>
							<div className='flex flex-col gap-2'>
								<ModalEditAndamento
									andamento={and}
									onSuccess={refreshFn}
								/>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
