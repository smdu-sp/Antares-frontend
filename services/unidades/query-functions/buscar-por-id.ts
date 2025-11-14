/** @format */

import { IRespostaUnidade, IUnidade } from '@/types/unidade';

export async function buscarPorId(
	access_token: string,
	id: string,
): Promise<IRespostaUnidade> {
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const unidade = await fetch(`${baseURL}unidades/${id}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${access_token}`,
			},
			next: { tags: ['unidade-by-id'], revalidate: 120 },
		});
		const data = await unidade.json();
		if (unidade.status === 200)
			return {
				ok: true,
				error: null,
				data: data as IUnidade,
				status: 200,
			};
		return {
			ok: false,
			error: data.message,
			data: null,
			status: data.statusCode,
		};
	} catch (error) {
		return {
			ok: false,
			error: 'Não foi possível buscar a unidade: ' + error,
			data: null,
			status: 400,
		};
	}
}

