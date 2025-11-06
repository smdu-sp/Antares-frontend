/** @format */

'use server';

import { auth } from '@/lib/auth/auth';
import { IRespostaUsuario } from '@/types/usuario';
import { revalidateTag } from 'next/cache';

import { redirect } from 'next/navigation';

export async function autorizar(id: string): Promise<IRespostaUsuario> {
	const session = await auth();
	if (!session) redirect('/login');
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	const autorizado = await fetch(`${baseURL}usuarios/autorizar/${id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session?.access_token}`,
		},
	});
	const dataResponse = await autorizado.json();
	if (autorizado.status === 200) {
		revalidateTag('users');
		return {
			ok: true,
			error: null,
			data: dataResponse as { autorizado: boolean },
			status: 200,
		};
	}
	if (!dataResponse)
		return {
			ok: false,
			error: 'Erro ao autorizar usuário.',
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
