/** @format */

'use client';

import { IProcesso } from '@/types/processo';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import AndamentosRow from './andamentos-row';
import ModalAndamento from './modal-andamento';
import { TableRow, TableCell } from '@/components/ui/table';
import ModalProcesso from './modal-processo';
import ModalDeleteProcesso from './modal-delete-processo';
import { getUltimoAndamento, calcularDiasRestantes, getStatusPrazo } from './utils';
import { cn } from '@/lib/utils';

export default function ProcessoRow({ processo }: { processo: IProcesso }) {
	const [isExpanded, setIsExpanded] = useState(false);
	const refreshAndamentosRef = useRef<(() => void) | null>(null);
	
	const ultimoAndamento = getUltimoAndamento(processo.andamentos);
	const diasRestantes = ultimoAndamento
		? calcularDiasRestantes(
				new Date(ultimoAndamento.prazo),
				ultimoAndamento.prorrogacao,
			)
		: null;
	const statusPrazo = ultimoAndamento && diasRestantes !== null
		? getStatusPrazo(diasRestantes, ultimoAndamento.status)
		: null;
	const Icone = statusPrazo?.icone;

	return (
		<>
			<TableRow>
				<TableCell className='w-12'>
					<Button
						variant='ghost'
						size='icon'
						className='h-8 w-8'
						onClick={() => setIsExpanded(!isExpanded)}>
						{isExpanded ? (
							<ChevronDown className='h-4 w-4' />
						) : (
							<ChevronRight className='h-4 w-4' />
						)}
					</Button>
				</TableCell>
				<TableCell>{processo.numero_sei}</TableCell>
				<TableCell>{processo.assunto}</TableCell>
				<TableCell>
					{ultimoAndamento ? (
						<div className='space-y-1'>
							<div>
								{new Date(ultimoAndamento.prazo).toLocaleDateString('pt-BR', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
								})}
							</div>
							{ultimoAndamento.prorrogacao && (
								<div className='text-xs text-muted-foreground'>
									Prorrogação:{' '}
									{new Date(ultimoAndamento.prorrogacao).toLocaleDateString('pt-BR', {
										day: '2-digit',
										month: '2-digit',
										year: 'numeric',
									})}
								</div>
							)}
						</div>
					) : (
						<span className='text-muted-foreground text-sm'>Sem andamento</span>
					)}
				</TableCell>
				<TableCell>
					{ultimoAndamento && statusPrazo && diasRestantes !== null ? (
						<div
							className={cn(
								'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit',
								statusPrazo.bg,
								statusPrazo.cor,
							)}>
							<Icone className='h-3 w-3' />
							<span>{statusPrazo.texto}</span>
						</div>
					) : (
						<span className='text-muted-foreground text-sm'>-</span>
					)}
				</TableCell>
				<TableCell>
					<div className='flex gap-2 items-center justify-center'>
						<ModalProcesso
							processo={processo}
							isUpdating={true}
						/>
						<ModalDeleteProcesso id={processo.id} />
					</div>
				</TableCell>
			</TableRow>
			{isExpanded && (
				<TableRow>
					<TableCell colSpan={6} className='bg-muted/50'>
						<div className='p-4 space-y-4'>
							<div className='flex justify-between items-center'>
								<h3 className='font-semibold'>Andamentos</h3>
								<ModalAndamento
									processoId={processo.id}
									onSuccess={() => {
										refreshAndamentosRef.current?.();
									}}
								/>
							</div>
							<AndamentosRow
								processoId={processo.id}
								onRefresh={(fn) => {
									refreshAndamentosRef.current = fn;
								}}
							/>
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}

