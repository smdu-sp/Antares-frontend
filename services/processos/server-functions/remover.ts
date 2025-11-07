/** @format */

'use server';

import { redirect } from 'next/navigation';
import { IRespostaProcesso } from '@/types/processo';
import { auth } from '@/lib/auth/auth';
import { revalidateTag } from 'next/cache';

export async function remover(id: string): Promise<IRespostaProcesso> {
	const session = await auth();
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	if (!session) redirect('/login');

	const response: Response = await fetch(`${baseURL}processos/${id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session?.access_token}`,
		},
	});
	const dataResponse = await response.json();
	if (response.status === 200) {
		revalidateTag('processos');
		return {
			ok: true,
			error: null,
			data: { removido: true },
			status: 200,
		};
	}
	return {
		ok: false,
		error: dataResponse.message,
		data: null,
		status: dataResponse.statusCode,
	};
}

