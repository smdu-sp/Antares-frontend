/** @format */

'use server';

import { redirect } from 'next/navigation';
import { ICreateAndamento, IRespostaAndamento, IAndamento } from '@/types/processo';
import { auth } from '@/lib/auth/auth';
import { revalidateTag } from 'next/cache';

export async function criar(data: ICreateAndamento): Promise<IRespostaAndamento> {
	const session = await auth();
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	if (!session) redirect('/login');

	const response: Response = await fetch(`${baseURL}andamentos`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session?.access_token}`,
		},
		body: JSON.stringify(data),
	});
	const dataResponse = await response.json();
	if (response.status === 201) {
		revalidateTag('andamentos');
		revalidateTag('processos');
		return {
			ok: true,
			error: null,
			data: dataResponse as IAndamento,
			status: 201,
		};
	}
	if (!dataResponse)
		return {
			ok: false,
			error: 'Erro ao criar novo andamento.',
			data: null,
			status: 500,
		};
	return {
		ok: false,
		error: dataResponse.message,
		data: null,
		status: dataResponse.statusCode,
	};
}

