/** @format */

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/multi-select";
import {
  listarGruposDev,
  listarGruposUsuarioDev,
  atualizarGrupoUsuarioDev,
  atualizarPermissoesGrupoUsuarioDev,
  type GrupoDev,
  type GrupoUsuarioDev,
} from "@/services/acessos-admin";
import { IUsuario } from "@/types/usuario";
import { Loader2, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  user: IUsuario;
};

function inferGrupoInicial(user: IUsuario): string {
  const raw = user as unknown as {
    grupoId?: string;
    grupo_id?: string;
    grupos?: Array<{ id?: string }>;
  };

  return raw.grupoId || raw.grupo_id || raw.grupos?.[0]?.id || "";
}

function inferGruposIniciais(user: IUsuario): string[] {
  const raw = user as unknown as {
    grupoId?: string;
    grupo_id?: string;
    grupos?: Array<{ id?: string }>;
  };

  if (Array.isArray(raw.grupos) && raw.grupos.length > 0) {
    return raw.grupos
      .map((g) => g.id)
      .filter((id): id is string => Boolean(id));
  }

  if (raw.grupoId) return [raw.grupoId];
  if (raw.grupo_id) return [raw.grupo_id];
  return [];
}

export default function ModalGovernancaDev({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [grupos, setGrupos] = useState<GrupoDev[]>([]);
  const [vinculosPorGrupo, setVinculosPorGrupo] = useState<
    Record<string, GrupoUsuarioDev>
  >({});
  const [grupoId, setGrupoId] = useState("");
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);
  const [gruposPersistidos, setGruposPersistidos] = useState<string[]>([]);
  const [permissaoGrupo, setPermissaoGrupo] = useState<"ADM" | "TEC" | "USR">(
    "USR",
  );
  const [visualizarProprios, setVisualizarProprios] = useState(false);
  const [visualizarGrupo, setVisualizarGrupo] = useState(false);
  const [modificarProprios, setModificarProprios] = useState(false);
  const [modificarGrupo, setModificarGrupo] = useState(false);
  const [excluir, setExcluir] = useState(false);

  const payloadCapacidades = useMemo(
    () => ({
      visualizar_proprios: visualizarProprios,
      visualizar_grupo: visualizarGrupo,
      modificar_proprios: modificarProprios,
      modificar_grupo: modificarGrupo,
      excluir,
      ativo: true,
    }),
    [
      visualizarProprios,
      visualizarGrupo,
      modificarProprios,
      modificarGrupo,
      excluir,
    ],
  );

  const aplicarEstadoDoGrupo = (
    grupoSelecionadoId: string,
    mapa: Record<string, GrupoUsuarioDev>,
  ) => {
    const vinculo = mapa[grupoSelecionadoId];
    setPermissaoGrupo(vinculo?.permissaoGrupo || "USR");
    setVisualizarProprios(Boolean(vinculo?.capacidades?.visualizar_proprios));
    setVisualizarGrupo(Boolean(vinculo?.capacidades?.visualizar_grupo));
    setModificarProprios(Boolean(vinculo?.capacidades?.modificar_proprios));
    setModificarGrupo(Boolean(vinculo?.capacidades?.modificar_grupo));
    setExcluir(Boolean(vinculo?.capacidades?.excluir));
  };

  useEffect(() => {
    if (!open) return;

    startTransition(async () => {
      const [gruposResp, gruposUsuarioResp] = await Promise.all([
        listarGruposDev(),
        listarGruposUsuarioDev(user.id),
      ]);

      if (gruposResp.ok && gruposResp.data) {
        setGrupos(gruposResp.data);
      }

      if (!gruposResp.ok) {
        toast.error("Erro ao carregar grupos", {
          description: gruposResp.error || undefined,
        });
      }

      const fallbackGroups = inferGruposIniciais(user);

      if (gruposUsuarioResp.ok && gruposUsuarioResp.data) {
        const mapa = gruposUsuarioResp.data.reduce<
          Record<string, GrupoUsuarioDev>
        >((acc, item) => {
          acc[item.grupoId] = item;
          return acc;
        }, {});

        setVinculosPorGrupo(mapa);

        const ativos = gruposUsuarioResp.data
          .filter((v) => v.ativo)
          .map((v) => v.grupoId);
        const selecionados = ativos.length > 0 ? ativos : fallbackGroups;
        setGruposSelecionados(selecionados);
        setGruposPersistidos(ativos);
        const grupoInicial = selecionados[0] || inferGrupoInicial(user);
        setGrupoId(grupoInicial);
        if (grupoInicial) {
          aplicarEstadoDoGrupo(grupoInicial, mapa);
        }
      } else {
        setGruposSelecionados(fallbackGroups);
        setGruposPersistidos(fallbackGroups);
        setVinculosPorGrupo({});
        const grupoInicial = fallbackGroups[0] || inferGrupoInicial(user);
        setGrupoId(grupoInicial);
      }

      if (!gruposUsuarioResp.ok) {
        toast.error("Erro ao carregar grupos do usuário", {
          description: gruposUsuarioResp.error || undefined,
        });
      }
    });
  }, [open, user]);

  useEffect(() => {
    if (!grupoId) return;
    aplicarEstadoDoGrupo(grupoId, vinculosPorGrupo);
  }, [grupoId, vinculosPorGrupo]);

  const vincularGrupos = () => {
    if (gruposSelecionados.length === 0) {
      toast.error("Selecione ao menos um grupo para vincular");
      return;
    }

    startTransition(async () => {
      const setSelecionados = new Set(gruposSelecionados);
      const setPersistidos = new Set(gruposPersistidos);

      const paraAtivar = gruposSelecionados.filter(
        (id) => !setPersistidos.has(id),
      );
      const paraDesativar = gruposPersistidos.filter(
        (id) => !setSelecionados.has(id),
      );

      if (paraAtivar.length === 0 && paraDesativar.length === 0) {
        toast.info("Nenhuma alteracao de grupos para salvar");
        return;
      }

      const [ativacoes, desativacoes] = await Promise.all([
        Promise.all(
          paraAtivar.map((id) =>
            atualizarGrupoUsuarioDev(user.id, id, {
              ativo: true,
              permissao_grupo:
                vinculosPorGrupo[id]?.permissaoGrupo ||
                (id === grupoId ? permissaoGrupo : "USR"),
            }),
          ),
        ),
        Promise.all(
          paraDesativar.map((id) =>
            atualizarGrupoUsuarioDev(user.id, id, {
              ativo: false,
              permissao_grupo: vinculosPorGrupo[id]?.permissaoGrupo || "USR",
            }),
          ),
        ),
      ]);

      const erros = [...ativacoes, ...desativacoes].filter((r) => !r.ok);

      if (erros.length > 0) {
        toast.error("Falha ao vincular grupos", {
          description: erros[0]?.error || undefined,
        });
        return;
      }

      const recarregar = await listarGruposUsuarioDev(user.id);
      if (!recarregar.ok || !recarregar.data) {
        toast.warning("Grupos salvos, mas falha ao validar persistencia", {
          description: recarregar.error || undefined,
        });
        setGruposPersistidos(gruposSelecionados);
      } else {
        const mapaAtualizado = recarregar.data.reduce<
          Record<string, GrupoUsuarioDev>
        >((acc, item) => {
          acc[item.grupoId] = item;
          return acc;
        }, {});

        const ativosAtualizados = recarregar.data
          .filter((v) => v.ativo)
          .map((v) => v.grupoId);

        setVinculosPorGrupo(mapaAtualizado);
        setGruposPersistidos(ativosAtualizados);
        setGruposSelecionados(ativosAtualizados);

        const setAtivosAtualizados = new Set(ativosAtualizados);
        const naoAtivados = gruposSelecionados.filter(
          (id) => !setAtivosAtualizados.has(id),
        );
        const naoDesativados = ativosAtualizados.filter(
          (id) => !setSelecionados.has(id),
        );

        const nomeGrupo = (id: string) => {
          const grupoLista = grupos.find((g) => g.id === id);
          if (grupoLista) {
            return grupoLista.sigla
              ? `${grupoLista.sigla} (${id})`
              : `${grupoLista.nome} (${id})`;
          }

          const vinculo = mapaAtualizado[id] || vinculosPorGrupo[id];
          if (vinculo) {
            return vinculo.sigla
              ? `${vinculo.sigla} (${id})`
              : `${vinculo.nome} (${id})`;
          }

          return id;
        };

        if (naoAtivados.length > 0 || naoDesativados.length > 0) {
          const detalhes: string[] = [];
          if (naoAtivados.length > 0) {
            detalhes.push(
              `Nao ativados: ${naoAtivados.map(nomeGrupo).join(", ")}`,
            );
          }
          if (naoDesativados.length > 0) {
            detalhes.push(
              `Nao desativados: ${naoDesativados.map(nomeGrupo).join(", ")}`,
            );
          }

          toast.warning("Persistencia parcial de grupos", {
            description: detalhes.join(" | "),
          });
        } else {
          toast.success("Grupos vinculados ao usuario");
        }
      }

      if (!grupoId && gruposSelecionados[0]) {
        setGrupoId(gruposSelecionados[0]);
      }

      if (grupoId && !gruposSelecionados.includes(grupoId)) {
        setGrupoId(gruposSelecionados[0] || "");
      }
    });
  };

  const salvarPermissoesPorGrupo = () => {
    if (!grupoId) {
      toast.error("Selecione um grupo");
      return;
    }

    startTransition(async () => {
      const vinculoResp = await atualizarGrupoUsuarioDev(user.id, grupoId, {
        ativo: true,
        permissao_grupo: permissaoGrupo,
      });

      if (!vinculoResp.ok) {
        toast.error("Falha ao salvar papel no grupo", {
          description: vinculoResp.error || undefined,
        });
        return;
      }

      const resp = await atualizarPermissoesGrupoUsuarioDev(
        user.id,
        grupoId,
        payloadCapacidades,
      );
      if (!resp.ok) {
        toast.error("Falha ao salvar permissoes por grupo", {
          description: resp.error || undefined,
        });
        return;
      }

      setVinculosPorGrupo((prev) => ({
        ...prev,
        [grupoId]: {
          ...(prev[grupoId] || {
            grupoId,
            nome: grupoId,
            ativo: true,
          }),
          ativo: true,
          permissaoGrupo,
          capacidades: {
            visualizar_proprios: Boolean(
              payloadCapacidades.visualizar_proprios,
            ),
            visualizar_grupo: Boolean(payloadCapacidades.visualizar_grupo),
            modificar_proprios: Boolean(payloadCapacidades.modificar_proprios),
            modificar_grupo: Boolean(payloadCapacidades.modificar_grupo),
            excluir: Boolean(payloadCapacidades.excluir),
            ativo: true,
          },
        },
      }));

      toast.success("Papel e permissoes por grupo atualizados");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="Governanca DEV">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Governanca DEV</DialogTitle>
          <DialogDescription>
            Configure vinculos de grupo, papel no grupo e capacidades
            combinaveis para <span className="font-medium">{user.nome}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-md border p-3">
            <Label>Grupo</Label>
            <MultiSelect
              key={`grupos-${user.id}-${gruposSelecionados.join("|")}-${grupos.length}`}
              options={grupos.map((grupo) => ({
                value: grupo.id,
                label: grupo.sigla
                  ? `${grupo.sigla} - ${grupo.nome}`
                  : grupo.nome,
              }))}
              defaultValue={gruposSelecionados}
              onValueChange={setGruposSelecionados}
              placeholder="Selecione um ou mais grupos"
              maxCount={4}
            />

            <Label>Grupo alvo para permissões por grupo</Label>
            <Select
              value={grupoId}
              onValueChange={setGrupoId}
              disabled={gruposSelecionados.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo alvo" />
              </SelectTrigger>
              <SelectContent>
                {grupos
                  .filter((grupo) => gruposSelecionados.includes(grupo.id))
                  .map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.sigla
                        ? `${grupo.sigla} - ${grupo.nome}`
                        : grupo.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {grupos.length === 0 && (
              <p className="text-xs text-amber-700">
                Nenhum grupo retornado pelo backend para o endpoint de grupos
                DEV.
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={vincularGrupos} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Vincular grupos
              </Button>
              <Button
                variant="secondary"
                onClick={salvarPermissoesPorGrupo}
                disabled={isPending}
              >
                Salvar papel e capacidades
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Papel no grupo</Label>
                <Select
                  value={permissaoGrupo}
                  onValueChange={(v: "ADM" | "TEC" | "USR") =>
                    setPermissaoGrupo(v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADM">ADM</SelectItem>
                    <SelectItem value="TEC">TEC</SelectItem>
                    <SelectItem value="USR">USR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="flex items-center justify-between rounded border p-2">
                <Label htmlFor="vg">Visualizar grupo</Label>
                <Switch
                  id="vg"
                  checked={visualizarGrupo}
                  onCheckedChange={setVisualizarGrupo}
                />
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <Label htmlFor="vp">Visualizar proprios</Label>
                <Switch
                  id="vp"
                  checked={visualizarProprios}
                  onCheckedChange={setVisualizarProprios}
                />
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <Label htmlFor="mg">Modificar grupo</Label>
                <Switch
                  id="mg"
                  checked={modificarGrupo}
                  onCheckedChange={setModificarGrupo}
                />
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <Label htmlFor="mp">Modificar proprios</Label>
                <Switch
                  id="mp"
                  checked={modificarProprios}
                  onCheckedChange={setModificarProprios}
                />
              </div>
              <div className="flex items-center justify-between rounded border p-2 md:col-span-2">
                <Label htmlFor="ex">Excluir</Label>
                <Switch
                  id="ex"
                  checked={excluir}
                  onCheckedChange={setExcluir}
                />
              </div>
            </div>
          </div>

          <Input disabled value={user.login} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
