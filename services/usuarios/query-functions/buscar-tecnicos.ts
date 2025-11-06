/** @format */

import { IRespostaUsuario, IUsuarioTecnico } from '@/types/usuario';

export async function buscarTecnicos(
	access_token: string,
): Promise<IRespostaUsuario> {
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	console.log(baseURL);
	try {
		const usuarioNovo = await fetch(`${baseURL}usuarios/buscar-tecnicos`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${access_token}`,
			},
		});
		const data = await usuarioNovo.json();
		if (usuarioNovo.status === 200)
			return {
				ok: true,
				error: null,
				data: data as IUsuarioTecnico[],
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
			error: 'Não foi possível buscar o técnico:' + error,
			data: null,
			status: 400,
		};
	}
}
