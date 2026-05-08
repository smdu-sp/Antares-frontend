/** @format */

import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { jwtDecode } from "jwt-decode";
import type { IGrupoAtivo } from "@/types/grupo-ativo";

function asNonEmptyString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function normalizarGrupoAtivo(payload: unknown): IGrupoAtivo | null {
  if (!payload || typeof payload !== "object") return null;

  const rawRoot = payload as {
    data?: unknown;
    id?: unknown;
    grupoAtivoId?: unknown;
    grupo_ativo_id?: unknown;
    grupoAtivo?: unknown;
    grupo?: unknown;
    nome?: unknown;
    sigla?: unknown;
    permissaoEfetiva?: unknown;
    permissao_efetiva?: unknown;
    permissaoCoordenadoria?: unknown;
    permissao_coordenadoria?: unknown;
    membroAtivo?: unknown;
    membro_ativo?: unknown;
    gruposDisponiveis?: unknown;
    grupos_disponiveis?: unknown;
    grupos?: unknown;
  };

  const root =
    rawRoot.data && typeof rawRoot.data === "object"
      ? (rawRoot.data as typeof rawRoot)
      : rawRoot;

  const grupoAninhado =
    root.grupoAtivo && typeof root.grupoAtivo === "object"
      ? (root.grupoAtivo as {
          id?: unknown;
          grupoAtivoId?: unknown;
          grupo_ativo_id?: unknown;
          nome?: unknown;
          sigla?: unknown;
          permissaoEfetiva?: unknown;
          permissao_efetiva?: unknown;
          permissaoCoordenadoria?: unknown;
          permissao_coordenadoria?: unknown;
          membroAtivo?: unknown;
          membro_ativo?: unknown;
          gruposDisponiveis?: unknown;
          grupos_disponiveis?: unknown;
        })
      : null;

  const gruposDisponiveisRaw =
    root.gruposDisponiveis ||
    root.grupos_disponiveis ||
    grupoAninhado?.gruposDisponiveis ||
    grupoAninhado?.grupos_disponiveis ||
    root.grupos ||
    [];

  const gruposDisponiveis = Array.isArray(gruposDisponiveisRaw)
    ? gruposDisponiveisRaw
        .map((grupo) => {
          if (!grupo || typeof grupo !== "object") return null;

          const g = grupo as {
            id?: unknown;
            grupoId?: unknown;
            grupo_id?: unknown;
            nome?: unknown;
            sigla?: unknown;
            codigo?: unknown;
          };

          const id =
            asNonEmptyString(g.id) ||
            asNonEmptyString(g.grupoId) ||
            asNonEmptyString(g.grupo_id) ||
            "";

          if (!id) return null;

          return {
            id,
            nome: typeof g.nome === "string" ? g.nome : id,
            sigla:
              (typeof g.sigla === "string" && g.sigla) ||
              (typeof g.codigo === "string" && g.codigo) ||
              undefined,
          };
        })
        .filter((grupo): grupo is NonNullable<typeof grupo> => !!grupo)
    : [];

  const grupoDireto =
    root.grupo && typeof root.grupo === "object"
      ? (root.grupo as { id?: unknown; nome?: unknown; sigla?: unknown })
      : null;

  const idFromPayload =
    asNonEmptyString(root.id) ||
    asNonEmptyString(root.grupoAtivoId) ||
    asNonEmptyString(root.grupo_ativo_id) ||
    asNonEmptyString(grupoAninhado?.id) ||
    asNonEmptyString(grupoAninhado?.grupoAtivoId) ||
    asNonEmptyString(grupoAninhado?.grupo_ativo_id) ||
    asNonEmptyString(grupoDireto?.id) ||
    "";

  const idFallbackUnicoGrupo =
    gruposDisponiveis.length === 1 ? gruposDisponiveis[0]?.id || "" : "";

  const id = idFromPayload || idFallbackUnicoGrupo;
  if (!id) return null;

  return {
    id,
    nome:
      (typeof root.nome === "string" && root.nome) ||
      (typeof grupoAninhado?.nome === "string" && grupoAninhado.nome) ||
      (typeof grupoDireto?.nome === "string" && grupoDireto.nome) ||
      "",
    sigla:
      (typeof root.sigla === "string" && root.sigla) ||
      (typeof grupoAninhado?.sigla === "string" && grupoAninhado.sigla) ||
      (typeof grupoDireto?.sigla === "string" && grupoDireto.sigla) ||
      undefined,
    permissaoEfetiva:
      (typeof root.permissaoEfetiva === "string" && root.permissaoEfetiva) ||
      (typeof root.permissao_efetiva === "string" && root.permissao_efetiva) ||
      (typeof grupoAninhado?.permissaoEfetiva === "string" &&
        grupoAninhado.permissaoEfetiva) ||
      (typeof grupoAninhado?.permissao_efetiva === "string" &&
        grupoAninhado.permissao_efetiva) ||
      undefined,
    permissaoCoordenadoria:
      (typeof root.permissaoCoordenadoria === "string" &&
        root.permissaoCoordenadoria) ||
      (typeof root.permissao_coordenadoria === "string" &&
        root.permissao_coordenadoria) ||
      (typeof grupoAninhado?.permissaoCoordenadoria === "string" &&
        grupoAninhado.permissaoCoordenadoria) ||
      (typeof grupoAninhado?.permissao_coordenadoria === "string" &&
        grupoAninhado.permissao_coordenadoria) ||
      undefined,
    membroAtivo:
      (root.membroAtivo && typeof root.membroAtivo === "object"
        ? (root.membroAtivo as IGrupoAtivo["membroAtivo"])
        : root.membro_ativo && typeof root.membro_ativo === "object"
          ? (root.membro_ativo as IGrupoAtivo["membroAtivo"])
          : grupoAninhado?.membroAtivo &&
              typeof grupoAninhado.membroAtivo === "object"
            ? (grupoAninhado.membroAtivo as IGrupoAtivo["membroAtivo"])
            : grupoAninhado?.membro_ativo &&
                typeof grupoAninhado.membro_ativo === "object"
              ? (grupoAninhado.membro_ativo as IGrupoAtivo["membroAtivo"])
              : undefined) || undefined,
    gruposDisponiveis:
      gruposDisponiveis.length > 0
        ? (gruposDisponiveis as IGrupoAtivo["gruposDisponiveis"])
        : undefined,
  };
}

export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      type: "credentials",
      async authorize(credentials) {
        if (credentials?.login && credentials?.senha) {
          const { login, senha } = credentials;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}login`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, senha }),
                signal: controller.signal,
              },
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
              console.error(
                "Erro na autenticação:",
                response.status,
                response.statusText,
              );
              return null;
            }

            const usuario = await response.json();
            if (usuario) return usuario;
          } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
              console.error(
                "Timeout na requisição de autenticação - backend não respondeu em 10 segundos",
              );
            } else if (
              error instanceof TypeError &&
              error.message.includes("fetch failed")
            ) {
              console.error(
                "Erro de conexão - verifique se o backend está rodando em",
                process.env.NEXT_PUBLIC_API_URL,
              );
            } else {
              console.error("Erro inesperado na autenticação:", error);
            }
            return null;
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.usuario) {
          const tokenUser = token.user as {
            usuario?: {
              avatar?: string;
              permissao?: string;
              nomeSocial?: string;
            };
            grupoAtivo?: unknown;
          };

          if (tokenUser.usuario) {
            tokenUser.usuario.avatar = session.usuario.avatar;
            tokenUser.usuario.permissao = session.usuario.permissao;
            tokenUser.usuario.nomeSocial = session.usuario.nomeSocial;
          }
          tokenUser.grupoAtivo = session.grupoAtivo;
          return token;
        }
      }
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }) {
      session = token.user as typeof session;

      if (session.access_token && !session.usuario)
        session.usuario = jwtDecode(session.access_token);
      const now = new Date();
      if (session.usuario?.exp && session.usuario.exp * 1000 < now.getTime()) {
        // Só tenta renovar se houver refresh_token
        if (!session.refresh_token) {
          return session;
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refresh_token: session.refresh_token,
              }),
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const { access_token, refresh_token } = await response.json();
            session.access_token = access_token;
            session.refresh_token = refresh_token;
            if (access_token) session.usuario = jwtDecode(access_token);
          }
        } catch (error) {
          // Trata erros de conexão de forma silenciosa
          if (error instanceof Error) {
            const isConnectionError =
              error.name === "AbortError" ||
              (error.cause as { code?: string })?.code === "ECONNREFUSED" ||
              error.message.includes("fetch failed");

            if (isConnectionError) {
              // Backend não está disponível - log apenas em desenvolvimento
              if (process.env.NODE_ENV === "development") {
                console.warn(
                  "Backend não está disponível. Verifique se o servidor está rodando em",
                  process.env.NEXT_PUBLIC_API_URL,
                );
              }
            } else {
              console.error("Erro ao renovar token:", error);
            }
          }
        }
      }
      if (session.access_token) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}usuarios/valida-usuario`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);
        } catch (error) {
          // Trata erros de conexão de forma silenciosa
          if (error instanceof Error) {
            const isConnectionError =
              error.name === "AbortError" ||
              (error.cause as { code?: string })?.code === "ECONNREFUSED" ||
              error.message.includes("fetch failed");

            // Silenciosamente ignora erros de conexão para não bloquear a sessão
            // Log apenas em desenvolvimento
            if (!isConnectionError && process.env.NODE_ENV === "development") {
              console.warn("Erro ao validar usuário:", error);
            }
          }
        }
      }

      if (session.access_token) {
        try {
          const endpointGrupoAtivo = "grupo-ativo";
          let grupoAtivoResponse: unknown = null;
          let ultimoStatusGrupoAtivo: number | null = null;

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${endpointGrupoAtivo}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              cache: "no-store",
            },
          );

          ultimoStatusGrupoAtivo = response.status;

          if (response.ok) {
            grupoAtivoResponse = await response.json();
            if (process.env.NODE_ENV === "development") {
              console.info("Grupo ativo carregado com sucesso.", {
                endpointUtilizado: endpointGrupoAtivo,
                status: response.status,
              });
            }
          }

          if (grupoAtivoResponse) {
            const grupoNormalizado = normalizarGrupoAtivo(grupoAtivoResponse);

            if (grupoNormalizado) {
              session.grupoAtivo = grupoNormalizado;
            }

            // Se não existir grupo ativo, tenta persistir automaticamente quando há um único grupo disponível.
            if (!session.grupoAtivo?.id) {
              const raw = grupoAtivoResponse as {
                gruposDisponiveis?: Array<{ id?: unknown }>;
              };
              const grupos = Array.isArray(raw?.gruposDisponiveis)
                ? raw.gruposDisponiveis
                : [];

              if (
                grupos.length === 1 &&
                grupos[0] &&
                typeof grupos[0].id === "string"
              ) {
                const grupoUnicoId = grupos[0].id;
                const patchResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}${endpointGrupoAtivo}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${session.access_token}`,
                      "x-grupo-ativo-id": grupoUnicoId,
                    },
                    body: JSON.stringify({ grupoId: grupoUnicoId }),
                    cache: "no-store",
                  },
                );

                if (patchResponse.ok) {
                  const patchPayload = await patchResponse.json();
                  if (process.env.NODE_ENV === "development") {
                    console.info("Grupo ativo persistido com sucesso.", {
                      endpointUtilizado: endpointGrupoAtivo,
                      status: patchResponse.status,
                      grupoId: grupoUnicoId,
                    });
                  }
                  const patchNormalizado = normalizarGrupoAtivo(patchPayload);
                  if (patchNormalizado) {
                    session.grupoAtivo = patchNormalizado;
                  }
                }
              }
            }
          } else if (process.env.NODE_ENV === "development") {
            console.warn(
              "Não foi possível carregar grupo ativo em nenhuma rota.",
              {
                endpointsTentados: [endpointGrupoAtivo],
                ultimoStatus: ultimoStatusGrupoAtivo,
              },
            );
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Erro ao carregar grupo ativo:", error);
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
