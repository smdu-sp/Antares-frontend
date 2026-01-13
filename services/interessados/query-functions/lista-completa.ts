"use server";

import { IInteressado } from "@/types/interessado";

export async function listaCompleta(token: string): Promise<IInteressado[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}interessados/lista-completa`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
