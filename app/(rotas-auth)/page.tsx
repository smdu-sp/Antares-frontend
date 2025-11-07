/** @format */

import { Filtros } from '@/components/filtros';
import Pagination from '@/components/pagination';
import { auth } from '@/lib/auth/auth';
import * as processo from '@/services/processos';
import { IPaginadoProcesso, IProcesso } from '@/types/processo';
import { Suspense } from 'react';
import ProcessosTable from './processos/_components/processos-table';
import ModalProcesso from './processos/_components/modal-processo';
import { TableSkeleton } from '@/components/data-table';
import FiltroVencendoHoje from './processos/_components/filtro-vencendo-hoje';
import FiltroAtrasados from './processos/_components/filtro-atrasados';

export default async function HomeSuspense({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	return (
		<Suspense fallback={<TableSkeleton />}>
			<Home searchParams={searchParams} />
		</Suspense>
	);
}

async function Home({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	let { pagina = 1, limite = 10, total = 0 } = await searchParams;
	let ok = false;
	const { busca = '', vencendoHoje = '', atrasados = '' } = await searchParams;
	let dados: IProcesso[] = [];

	const session = await auth();
	if (session && session.access_token) {
		const response = await processo.query.buscarTudo(
			session.access_token || '',
			+pagina,
			+limite,
			busca as string,
			vencendoHoje === 'true',
			atrasados === 'true',
		);
		const { data } = response;
		ok = response.ok;
		if (ok) {
			if (data) {
				const paginado = data as IPaginadoProcesso;
				pagina = paginado.pagina || 1;
				limite = paginado.limite || 10;
				total = paginado.total || 0;
				dados = paginado.data || [];
			}
		}
	}

	return (
		<div className=' w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto'>
			<h1 className='text-xl md:text-4xl font-bold'>Processos</h1>
			<div className='flex flex-col max-w-sm mx-auto md:max-w-full gap-3 my-5   w-full '>
				<div className='flex flex-col md:flex-row gap-3 items-start md:items-end'>
					<Filtros
						camposFiltraveis={[
							{
								nome: 'Busca',
								tag: 'busca',
								tipo: 0,
								placeholder: 'Digite o número SEI ou assunto',
							},
						]}
					/>
					<div className='flex gap-2'>
						<FiltroVencendoHoje />
						<FiltroAtrasados />
					</div>
				</div>
				<ProcessosTable processos={dados || []} />

				{dados && dados.length > 0 && (
					<Pagination
						total={+total}
						pagina={+pagina}
						limite={+limite}
					/>
				)}
			</div>
			<div className='absolute bottom-10 md:bottom-5 right-2 md:right-8 hover:scale-110'>
				<ModalProcesso isUpdating={false} />
			</div>
		</div>
	);
}
