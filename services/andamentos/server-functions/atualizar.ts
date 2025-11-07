/** @format */

'use server';

import { redirect } from 'next/navigation';
import { IUpdateAndamento, IRespostaAndamento, IAndamento } from '@/types/processo';
import { auth } from '@/lib/auth/auth';
import { revalidateTag } from 'next/cache';

export async function atualizar(
	id: string,
	data: IUpdateAndamento,
): Promise<IRespostaAndamento> {
	const session = await auth();
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	if (!session) redirect('/login');

	const response: Response = await fetch(`${baseURL}andamentos/${id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session?.access_token}`,
		},
		body: JSON.stringify(data),
	});
	const dataResponse = await response.json();
	if (response.status === 200) {
		revalidateTag('andamentos');
		revalidateTag('processos');
		return {
			ok: true,
			error: null,
			data: dataResponse as IAndamento,
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

