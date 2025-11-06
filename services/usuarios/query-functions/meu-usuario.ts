/** @format */

import { IRespostaUsuario, IUsuario } from "@/types/usuario";

export async function buscarMeuUsuario( access_token: string): Promise<IRespostaUsuario> {
  if (!access_token || access_token === '')
		return {
			ok: false,
			error: 'Não foi possível buscar o usuário, Token inválido.',
			data: null,
			status: 400,
		};
  const baseURL = process.env.NEXT_PUBLIC_API_URL;
  try {
    const usuarios = await fetch(`${baseURL}eu`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    });
    const data = await usuarios.json();
    if (usuarios.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IUsuario,
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
