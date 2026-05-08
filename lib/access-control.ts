/** @format */

import type { IUsuario, IUsuarioSession } from "@/types/usuario";
import type { IGrupoAtivo } from "@/types/grupo-ativo";

type SessionLike = {
  usuario?: {
    permissao?: string;
  };
  grupoAtivo?: IGrupoAtivo;
};

type UsuarioLike =
  | IUsuario
  | IUsuarioSession
  | SessionLike
  | {
      permissao?: string;
    }
  | null
  | undefined;

function isGrupoGlobalAtivo(grupoAtivo?: IGrupoAtivo): boolean {
  if (!grupoAtivo) return false;

  const sigla = (grupoAtivo.sigla || "").toString().trim().toUpperCase();
  const nome = (grupoAtivo.nome || "").toString().trim().toUpperCase();

  return sigla === "GLOBAL" || nome === "GLOBAL";
}

export function isGlobalMaster(usuario: UsuarioLike): boolean {
  const sessao = usuario as SessionLike;
  return isGrupoGlobalAtivo(sessao?.grupoAtivo);
}

function getPermissaoCoordenadoriaDoGrupo(
  grupoAtivo?: IGrupoAtivo,
): string | null {
  if (!grupoAtivo) return null;

  const grupo = grupoAtivo as unknown as {
    permissaoEfetiva?: unknown;
    permissaoCoordenadoria?: unknown;
    membroAtivo?: { permissaoCoordenadoria?: unknown; permissao?: unknown };
  };

  const permissaoDireta =
    (typeof grupo.permissaoEfetiva === "string" && grupo.permissaoEfetiva) ||
    (typeof grupo.permissaoCoordenadoria === "string" &&
      grupo.permissaoCoordenadoria) ||
    (typeof grupo.membroAtivo?.permissaoCoordenadoria === "string" &&
      grupo.membroAtivo.permissaoCoordenadoria) ||
    (typeof grupo.membroAtivo?.permissao === "string" &&
      grupo.membroAtivo.permissao);

  if (!permissaoDireta) return null;
  return permissaoDireta.toUpperCase();
}

export function getPermissaoCoordenadoria(usuario: UsuarioLike): string {
  const sessao = usuario as SessionLike;
  if (isGrupoGlobalAtivo(sessao?.grupoAtivo)) {
    return "ADMINISTRADOR";
  }

  const permissaoDoGrupo = getPermissaoCoordenadoriaDoGrupo(sessao?.grupoAtivo);
  if (permissaoDoGrupo) {
    return permissaoDoGrupo;
  }

  const usuarioDireto = usuario as {
    permissao?: string;
  };

  const permissao =
    sessao?.usuario?.permissao?.toString() ||
    usuarioDireto?.permissao?.toString();
  if (permissao === "DEV" || permissao === "ADM") return "ADMINISTRADOR";
  if (permissao === "TEC") return "EDITOR";
  return "LEITOR";
}

export function hasGrupoAtivo(usuario: UsuarioLike): boolean {
  const sessao = usuario as SessionLike;
  return !!sessao?.grupoAtivo?.id;
}

export function canRead(usuario: UsuarioLike): boolean {
  if (isGlobalMaster(usuario)) return true;
  return ["LEITOR", "EDITOR", "ADMINISTRADOR"].includes(
    getPermissaoCoordenadoria(usuario),
  );
}

export function canEdit(usuario: UsuarioLike): boolean {
  if (isGlobalMaster(usuario)) return true;
  return ["EDITOR", "ADMINISTRADOR"].includes(
    getPermissaoCoordenadoria(usuario),
  );
}

export function canAdmin(usuario: UsuarioLike): boolean {
  if (isGlobalMaster(usuario)) return true;
  return getPermissaoCoordenadoria(usuario) === "ADMINISTRADOR";
}
