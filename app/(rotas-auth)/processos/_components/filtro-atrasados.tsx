/** @format */

'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FiltroAtrasados() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	
	const atrasados = searchParams.get('atrasados') === 'true';

	const toggleFiltro = () => {
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());
			
			if (atrasados) {
				params.delete('atrasados');
			} else {
				params.set('atrasados', 'true');
				// Reseta para primeira página ao aplicar filtro
				params.set('pagina', '1');
			}
			
			router.push(`${pathname}?${params.toString()}`);
		});
	};

	return (
		<Button
			variant={atrasados ? 'default' : 'outline'}
			onClick={toggleFiltro}
			disabled={isPending}
			className={cn(
				'w-full md:w-auto',
				atrasados && 'bg-red-600 hover:bg-red-700 text-white'
			)}>
			<AlertTriangle className='h-4 w-4 mr-2' />
			Atrasados
		</Button>
	);
}

