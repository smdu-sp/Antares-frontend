/** @format */

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { IAndamento } from '@/types/processo';
import * as andamento from '@/services/andamentos';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { StatusAndamento } from '@/types/processo';
import { Skeleton } from '@/components/ui/skeleton';
import ModalEditAndamento from './modal-edit-andamento';
import ModalDeleteAndamento from './modal-delete-andamento';
import ModalAdicionarObservacao from './modal-adicionar-observacao';
import ModalEditObservacao from './modal-edit-observacao';
import { cn } from '@/lib/utils';
import { calcularDiasRestantes, getStatusPrazo } from './utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
	CheckCircle2, 
	Clock, 
	AlertCircle, 
	ArrowRight, 
	Calendar,
	FileText,
	User
} from 'lucide-react';

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

	// Ordena andamentos por data de criação (mais recente primeiro)
	const andamentosOrdenados = useMemo(() => {
		return [...andamentos].sort((a, b) => 
			new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
		);
	}, [andamentos]);

	// Função auxiliar para parsear observação
	const parsearObservacao = (obs: string) => {
		const obsTrimmed = obs.trim();
		if (!obsTrimmed) return null;
		
		// Procura pelo padrão [data] autor: no início
		// Primeiro tenta encontrar o padrão completo
		const match = obsTrimmed.match(/^\[([^\]]+)\]\s+([^:]+):\s*(.*)$/s);
		if (match && match.length >= 4) {
			const dataHora = match[1]?.trim();
			const autor = match[2]?.trim();
			const texto = match[3]?.trim() || '';
			
			if (dataHora && autor) {
				return {
					dataHora,
					autor,
					texto,
				};
			}
		}
		
		// Se não encontrou, tenta uma abordagem alternativa: dividir por primeira quebra de linha
		const primeiraLinha = obsTrimmed.split('\n')[0];
		const matchLinha = primeiraLinha.match(/^\[([^\]]+)\]\s+([^:]+):/);
		if (matchLinha && matchLinha.length >= 3) {
			const dataHora = matchLinha[1]?.trim();
			const autor = matchLinha[2]?.trim();
			const texto = obsTrimmed.substring(primeiraLinha.length + 1).trim();
			
			if (dataHora && autor) {
				return {
					dataHora,
					autor,
					texto,
				};
			}
		}
		
		return null;
	};

	if (loading) {
		return (
			<div className='space-y-4'>
				<Skeleton className='h-24 w-full' />
				<Skeleton className='h-32 w-full' />
				<Skeleton className='h-32 w-full' />
			</div>
		);
	}

	if (andamentos.length === 0) {
		return (
			<Card>
				<CardContent className='pt-6'>
					<div className='text-center text-muted-foreground py-8'>
						<FileText className='h-12 w-12 mx-auto mb-3 opacity-50' />
						<p className='text-sm'>Nenhum andamento cadastrado para este processo.</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Timeline de Andamentos */}
			<div className='space-y-4'>
				<h4 className='text-sm font-semibold text-foreground flex items-center gap-2'>
					<Clock className='h-4 w-4' />
					Linha do Tempo
				</h4>
				
				<div className='relative'>
					{/* Linha vertical da timeline */}
					<div className='absolute left-6 top-0 bottom-0 w-0.5 bg-border' />
					
					<div className='space-y-6'>
						{andamentosOrdenados.map((and, index) => {
							const diasRestantes = calcularDiasRestantes(
								new Date(and.prazo),
								and.prorrogacao,
							);
							const statusPrazo = getStatusPrazo(diasRestantes, and.status);
							const Icone = statusPrazo.icone;

							// Define ícone e cor baseado no status
							let StatusIcon = Clock;
							let statusColor = 'text-blue-500';
							let statusBg = 'bg-blue-100 dark:bg-blue-900/30';
							
							if (and.status === StatusAndamento.CONCLUIDO) {
								StatusIcon = CheckCircle2;
								statusColor = 'text-green-500';
								statusBg = 'bg-green-100 dark:bg-green-900/30';
							} else if (and.status === StatusAndamento.PRORROGADO) {
								StatusIcon = AlertCircle;
								statusColor = 'text-orange-500';
								statusBg = 'bg-orange-100 dark:bg-orange-900/30';
							} else if (diasRestantes < 0) {
								StatusIcon = AlertCircle;
								statusColor = 'text-red-500';
								statusBg = 'bg-red-100 dark:bg-red-900/30';
							}

							return (
								<div key={and.id} className='relative flex gap-4'>
									{/* Ponto da timeline */}
									<div className={cn(
										'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 border-background',
										statusBg
									)}>
										<StatusIcon className={cn('h-5 w-5', statusColor)} />
									</div>

									{/* Conteúdo do andamento */}
									<div className='flex-1 pb-6'>
										<Card className={cn(
											'border-l-4',
											and.status === StatusAndamento.CONCLUIDO 
												? 'border-l-green-500'
												: and.status === StatusAndamento.PRORROGADO
													? 'border-l-orange-500'
													: diasRestantes < 0
														? 'border-l-red-500'
														: diasRestantes <= 3
															? 'border-l-orange-500'
															: 'border-l-blue-500'
										)}>
											<CardContent className='pt-4'>
												<div className='flex justify-between items-start gap-4'>
													<div className='flex-1 space-y-3'>
														{/* Cabeçalho com status e data */}
														<div className='flex flex-wrap items-center gap-2'>
															<Badge
																variant={
																	and.status === StatusAndamento.CONCLUIDO
																		? 'default'
																		: and.status === StatusAndamento.PRORROGADO
																			? 'secondary'
																			: 'outline'
																}
																className='text-xs'
															>
																{and.status === StatusAndamento.EM_ANDAMENTO
																	? 'Em Andamento'
																	: and.status === StatusAndamento.CONCLUIDO
																		? 'Concluído'
																		: 'Prorrogado'}
															</Badge>
															
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

															<div className='flex items-center gap-3 text-xs text-muted-foreground ml-auto'>
																{and.usuario && (
																	<div className='flex items-center gap-1'>
																		<User className='h-3 w-3' />
																		<span className='font-medium text-foreground'>
																			{and.usuario.nomeSocial || and.usuario.nome}
																		</span>
																	</div>
																)}
																<div className='flex items-center gap-1'>
																	<Calendar className='h-3 w-3' />
																	{new Date(and.criadoEm).toLocaleDateString('pt-BR', {
																		day: '2-digit',
																		month: '2-digit',
																		year: 'numeric',
																		hour: '2-digit',
																		minute: '2-digit',
																	})}
																</div>
															</div>
														</div>

													{/* Alerta de conclusão ou prorrogação */}
													{and.conclusao && (
														<div className='bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2'>
															<CheckCircle2 className='h-4 w-4' />
															<span>
																<strong>CONCLUÍDO</strong> em{' '}
																{new Date(and.conclusao).toLocaleDateString('pt-BR', {
																	day: '2-digit',
																	month: '2-digit',
																	year: 'numeric',
																})}
															</span>
														</div>
													)}
													{and.prorrogacao && !and.conclusao && (
														<div className='bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2'>
															<AlertCircle className='h-4 w-4' />
															<span>
																<strong>PRORROGADO</strong> - Nova data limite:{' '}
																{new Date(and.prorrogacao).toLocaleDateString('pt-BR', {
																	day: '2-digit',
																	month: '2-digit',
																	year: 'numeric',
																})}
																{and.usuarioProrrogacao && (
																	<> por <strong>{and.usuarioProrrogacao.nomeSocial || and.usuarioProrrogacao.nome}</strong></>
																)}
															</span>
														</div>
													)}

													<Separator />

													{/* Informações do andamento */}
													<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
														<div className='space-y-2'>
															<div className='flex items-start gap-2'>
																<span className='text-muted-foreground min-w-[60px]'>Origem:</span>
																<span className='font-medium'>{and.origem}</span>
															</div>
															<div className='flex items-center gap-2'>
																<ArrowRight className='h-4 w-4 text-muted-foreground ml-[60px]' />
															</div>
															<div className='flex items-start gap-2'>
																<span className='text-muted-foreground min-w-[60px]'>Destino:</span>
																<span className='font-medium'>{and.destino}</span>
															</div>
														</div>
														<div className='space-y-2'>
															<div className='flex items-start gap-2'>
																<span className='text-muted-foreground min-w-[100px]'>Prazo Original:</span>
																<span className='font-medium'>
																	{new Date(and.prazo).toLocaleDateString('pt-BR', {
																		day: '2-digit',
																		month: '2-digit',
																		year: 'numeric',
																	})}
																</span>
															</div>
															{and.prorrogacao && (
																<>
																	<div className='flex items-start gap-2'>
																		<span className='text-muted-foreground min-w-[100px]'>Prazo Prorrogado:</span>
																		<span className='font-medium text-orange-600 dark:text-orange-400'>
																			{new Date(and.prorrogacao).toLocaleDateString('pt-BR', {
																				day: '2-digit',
																				month: '2-digit',
																				year: 'numeric',
																			})}
																		</span>
																	</div>
																	{and.usuarioProrrogacao && (
																		<div className='flex items-start gap-2'>
																			<span className='text-muted-foreground min-w-[100px]'>Prorrogado por:</span>
																			<span className='font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1'>
																				<User className='h-3 w-3' />
																				{and.usuarioProrrogacao.nomeSocial || and.usuarioProrrogacao.nome}
																			</span>
																		</div>
																	)}
																</>
															)}
														</div>
													</div>

													{/* Observações */}
													{and.observacao && (
														<>
															<Separator />
															<div className='text-sm space-y-3'>
																<div className='flex items-center gap-2'>
																	<FileText className='h-4 w-4 text-muted-foreground' />
																	<span className='text-muted-foreground font-medium'>Observações:</span>
																</div>
																<div className='space-y-3'>
																	{and.observacao
																		.split(/\n\s*---\s*\n/)
																		.filter(obs => obs.trim().length > 0)
																		.reverse()
																		.map((obs, idx) => {
																		const parsed = parsearObservacao(obs);
																		// Calcula o índice original (antes do reverse)
																		const totalObservacoes = and.observacao.split(/\n\s*---\s*\n/).filter(o => o.trim().length > 0).length;
																		const indiceOriginal = totalObservacoes - 1 - idx;
																		
																		if (parsed) {
																			return (
																				<div key={idx} className='bg-muted/50 p-3 rounded-md space-y-2 border-l-2 border-l-blue-500'>
																					<div className='flex items-center justify-between'>
																						<div className='flex items-center gap-2 text-xs text-muted-foreground'>
																							<User className='h-3 w-3' />
																							<span className='font-medium text-foreground'>{parsed.autor}</span>
																							<span>•</span>
																							<Calendar className='h-3 w-3' />
																							<span>{parsed.dataHora}</span>
																						</div>
																						<ModalEditObservacao
																							processoId={processoId}
																							andamentoId={and.id}
																							observacaoOriginal={obs}
																							indiceObservacao={indiceOriginal}
																							onSuccess={refreshFn}
																						/>
																					</div>
																					{parsed.texto && (
																						<div className='text-foreground whitespace-pre-wrap pl-5'>
																							{parsed.texto}
																						</div>
																					)}
																				</div>
																			);
																		}
																		// Fallback para formato antigo (sem formatação)
																		return (
																			<div key={idx} className='bg-muted/50 p-3 rounded-md border-l-2 border-l-blue-500'>
																				<div className='flex items-center justify-between'>
																					<div className='text-foreground whitespace-pre-wrap'>{obs.trim()}</div>
																					<ModalEditObservacao
																						processoId={processoId}
																						andamentoId={and.id}
																						observacaoOriginal={obs}
																						indiceObservacao={indiceOriginal}
																						onSuccess={refreshFn}
																					/>
																				</div>
																			</div>
																		);
																	})}
																</div>
															</div>
														</>
													)}
												</div>

												{/* Botões de ação */}
												<div className='flex-shrink-0 flex gap-2'>
													<ModalAdicionarObservacao
														processoId={processoId}
														onSuccess={refreshFn}
													/>
													<ModalEditAndamento
														andamento={and}
														onSuccess={refreshFn}
													/>
													{/* Botão de excluir - apenas para DEV, ADM e TEC */}
													{session?.usuario?.permissao &&
														(['DEV', 'ADM', 'TEC'].includes(session.usuario.permissao.toString())) && (
															<ModalDeleteAndamento
																andamento={and}
																onSuccess={refreshFn}
															/>
														)}
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
