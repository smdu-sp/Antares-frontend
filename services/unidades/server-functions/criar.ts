/** @format */

"use server";

import { redirect } from "next/navigation";
import { ICreateUnidade, IRespostaUnidade, IUnidade } from "@/types/unidade";
import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";

export async function criar(data: ICreateUnidade): Promise<IRespostaUnidade> {
  const session = await auth();
  const baseURL = process.env.NEXT_PUBLIC_API_URL;
  if (!session) redirect("/login");

  const response: Response = await fetch(`${baseURL}unidades`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  });
  const dataResponse = await response.json();
  if (response.status === 201) {
    revalidateTag("unidades");
    return {
      ok: true,
      error: null,
      data: dataResponse as IUnidade,
      status: 201,
    };
  }
  if (!dataResponse)
    return {
      ok: false,
      error: "Erro ao criar nova unidade.",
      data: null,
      status: response.status,
    };
  return {
    ok: false,
    error: dataResponse.message,
    data: null,
    status: response.status,
  };
}
