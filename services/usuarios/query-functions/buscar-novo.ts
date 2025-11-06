/** @format */

import { INovoUsuario, IRespostaUsuario } from "@/types/usuario";

export async function buscarNovo(login: string, access_token: string): Promise<IRespostaUsuario> {
	if (!login || login === '')
		return {
			ok: false,
			error: 'Não foi possível buscar o usuário, login vazio.',
			data: null,
			status: 400,
		};

	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const usuarioNovo = await fetch(`${baseURL}usuarios/buscar-novo/${login}`, {
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
				data: data as INovoUsuario,
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
			error: 'Não foi possível buscar o usuário:' + error,
			data: null,
			status: 400,
		};
	}
}
