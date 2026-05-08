/** @format */

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletarMapeamento, salvarMapeamento } from "@/services/coordenadorias";
import { ICoordenadoriaContexto, IOpcaoContexto } from "@/types/coordenadoria";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  mapeamentos: ICoordenadoriaContexto[];
  opcoesContexto: IOpcaoContexto[];
};

const COORDENADORIAS = ["EXPEDIENTE", "SERVIN"];

export default function MapeamentosManager({
  mapeamentos,
  opcoesContexto,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [coordenadoria, setCoordenadoria] = useState<string>("EXPEDIENTE");
  const [contexto, setContexto] = useState<string>("");

  const contextosDisponiveis = useMemo(() => {
    const uniqueByValue = new Map<string, IOpcaoContexto>();
    opcoesContexto.forEach((item) => {
      if (item?.value && !uniqueByValue.has(item.value)) {
        uniqueByValue.set(item.value, item);
      }
    });
    const unique = Array.from(uniqueByValue.values());
    return unique;
  }, [opcoesContexto]);

  const salvar = () => {
    if (!coordenadoria || !contexto) {
      toast.error("Selecione coordenadoria e contexto");
      return;
    }

    startTransition(async () => {
      const result = await salvarMapeamento(coordenadoria, contexto);

      if (!result.ok) {
        toast.error("Não foi possível salvar", {
          description: result.error || "",
        });
        return;
      }

      toast.success("Mapeamento salvo com sucesso");
      setContexto("");
      router.refresh();
    });
  };

  const remover = (coord: string) => {
    startTransition(async () => {
      const result = await deletarMapeamento(coord);

      if (!result.ok) {
        toast.error("Não foi possível desativar vínculo", {
          description: result.error || "",
        });
        return;
      }

      toast.success("Vínculo desativado com sucesso");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Coordenadorias x Contexto</CardTitle>
          <CardDescription>
            Defina qual contexto será aplicado automaticamente para cada
            coordenadoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <p className="text-sm font-medium">Coordenadoria</p>
            <Select value={coordenadoria} onValueChange={setCoordenadoria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a coordenadoria" />
              </SelectTrigger>
              <SelectContent>
                {COORDENADORIAS.map((coord) => (
                  <SelectItem key={coord} value={coord}>
                    {coord}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Contexto</p>
            <Select value={contexto} onValueChange={setContexto}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o contexto" />
              </SelectTrigger>
              <SelectContent>
                {contextosDisponiveis.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={salvar} disabled={isPending || !contexto}>
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Salvar vínculo"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vínculos ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coordenadoria</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapeamentos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum vínculo cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                mapeamentos.map((item) => (
                  <TableRow key={`${item.coordenadoria}-${item.contexto}`}>
                    <TableCell>{item.coordenadoria}</TableCell>
                    <TableCell>{item.contexto}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => remover(item.coordenadoria)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Desativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
