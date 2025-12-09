/** @format */

"use server";

import { redirect } from "next/navigation";
import { IRespostaProcesso } from "@/types/processo";
import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";

export interface ICreateRespostaFinal {
  processo_id: string;
  data_resposta_final: string;
  resposta_final: string;
  unidade_respondida_id: string;
}

export async function criarRespostaFinal(
  data: ICreateRespostaFinal
): Promise<IRespostaProcesso> {
  const session = await auth();
  const baseURL = process.env.NEXT_PUBLIC_API_URL;
  if (!session) redirect("/login");

  const response: Response = await fetch(`${baseURL}processos/resposta-final`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  });

  const dataResponse = await response.json();

  if (response.status === 201) {
    revalidateTag("processos");
    return {
      ok: true,
      error: null,
      data: dataResponse,
      status: 201,
    };
  }

  return {
    ok: false,
    error: dataResponse.message || "Erro ao criar resposta final",
    data: null,
    status: response.status,
  };
}
