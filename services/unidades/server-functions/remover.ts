/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { IRespostaUnidade } from "@/types/unidade";

export async function remover(id: string): Promise<IRespostaUnidade> {
  const session = await auth();
  if (!session) redirect("/login");
  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response: Response = await fetch(`${baseURL}unidades/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
    const dataResponse = await response.json();

    if (response.status === 200) {
      revalidateTag("unidades");
      revalidateTag("unidade-by-id");
      revalidatePath("/");
      return {
        ok: true,
        error: null,
        data: dataResponse as { removido: boolean },
        status: 200,
      };
    }
    if (!dataResponse) {
      return {
        ok: false,
        error: "Erro ao remover unidade.",
        data: null,
        status: 500,
      };
    }
    return {
      ok: false,
      error: dataResponse.message,
      data: null,
      status: dataResponse.statusCode,
    };
  } catch (error) {
    // Erro ao remover unidade
    return {
      ok: false,
      error: "Erro ao remover unidade.",
      data: null,
      status: 500,
    };
  }
}
