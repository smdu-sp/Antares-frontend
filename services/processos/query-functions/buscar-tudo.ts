/** @format */

import { IPaginadoProcesso, IRespostaProcesso } from "@/types/processo";

export async function buscarTudo(
  access_token: string,
  pagina: number = 1,
  limite: number = 10,
  busca: string = "",
  vencendoHoje: boolean = false,
  atrasados: boolean = false
): Promise<IRespostaProcesso> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL;
  try {
    const params = new URLSearchParams({
      pagina: pagina.toString(),
      limite: limite.toString(),
      include: "unidadeInteressada,unidadeRemetente",
      ...(busca && { busca }),
      ...(vencendoHoje && { vencendoHoje: "true" }),
      ...(atrasados && { atrasados: "true" }),
    });

    const processos = await fetch(`${baseURL}processos?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      next: { tags: ["processos"], revalidate: 120 },
    });
    const data = await processos.json();
    if (processos.status === 200)
      return {
        ok: true,
        error: null,
        data: data as IPaginadoProcesso,
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
      error: "Não foi possível buscar a lista de processos: " + error,
      data: null,
      status: 400,
    };
  }
}
