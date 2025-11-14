/** @format */

'use client';

import { ILog, TipoAcao } from '@/types/log';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LogsTable({ logs }: { logs: ILog[] }) {
	const getTipoAcaoLabel = (tipo: TipoAcao): string => {
		const labels: Record<TipoAcao, string> = {
			[TipoAcao.PROCESSO_CRIADO]: 'Processo Criado',
			[TipoAcao.PROCESSO_ATUALIZADO]: 'Processo Atualizado',
			[TipoAcao.PROCESSO_REMOVIDO]: 'Processo Removido',
			[TipoAcao.ANDAMENTO_CRIADO]: 'Andamento Criado',
			[TipoAcao.ANDAMENTO_ATUALIZADO]: 'Andamento Atualizado',
			[TipoAcao.ANDAMENTO_PRORROGADO]: 'Andamento Prorrogado',
			[TipoAcao.ANDAMENTO_CONCLUIDO]: 'Andamento Concluído',
			[TipoAcao.ANDAMENTO_REMOVIDO]: 'Andamento Removido',
		};
		return labels[tipo] || tipo;
	};

	const getTipoAcaoVariant = (tipo: TipoAcao): 'default' | 'secondary' | 'destructive' | 'outline' => {
		if (tipo === TipoAcao.PROCESSO_REMOVIDO || tipo === TipoAcao.ANDAMENTO_REMOVIDO) {
			return 'destructive';
		}
		if (
			tipo === TipoAcao.PROCESSO_CRIADO ||
			tipo === TipoAcao.ANDAMENTO_CRIADO ||
			tipo === TipoAcao.ANDAMENTO_CONCLUIDO
		) {
			return 'default';
		}
		return 'secondary';
	};

	return (
		<div className='rounded-md'>
			<Table className='bg-background dark:bg-muted/50 border'>
				<TableHeader className='bg-primary hover:bg-primary'>
					<TableRow className='hover:bg-primary'>
						<TableHead className='text-white text-xs text-nowrap'>
							Data/Hora
						</TableHead>
						<TableHead className='text-white text-xs text-nowrap'>
							Tipo de Ação
						</TableHead>
						<TableHead className='text-white text-xs text-nowrap'>
							Descrição
						</TableHead>
						<TableHead className='text-white text-xs text-nowrap'>
							Entidade
						</TableHead>
						<TableHead className='text-white text-xs text-nowrap'>
							Usuário
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{logs.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={5}
								className='text-center text-muted-foreground'>
								Nenhum log encontrado
							</TableCell>
						</TableRow>
					) : (
						logs.map((log) => (
							<TableRow key={log.id}>
								<TableCell className='text-sm'>
									{format(new Date(log.criadoEm), "dd/MM/yyyy 'às' HH:mm:ss", {
										locale: ptBR,
									})}
								</TableCell>
								<TableCell>
									<Badge variant={getTipoAcaoVariant(log.tipoAcao)}>
										{getTipoAcaoLabel(log.tipoAcao)}
									</Badge>
								</TableCell>
								<TableCell className='text-sm max-w-md truncate'>
									{log.descricao}
								</TableCell>
								<TableCell className='text-sm'>
									<div className='flex flex-col'>
										<span className='font-medium'>{log.entidadeTipo}</span>
										<span className='text-xs text-muted-foreground'>
											{log.entidadeId.substring(0, 8)}...
										</span>
									</div>
								</TableCell>
								<TableCell className='text-sm'>
									{log.usuario ? (
										<div className='flex flex-col'>
											<span className='font-medium'>
												{log.usuario.nomeSocial || log.usuario.nome}
											</span>
											<span className='text-xs text-muted-foreground'>
												{log.usuario.email}
											</span>
										</div>
									) : (
										<span className='text-muted-foreground'>-</span>
									)}
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}

