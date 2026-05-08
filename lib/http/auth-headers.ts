/** @format */

export function buildAuthHeaders(
  accessToken: string,
  grupoAtivoId?: string,
): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...(grupoAtivoId ? { "x-grupo-ativo-id": grupoAtivoId } : {}),
  };
}
