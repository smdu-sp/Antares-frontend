/** @format */

import { auth } from "@/lib/auth/auth";
import { IRespostaUsuario, IUsuario } from "@/types/usuario";
import { redirect } from "next/navigation";

export async function validaUsuario(): Promise<IRespostaUsuario> {
	const session = await auth();
	if (!session) redirect('/login');
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const usuario = await fetch(`${baseURL}usuarios/valida-usuario`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session.access_token}`,
			},
		});
		const data = await usuario.json();
		return {
			ok: true,
			error: null,
			data: data as IUsuario,
			status: 200,
		};
	} catch (error) {
		console.log(error);
		return {
			ok: false,
			error: 'Não foi possível validar o usuário:' + error,
			data: null,
			status: 500,
		};
	}
}
