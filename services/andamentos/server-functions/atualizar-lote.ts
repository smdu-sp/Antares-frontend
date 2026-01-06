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
  console.log("=== BACKEND atualizarLote ===");
  console.log("Data recebido:", data);
  console.log("IDs recebidos:", data.ids);
  console.log("Operação:", data.operacao);

  try {
    const session = await auth();
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    if (!session) {
      console.log("Sessão não encontrada, redirecionando para login");
      redirect("/login");
    }

    console.log("Enviando para API:", `${baseURL}andamentos/lote`);
    console.log("Body JSON:", JSON.stringify(data));

    const response: Response = await fetch(`${baseURL}andamentos/lote`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(data),
    });

    console.log("Status da resposta:", response.status);
    const dataResponse = await response.json();
    console.log("Dados da resposta:", dataResponse);

    if (response.status === 200) {
      revalidateTag("andamentos");
      return {
        ok: true,
        error: null,
        data: null,
        status: 200,
      };
    }

    console.log("Erro na resposta:", dataResponse);
    return {
      ok: false,
      error: dataResponse.message || "Erro desconhecido",
      data: null,
      status: dataResponse.statusCode || response.status,
    };
  } catch (error) {
    console.error("Erro na função atualizarLote:", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      data: null,
      status: 500,
    };
  }
}
