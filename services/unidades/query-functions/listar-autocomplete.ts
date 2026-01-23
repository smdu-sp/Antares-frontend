/** @format */

import { IUnidade } from "@/types/unidade";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function listarAutocomplete(token: string, busca: string = "") {
  try {
    const query = busca ? `?busca=${encodeURIComponent(busca)}` : "";
    const resposta = await fetch(`${BACKEND}unidades/lista-completa${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 60,
        tags: ["unidades"],
      },
    });

    if (!resposta.ok) {
      const error = await resposta.json();
      return {
        ok: false,
        error: error.message || "Erro ao buscar unidades",
        data: null,
        status: resposta.status,
      };
    }

    const data: IUnidade[] = await resposta.json();

    return {
      ok: true,
      error: null,
      data,
      status: resposta.status,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Erro ao buscar unidades",
      data: null,
      status: 500,
    };
  }
}
