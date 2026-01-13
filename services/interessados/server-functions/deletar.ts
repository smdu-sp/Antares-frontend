/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function deletar(id: string) {
  try {
    const session = await auth();

    if (!session?.access_token) {
      return {
        ok: false,
        error: "Não autenticado",
        data: null,
        status: 401,
      };
    }

    const resposta = await fetch(`${BACKEND}interessados/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!resposta.ok) {
      const error = await resposta.json();
      return {
        ok: false,
        error: error.message || "Erro ao deletar interessado",
        data: null,
        status: resposta.status,
      };
    }

    revalidateTag("interessados");
    revalidateTag(id);

    return {
      ok: true,
      error: null,
      data: null,
      status: resposta.status,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Erro ao deletar interessado",
      data: null,
      status: 500,
    };
  }
}
