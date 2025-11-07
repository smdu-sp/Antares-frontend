/** @format */

'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FiltroVencendoHoje() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	
	const vencendoHoje = searchParams.get('vencendoHoje') === 'true';

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
				'w-full md:w-auto',
				vencendoHoje && 'bg-orange-600 hover:bg-orange-700 text-white'
			)}>
			<AlertCircle className='h-4 w-4 mr-2' />
			Vencendo Hoje
		</Button>
	);
}

