/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export function BtnLimparFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function limpaFiltros() {
    router.push(pathname);
  }

  return (
    <Button
      variant={"outline"}
      size="lg"
      disabled={isPending}
      className="w-full sm:w-auto"
      onClick={() => startTransition(() => limpaFiltros())}
      title="Limpar todos os filtros"
    >
      <X className="h-4 w-4 mr-2" />
      Limpar Filtros
    </Button>
  );
}
