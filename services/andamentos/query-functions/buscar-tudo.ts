/** @format */

import { IAndamento, IRespostaAndamento } from "@/types/processo";

export async function buscarTudo(
  access_token: string,
  pagina: number = 1,
  limite: number = 100,
): Promise<IRespostaAndamento> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(
    `${baseURL}andamentos?pagina=${pagina}&limite=${limite}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  const data = await response.json();

  if (response.status === 200) {
    return {
      ok: true,
      error: null,
      data: data,
      status: 200,
    };
  }

  return {
    ok: false,
    error: data.message,
    data: null,
    status: response.status,
  };
}
