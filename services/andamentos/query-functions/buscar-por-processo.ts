/** @format */

import { IAndamento, IRespostaAndamento } from '@/types/processo';

export async function buscarPorProcesso(
	access_token: string,
	processo_id: string,
): Promise<IRespostaAndamento> {
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const andamentos = await fetch(
			`${baseURL}andamentos/processo/${processo_id}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${access_token}`,
				},
				next: { tags: ['andamentos'], revalidate: 120 },
			},
		);
		const data = await andamentos.json();
		if (andamentos.status === 200)
			return {
				ok: true,
				error: null,
				data: data as IAndamento[],
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
			error: 'Não foi possível buscar os andamentos: ' + error,
			data: null,
			status: 400,
		};
	}
}

