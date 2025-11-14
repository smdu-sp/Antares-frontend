/** @format */

import { IPaginadoUnidade, IRespostaUnidade } from '@/types/unidade';

export async function buscarTudo(
	access_token: string,
	pagina: number = 1,
	limite: number = 10,
	busca: string = '',
): Promise<IRespostaUnidade> {
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const unidades = await fetch(
			`${baseURL}unidades?pagina=${pagina}&limite=${limite}&busca=${busca}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${access_token}`,
				},
				next: { tags: ['unidades'], revalidate: 120 },
			},
		);
		const data = await unidades.json();
		if (unidades.status === 200)
			return {
				ok: true,
				error: null,
				data: data as IPaginadoUnidade,
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
			error: 'Não foi possível buscar a lista de unidades: ' + error,
			data: null,
			status: 400,
		};
	}
}

