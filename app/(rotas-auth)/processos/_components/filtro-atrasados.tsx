/** @format */
"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { contarAtrasados } from "@/services/processos/query-functions";

export default function FiltroAtrasados() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const [contagem, setContagem] = useState<number>(0);

  const atrasados = searchParams.get("atrasados") === "true";

  useEffect(() => {
    async function carregarContagem() {
      if (!session?.access_token) {
        console.log("Token não disponível ainda");
        return;
      }

      try {
        console.log("Buscando contagem de atrasados...");
        const response = await contarAtrasados(session.access_token);
        console.log("Resposta da API:", response);

        if (
          response.ok &&
          response.data !== null &&
          response.data !== undefined
        ) {
          const count = Number(response.data);
          if (!isNaN(count)) {
            console.log("Contagem definida:", count);
            setContagem(count);
          } else {
            console.warn("Dados inválidos recebidos:", response.data);
          }
        } else {
          console.warn("Resposta não OK ou dados nulos:", response);
        }
      } catch (error) {
        console.error("Erro ao carregar contagem:", error);
      }
    }

    carregarContagem();

    // Atualiza a cada 60 segundos
    const interval = setInterval(carregarContagem, 60000);
    return () => clearInterval(interval);
  }, [session?.access_token]);

  const toggleFiltro = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (atrasados) {
        params.delete("atrasados");
      } else {
        params.set("atrasados", "true");
        // Reseta para primeira página ao aplicar filtro
        params.set("pagina", "1");
      }

      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <Button
      variant={atrasados ? "default" : "outline"}
      onClick={toggleFiltro}
      disabled={isPending}
      className={cn(
        "w-full md:w-auto relative",
        atrasados && "bg-red-600 hover:bg-red-700 text-white"
      )}
    >
      <AlertTriangle className="h-4 w-4 mr-2" />
      Atrasados
      {contagem > 0 && (
        <span className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded">
          {contagem}
        </span>
      )}
    </Button>
  );
}
