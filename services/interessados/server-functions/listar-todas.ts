/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { IInteressado } from "@/types/interessado";
import { redirect } from "next/navigation";

export async function listarTodas(): Promise<IInteressado[]> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${baseURL}interessados/lista-completa`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      next: {
        revalidate: 60,
        tags: ["interessados"],
      },
    });

    if (!response.ok) {
      console.error("Erro ao buscar interessados:", response.statusText);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erro ao buscar interessados:", error);
    return [];
  }
}

export async function reativarInteressado(id: string, data: { valor: string }) {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${baseURL}interessados/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const responseData = await response.json();
      return {
        ok: true,
        error: null,
        data: responseData as IInteressado,
        status: response.status,
      };
    }

    const errorData = await response.json();
    return {
      ok: false,
      error: errorData?.message || "Erro ao atualizar interessado",
      data: null,
      status: response.status,
    };
  } catch (error) {
    console.error("Erro ao atualizar interessado:", error);
    return {
      ok: false,
      error: "Erro ao atualizar interessado",
      data: null,
      status: 500,
    };
  }
}
