/** @format */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ICoordenadoriaApiResponse } from "@/types/coordenadoria";

type AdminListItem = Record<string, unknown>;

type Props = {
  processosGrupos: ICoordenadoriaApiResponse<AdminListItem[]>;
  grupos: ICoordenadoriaApiResponse<AdminListItem[]>;
  usuariosGrupos: ICoordenadoriaApiResponse<AdminListItem[]>;
  permissoes: ICoordenadoriaApiResponse<AdminListItem[]>;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[valor nao serializavel]";
  }
}

function DataState({
  title,
  description,
  response,
}: {
  title: string;
  description: string;
  response: ICoordenadoriaApiResponse<AdminListItem[]>;
}) {
  const data = response.data || [];

  const keys = Array.from(
    data.reduce((acc, row) => {
      Object.keys(row).forEach((k) => acc.add(k));
      return acc;
    }, new Set<string>()),
  ).slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!response.ok && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
            {response.error || "Nao foi possivel carregar os dados."}
          </div>
        )}

        {response.ok && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum registro encontrado.
          </p>
        )}

        {response.ok && data.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {keys.map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 25).map((row, idx) => (
                  <TableRow key={String(row.id || idx)}>
                    {keys.map((key) => (
                      <TableCell key={`${String(row.id || idx)}-${key}`}>
                        {formatValue(row[key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DevGovernancePanel({
  processosGrupos,
  grupos,
  usuariosGrupos,
  permissoes,
}: Props) {
  const endpointsComErro = [
    { nome: "Grupos", response: grupos },
    { nome: "Usuarios x Grupos", response: usuariosGrupos },
    { nome: "Permissoes", response: permissoes },
  ].filter((item) => !item.response.ok);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold md:text-2xl">
        Painel DEV de Governanca
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Visao simplificada</CardTitle>
          <CardDescription>
            Esta tela mostra apenas os recursos confirmados no backend para
            evitar erros e facilitar a operacao.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            1. Use o bloco abaixo para consultar o mapeamento de processos por
            grupo.
          </p>
          <p>
            2. O cadastro Coordenadorias x Contexto continua no painel acima.
          </p>
          <p>
            3. CRUD avancado fica desativado aqui ate o backend disponibilizar
            os endpoints completos.
          </p>
        </CardContent>
      </Card>

      {endpointsComErro.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Endpoints indisponiveis no backend</CardTitle>
            <CardDescription>
              Os seguintes recursos DEV retornaram erro e foram colocados em
              modo somente informativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
              {endpointsComErro.map((item) => (
                <li key={item.nome}>
                  {item.nome}:{" "}
                  {item.response.error || `HTTP ${item.response.status}`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <DataState
        title="Processos x Grupos"
        description="Mapeamento de acesso de processos por grupo."
        response={processosGrupos}
      />
    </div>
  );
}
