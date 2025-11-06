/** @format */

import { IRespostaUsuario, IUsuario } from "@/types/usuario";

export async function listaCompleta(access_token: string): Promise<IRespostaUsuario> {
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const alvaraTipos = await fetch(`${baseURL}usuarios/lista-completa`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${access_token}`,
			},
		});
		const data = await alvaraTipos.json();
		return {
			ok: true,
			error: null,
			data: data as IUsuario[],
			status: 200,
		};
	} catch (error) {
		console.log(error);
		return {
			ok: false,
			error: 'Não foi possível buscar a lista de usuários:' + error,
			data: null,
			status: 500,
		};
	}
}
