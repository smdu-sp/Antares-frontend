/** @format */

import { IProcesso, IRespostaProcesso } from "@/types/processo";

export async function buscarPorId(
  access_token: string,
  id: string
): Promise<IRespostaProcesso> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL;
  try {
    const processo = await fetch(
      `${baseURL}processos/${id}?include=unidadeInteressada,unidadeRemetente`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        next: { tags: ["processos"], revalidate: 120 },
      }
    );
    const data = await processo.json();
    if (processo.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IProcesso,
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
      error: "Não foi possível buscar o processo: " + error,
      data: null,
      status: 400,
    };
  }
}
