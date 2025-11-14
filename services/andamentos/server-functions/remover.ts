/** @format */

'use server';

import { auth } from '@/lib/auth/auth';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export async function remover(id: string): Promise<{
	ok: boolean;
	error: string | null;
	data: { removido: boolean } | null;
	status: number;
}> {
	const session = await auth();

	if (!session?.access_token) {
		redirect('/login');
	}

	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}andamentos/${id}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					'Content-Type': 'application/json',
				},
			},
		);

		const data = await response.json();

		if (!response.ok) {
			return {
				ok: false,
				error: data.message || 'Erro ao remover andamento',
				data: null,
				status: response.status,
			};
		}

		revalidateTag('andamentos');
		revalidateTag('processos');

		return {
			ok: true,
			error: null,
			data: data as { removido: boolean },
			status: response.status,
		};
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : 'Erro desconhecido',
			data: null,
			status: 500,
		};
	}
}




