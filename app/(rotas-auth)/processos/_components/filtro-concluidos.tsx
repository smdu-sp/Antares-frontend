/** @format */
"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { contarConcluidos } from "@/services/processos/query-functions";

export default function FiltroConcluidos() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const [contagem, setContagem] = useState<number>(0);

  const concluidos = searchParams.get("concluidos") === "true";

  useEffect(() => {
    async function carregarContagem() {
      if (!session?.access_token) {
        return;
      }

      try {
        const response = await contarConcluidos(session.access_token);

        if (
          response.ok &&
          response.data !== null &&
          response.data !== undefined
        ) {
          const count = Number(response.data);
          if (!isNaN(count)) {
            setContagem(count);
          }
        }
      } catch (error) {}
    }

    carregarContagem();

    // Atualiza a cada 60 segundos
    const interval = setInterval(carregarContagem, 60000);
    return () => clearInterval(interval);
  }, [session?.access_token]);

  const toggleFiltro = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (concluidos) {
        params.delete("concluidos");
      } else {
        params.set("concluidos", "true");
        // Reseta para primeira página ao aplicar filtro
        params.set("pagina", "1");
      }

      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <Button
      variant={concluidos ? "default" : "outline"}
      onClick={toggleFiltro}
      disabled={isPending}
      size="lg"
      className={cn(
        "w-full sm:w-auto relative flex items-center gap-2 transition-all",
        concluidos && "bg-green-600 hover:bg-green-700 text-white shadow-md"
      )}
    >
      <CheckCircle2 className="h-4 w-4" />
      <span className="font-medium">Concluídos</span>
      {contagem > 0 && (
        <span className="h-6 min-w-6 px-2 flex items-center justify-center text-xs font-bold bg-white text-green-600 rounded-full">
          {contagem > 99 ? "99+" : contagem}
        </span>
      )}
    </Button>
  );
}
