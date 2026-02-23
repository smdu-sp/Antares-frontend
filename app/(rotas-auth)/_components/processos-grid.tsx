/** @format */

'use client';

import { IProcesso } from '@/types/processo';
import { IUnidade } from '@/types/unidade';
import { IInteressado } from '@/types/interessado';
import ProcessosSpreadsheet from '@/components/processos-spreadsheet';

interface ProcessosGridProps {
  processos: IProcesso[];
  unidades: IUnidade[];
  interessados: IInteressado[];
  busca?: string;
  interessado?: string;
  unidade?: string;
  vencendoHoje?: boolean;
  atrasados?: boolean;
  concluidos?: boolean;
}

export function ProcessosGrid({
  processos,
  unidades,
  interessados,
  busca = '',
  interessado = '',
  unidade = '',
  vencendoHoje = false,
  atrasados = false,
  concluidos = false,
}: ProcessosGridProps) {
  return (
    <>
      <ProcessosSpreadsheet
        processos={processos}
        unidades={unidades}
        interessados={interessados}
        busca={busca}
        interessado={interessado}
        unidade={unidade}
        vencendoHoje={vencendoHoje}
        atrasados={atrasados}
        concluidos={concluidos}
      />
    </>
  );
}
