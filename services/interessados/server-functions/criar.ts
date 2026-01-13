/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function criar(data: any) {
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

    const resposta = await fetch(`${BACKEND}interessados`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!resposta.ok) {
      const error = await resposta.json();
      return {
        ok: false,
        error: error.message || "Erro ao criar interessado",
        data: null,
        status: resposta.status,
      };
    }

    const interessado = await resposta.json();

    revalidateTag("interessados");

    return {
      ok: true,
      error: null,
      data: interessado,
      status: resposta.status,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Erro ao criar interessado",
      data: null,
      status: 500,
    };
  }
}
