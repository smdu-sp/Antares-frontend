/** @format */

'use client';

import { IProcesso } from '@/types/processo';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import ProcessoRow from './processo-row';

export default function ProcessosTable({ processos }: { processos: IProcesso[] }) {
	return (
		<div className='rounded-md'>
			<Table className='bg-background dark:bg-muted/50 border'>
				<TableHeader className='bg-primary hover:bg-primary'>
					<TableRow className='hover:bg-primary'>
						<TableHead className='text-white text-xs text-nowrap w-12'></TableHead>
						<TableHead className='text-white text-xs text-nowrap'>
							Número SEI
						</TableHead>
						<TableHead className='text-white text-xs text-nowrap'>
							Assunto
						</TableHead>
						<TableHead className='text-white text-xs text-nowrap'>
							Prazo de Retorno
						</TableHead>
						<TableHead className='text-white text-xs text-nowrap'>
							Dias Restantes
						</TableHead>
						<TableHead className='text-white text-xs text-nowrap text-center'>
							Ações
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{processos.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={6}
								className='text-center text-muted-foreground'>
								Nenhum processo encontrado
							</TableCell>
						</TableRow>
					) : (
						processos.map((processo) => (
							<ProcessoRow
								key={processo.id}
								processo={processo}
							/>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}

