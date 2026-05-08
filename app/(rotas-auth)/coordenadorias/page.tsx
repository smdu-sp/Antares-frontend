/** @format */

import { auth } from "@/lib/auth/auth";
import { canAdmin } from "@/lib/access-control";
import { AccessState } from "../_components/access-state";
import {
  buscarMapeamentosAdmin,
  buscarOpcoesContexto,
  buscarProcessosGruposAdmin,
} from "@/services/coordenadorias";
import {
  ICoordenadoriaApiResponse,
  ICoordenadoriaContexto,
  IOpcaoContexto,
} from "@/types/coordenadoria";
import { redirect } from "next/navigation";
import MapeamentosManager from "./_components/mapeamentos-manager";
import DevGovernancePanel from "./_components/dev-governance-panel";

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const obj = value as { value?: unknown; label?: unknown };
    if (typeof obj.value === "string") return obj.value;
    if (typeof obj.label === "string") return obj.label;
  }
  return "";
}

export default async function CoordenadoriasPage() {
  const session = await auth();

  if (!session?.access_token) {
    redirect("/login");
  }

  if (!canAdmin(session)) {
    redirect("/");
  }

  const grupoAtivoId =
    session.grupoAtivo?.id || session.grupoAtivo?.gruposDisponiveis?.[0]?.id;

  if (!grupoAtivoId) {
    return (
      <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
        <h1 className="text-xl md:text-4xl font-bold mb-5">
          Coordenadorias x Contexto
        </h1>
        <AccessState
          title="Selecione um grupo ativo para continuar"
          description="Abra o menu do usuário e escolha um grupo ativo antes de acessar o painel de coordenadorias."
        />
      </div>
    );
  }

  const [mapeamentosRes, opcoesRes] = await Promise.all([
    buscarMapeamentosAdmin(session.access_token, grupoAtivoId),
    buscarOpcoesContexto(session.access_token, grupoAtivoId),
  ]);

  const isDev = session.usuario?.permissao === "DEV";
  const emptyResponse: ICoordenadoriaApiResponse<Record<string, unknown>[]> = {
    ok: true,
    error: null,
    data: [],
    status: 200,
  };

  const [gruposRes, usuariosGruposRes, permissoesRes, processosGruposRes] =
    isDev
      ? await Promise.all([
          Promise.resolve({
            ok: false,
            error:
              "Endpoint nao disponivel no backend: GET /coordenadorias/admin/grupos",
            data: null,
            status: 404,
          }),
          Promise.resolve({
            ok: false,
            error:
              "Endpoint nao disponivel no backend: GET /coordenadorias/admin/usuarios-grupos",
            data: null,
            status: 404,
          }),
          Promise.resolve({
            ok: false,
            error:
              "Endpoint nao disponivel no backend: GET /coordenadorias/admin/permissoes",
            data: null,
            status: 404,
          }),
          buscarProcessosGruposAdmin(session.access_token, grupoAtivoId),
        ])
      : [emptyResponse, emptyResponse, emptyResponse, emptyResponse];

  if (mapeamentosRes.status === 403 || opcoesRes.status === 403) {
    return (
      <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
        <h1 className="text-xl md:text-4xl font-bold mb-5">
          Coordenadorias x Contexto
        </h1>
        <AccessState
          title="Acesso negado para o grupo ativo"
          description="Seu grupo ativo não possui permissão para administrar coordenadorias e contexto."
        />
      </div>
    );
  }

  const rawMapeamentos = (mapeamentosRes.data as unknown[] | null) || [];
  const mapeamentos: ICoordenadoriaContexto[] = rawMapeamentos
    .map((item) => {
      const obj = item as {
        coordenadoria?: unknown;
        contexto?: unknown;
      };

      return {
        coordenadoria: normalizeText(obj?.coordenadoria),
        contexto: normalizeText(obj?.contexto),
      };
    })
    .filter((item) => item.coordenadoria && item.contexto);

  const opcoesContexto = ((opcoesRes.data as IOpcaoContexto[] | null) || [])
    .filter((item) => item?.value)
    .map((item) => ({
      value: item.value,
      label: item.label || item.value,
    }));

  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold mb-5">
        Coordenadorias x Contexto
      </h1>
      <MapeamentosManager
        mapeamentos={mapeamentos}
        opcoesContexto={opcoesContexto}
      />

      {isDev && (
        <DevGovernancePanel
          grupos={gruposRes}
          usuariosGrupos={usuariosGruposRes}
          permissoes={permissoesRes}
          processosGrupos={processosGruposRes}
        />
      )}
    </div>
  );
}
