/** @format */

'use server';

import { auth } from '@/lib/auth/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { IRespostaUsuario, IUpdateUsuario, IUsuario } from '@/types/usuario';

export async function atualizar(
	id: string,
	data: IUpdateUsuario,
): Promise<IRespostaUsuario> {
	const session = await auth();
	if (!session) redirect('/login');
	const baseURL = process.env.NEXT_PUBLIC_API_URL;

	try {
		const response: Response = await fetch(
			`${baseURL}usuarios/atualizar/${id}`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session?.access_token}`,
				},
				body: JSON.stringify(data),
			},
		);
		const dataResponse = await response.json();

		if (response.status === 200) {
			revalidateTag('users');
			revalidateTag('user-by-id');
			revalidatePath('/');
			return {
				ok: true,
				error: null,
				data: dataResponse as IUsuario,
				status: 200,
			};
		}
		if (!dataResponse) {
			return {
				ok: false,
				error: 'Erro ao atualizar usuário.',
				data: null,
				status: 500,
			};
		}
	} catch (error) {
		console.log(error);
		return {
			ok: false,
			error: 'Erro ao atualizar usuário.',
			data: null,
			status: 500,
		};
	}

	// Default return statement to handle unexpected cases
	return {
		ok: false,
		error: 'Erro inesperado',
		data: null,
		status: 500,
	};
}
