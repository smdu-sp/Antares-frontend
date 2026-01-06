/** @format */

"use server";

import { redirect } from "next/navigation";
import { IRespostaAndamento } from "@/types/processo";
import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";

export async function atualizarLote(data: {
  ids: string[];
  operacao: string;
  prazo?: string;
}): Promise<IRespostaAndamento> {
  try {
    const session = await auth();
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    if (!session) {
      redirect("/login");
    }

    const response: Response = await fetch(`${baseURL}andamentos/lote`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(data),
    });

    const dataResponse = await response.json();

    if (response.status === 200) {
      revalidateTag("andamentos");
      return {
        ok: true,
        error: null,
        data: null,
        status: 200,
      };
    }

    return {
      ok: false,
      error: dataResponse.message || "Erro desconhecido",
      data: null,
      status: dataResponse.statusCode || response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      data: null,
      status: 500,
    };
  }
}
