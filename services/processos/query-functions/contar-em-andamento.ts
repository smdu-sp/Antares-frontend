/** @format */

export async function contarEmAndamento(
  token: string,
): Promise<{ ok: boolean; data: number | null; error: string | null }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}processos/contar/em-andamento`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `Erro ao contar processos em andamento: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      ok: true,
      data: typeof data === "number" ? data : data.count || 0,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao contar processos em andamento",
    };
  }
}
