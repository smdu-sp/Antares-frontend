/** @format */

'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { contarVencendoHoje } from '@/services/processos/query-functions';

export default function FiltroVencendoHoje() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const { data: session } = useSession();
	const [contagem, setContagem] = useState<number>(0);
	
	const vencendoHoje = searchParams.get('vencendoHoje') === 'true';

	useEffect(() => {
		async function carregarContagem() {
			if (!session?.access_token) {
				return;
			}

			try {
				const response = await contarVencendoHoje(session.access_token);
				
				if (response.ok && response.data !== null && response.data !== undefined) {
					const count = Number(response.data);
					if (!isNaN(count)) {
						setContagem(count);
					}
				}
			} catch (error) {
				console.error('Erro ao carregar contagem:', error);
			}
		}

		carregarContagem();
		
		// Atualiza a cada 60 segundos
		const interval = setInterval(carregarContagem, 60000);
		return () => clearInterval(interval);
	}, [session?.access_token]);

	const toggleFiltro = () => {
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());
			
			if (vencendoHoje) {
				params.delete('vencendoHoje');
			} else {
				params.set('vencendoHoje', 'true');
				// Reseta para primeira página ao aplicar filtro
				params.set('pagina', '1');
			}
			
			router.push(`${pathname}?${params.toString()}`);
		});
	};

	return (
		<Button
			variant={vencendoHoje ? 'default' : 'outline'}
			onClick={toggleFiltro}
			disabled={isPending}
			className={cn(
				'w-full md:w-auto relative',
				vencendoHoje && 'bg-orange-600 hover:bg-orange-700 text-white'
			)}>
			<AlertCircle className='h-4 w-4 mr-2' />
			Vencendo Hoje
			{contagem > 0 && (
				<span className='ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded'>
					{contagem > 99 ? '99+' : contagem}
				</span>
			)}
		</Button>
	);
}