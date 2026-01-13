/** @format */

"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ICellRendererParams,
  ValueSetterParams,
  GridReadyEvent,
  CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { IProcesso, IAndamento } from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import { IInteressado } from "@/types/interessado";
import * as processo from "@/services/processos";
import * as andamento from "@/services/andamentos";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Registrar todos os módulos da comunidade AG-Grid
ModuleRegistry.registerModules([AllCommunityModule]);

// Componente para mostrar andamentos como detalhe expansível
function AndamentosDetail({ processo }: { processo: IProcesso }) {
  const { data: session } = useSession();
  const [andamentos, setAndamentos] = useState<IAndamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadAndamentos() {
      if (!session?.access_token || !processo.id || loaded) return;

      setLoading(true);
      try {
        const response = await andamento.query.buscarPorProcesso(
          session.access_token,
          processo.id
        );
        if (response.ok && response.data) {
          setAndamentos(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Erro ao carregar andamentos:", error);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }

    loadAndamentos();
  }, [processo.id, session?.access_token, loaded]);

  const adicionarAndamento = () => {
    const novoAndamento: any = {
      id: `temp-${Date.now()}`,
      processo_id: processo.id,
      origem: "",
      destino: "",
      data_envio: new Date().toISOString().split("T")[0],
      prazo: "",
      status: "EM_ANDAMENTO",
      observacao: "",
      _isNew: true,
    };
    setAndamentos([...andamentos, novoAndamento]);
  };

  const onCellValueChanged = useCallback(
    async (event: CellValueChangedEvent) => {
      if (!session?.access_token) return;

      const andamentoAtualizado = event.data as IAndamento;
      const isNew = (andamentoAtualizado as any)._isNew;

      try {
        const dataToSave: any = {
          processo_id: processo.id,
          origem: andamentoAtualizado.origem,
          destino: andamentoAtualizado.destino,
          data_envio: andamentoAtualizado.data_envio,
          prazo: andamentoAtualizado.prazo,
          status: andamentoAtualizado.status,
          observacao: andamentoAtualizado.observacao,
        };

        let response: any;
        if (isNew) {
          response = await andamento.server.criar(dataToSave);
          if (response.ok && response.data) {
            // Atualizar com o ID real do servidor
            const updatedAndamentos = andamentos.map((a) =>
              (a as any).id === andamentoAtualizado.id ? response.data : a
            );
            setAndamentos(updatedAndamentos as IAndamento[]);
            toast.success("Andamento criado com sucesso");
          }
        } else {
          response = await andamento.server.atualizar(
            andamentoAtualizado.id,
            dataToSave
          );
          if (response.ok) {
            toast.success("Andamento atualizado com sucesso");
          }
        }

        if (!response.ok) {
          toast.error("Erro ao salvar andamento", {
            description: response.error,
          });
          event.node.setDataValue(event.colDef.field as string, event.oldValue);
        } else {
          router.refresh();
        }
      } catch (error) {
        toast.error("Erro ao salvar andamento");
        event.node.setDataValue(event.colDef.field as string, event.oldValue);
      }
    },
    [session?.access_token, processo.id, andamentos, router]
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "origem",
        headerName: "Origem",
        editable: true,
        flex: 1,
      },
      {
        field: "destino",
        headerName: "Destino",
        editable: true,
        flex: 1,
      },
      {
        field: "data_envio",
        headerName: "Data Envio",
        editable: true,
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(new Date(params.value), "dd/MM/yyyy", { locale: ptBR });
        },
        flex: 1,
      },
      {
        field: "prazo",
        headerName: "Prazo",
        editable: true,
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(new Date(params.value), "dd/MM/yyyy", { locale: ptBR });
        },
        flex: 1,
      },
      {
        field: "status",
        headerName: "Status",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["EM_ANDAMENTO", "CONCLUIDO", "PENDENTE", "CANCELADO"],
        },
        flex: 1,
      },
      {
        field: "observacao",
        headerName: "Observação",
        editable: true,
        flex: 2,
        wrapText: true,
        autoHeight: true,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
    }),
    []
  );

  if (loading) {
    return (
      <div
        className="flex items-center justify-center p-8 bg-gradient-to-r from-gray-50 to-gray-100"
        style={{ backgroundColor: "#f8f9fa", minHeight: "150px" }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Carregando andamentos...
        </span>
      </div>
    );
  }

  if (andamentos.length === 0) {
    return (
      <div
        className="p-8 text-center bg-gradient-to-r from-yellow-50 to-yellow-100"
        style={{
          minHeight: "150px",
          border: "2px dashed #fbbf24",
          borderRadius: "8px",
          margin: "16px",
        }}
      >
        <p className="text-yellow-700 font-medium text-base">
          Nenhum andamento encontrado para este processo.
        </p>
      </div>
    );
  }

  return (
    <div
      className="p-6 bg-gradient-to-r from-gray-50 to-gray-100"
      style={{ width: "100%", minHeight: "200px" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Andamentos do Processo - {processo.numero_sei}
        </h3>
        <Button
          onClick={adicionarAndamento}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Novo Andamento
        </Button>
      </div>

      <div className="ag-theme-alpine" style={{ height: 250, width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={andamentos}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          theme="legacy"
        />
      </div>
    </div>
  );
}

interface ProcessosSpreadsheetProps {
  processos: IProcesso[];
  unidades: IUnidade[];
  interessados: IInteressado[];
}

export default function ProcessosSpreadsheet({
  processos,
  unidades,
  interessados,
}: ProcessosSpreadsheetProps) {
  const gridRef = useRef<AgGridReact>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Mapa de versões para controle de conflito
  const versionsRef = useRef<Map<string, Date>>(new Map());

  // Criar dados da linha incluindo linhas de detalhe
  const rowData = useMemo(() => {
    const rows: any[] = [];
    processos.forEach((processo) => {
      rows.push(processo);
      if (expandedRows.has(processo.id)) {
        rows.push({
          _isDetail: true,
          _parentId: processo.id,
          _processo: processo,
          id: `detail-${processo.id}`, // ID único para a linha de detalhe
        });
      }
    });
    return rows;
  }, [processos, expandedRows]);

  useEffect(() => {
    // Inicializa versões
    processos.forEach((p) => {
      versionsRef.current.set(p.id, new Date(p.atualizadoEm));
    });
  }, [processos]);

  const unidadesOptions = useMemo(
    () => unidades.map((u) => `${u.sigla} - ${u.nome}`),
    [unidades]
  );

  const interessadosOptions = useMemo(
    () => interessados.map((i) => i.valor),
    [interessados]
  );

  const columnDefs = useMemo(
    () =>
      [
        {
          headerName: "",
          field: "expand",
          width: 50,
          pinned: "left" as const,
          cellRenderer: (params: ICellRendererParams) => {
            if (params.data?._isDetail) return null;

            const processo = params.data as IProcesso;
            const isExpanded = expandedRows.has(processo.id);

            return (
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedRows);
                  if (isExpanded) {
                    newExpanded.delete(processo.id);
                  } else {
                    newExpanded.add(processo.id);
                  }
                  setExpandedRows(newExpanded);
                }}
                className="flex items-center justify-center w-full h-full hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            );
          },
          sortable: false,
          filter: false,
          editable: false,
        },
        {
          field: "numero_sei",
          headerName: "Nº SEI",
          editable: true,
          pinned: "left" as const,
          width: 150,
          cellStyle: { fontWeight: "bold" },
        },
        {
          field: "assunto",
          headerName: "Assunto",
          editable: true,
          flex: 2,
          valueFormatter: (params: any) => {
            const value = params.value || "";
            return value.length > 80 ? value.substring(0, 80) + "..." : value;
          },
          tooltipField: "assunto",
          cellStyle: {
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        },
        {
          field: "interessado",
          headerName: "Interessado",
          editable: true,
          cellEditor: "agSelectCellEditor",
          cellEditorParams: {
            values: interessadosOptions,
          },
          valueGetter: (params: any) => {
            if (params.data?._isDetail) return "";
            const processo = params.data as IProcesso;
            return processo.interessado || "";
          },
          valueFormatter: (params: any) => params.value || "",
          valueSetter: (params: ValueSetterParams) => {
            const selected = params.newValue as string;
            const interessado = interessados.find((i) => i.valor === selected);
            if (interessado && params.node) {
              params.data.interessado = interessado.valor;
              params.data.interessado_id = interessado.id;
              // Forçar atualização visual
              params.api.refreshCells({
                rowNodes: [params.node],
                columns: [params.column],
                force: true,
              });
              return true;
            }
            return false;
          },
          flex: 1,
        },
        {
          field: "unidadeRemetente",
          headerName: "Unidade Remetente",
          editable: true,
          cellEditor: "agSelectCellEditor",
          cellEditorParams: {
            values: unidadesOptions,
          },
          valueGetter: (params: any) => {
            if (params.data?._isDetail) return "";
            const processo = params.data as IProcesso;
            if (processo.unidadeRemetente) {
              return `${processo.unidadeRemetente.sigla} - ${processo.unidadeRemetente.nome}`;
            }
            return "";
          },
          valueFormatter: (params: any) => params.value || "",
          valueSetter: (params: ValueSetterParams) => {
            const selected = params.newValue as string;
            const sigla = selected?.split(" - ")[0];
            const unidade = unidades.find((u) => u.sigla === sigla);
            if (unidade) {
              params.data.unidadeRemetente = unidade;
              return true;
            }
            return false;
          },
          flex: 1,
        },
        {
          field: "origem",
          headerName: "Origem",
          editable: true,
          flex: 1,
        },
        {
          field: "data_recebimento",
          headerName: "Data Recebimento",
          editable: true,
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(new Date(params.value), "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          flex: 1,
        },
        {
          field: "prazo",
          headerName: "Prazo",
          editable: true,
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(new Date(params.value), "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          cellStyle: (params: any) => {
            if (!params.value)
              return { backgroundColor: "transparent", color: "inherit" };
            const prazo = new Date(params.value);
            const hoje = new Date();
            const diffDays = Math.ceil(
              (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays < 0) {
              return { backgroundColor: "#fee", color: "#c00" };
            } else if (diffDays === 0) {
              return { backgroundColor: "#ffc", color: "#880" };
            } else if (diffDays <= 3) {
              return { backgroundColor: "#ffe", color: "#990" };
            }
            return { backgroundColor: "transparent", color: "inherit" };
          },
          flex: 1,
        },
      ] as ColDef[],
    [unidadesOptions, unidades, interessadosOptions, interessados, expandedRows]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      editable: (params) => !params.data?._isDetail,
    }),
    []
  );

  const onCellValueChanged = useCallback(
    async (event: CellValueChangedEvent) => {
      if (!session?.access_token) return;

      const processoAtualizado = event.data as IProcesso;
      const field = event.colDef.field;
      const oldValue = event.oldValue;

      // Verificar conflito de versão (optimistic locking)
      const lastKnownVersion = versionsRef.current.get(processoAtualizado.id);
      const currentVersion = new Date(processoAtualizado.atualizadoEm);

      if (
        lastKnownVersion &&
        currentVersion.getTime() !== lastKnownVersion.getTime()
      ) {
        toast.error("Conflito detectado", {
          description:
            "Este processo foi modificado por outro usuário. Recarregue a página para ver as alterações mais recentes.",
        });
        event.node.setDataValue(field as string, oldValue);
        return;
      }

      try {
        const dataToUpdate: any = {};

        // Mapear campos para os nomes corretos do backend
        if (field === "interessado") {
          const interessadoId = processoAtualizado.interessado_id;
          // Enviar apenas interessado_id
          dataToUpdate.interessado_id = interessadoId;
        } else if (field === "unidadeRemetente") {
          dataToUpdate.unidade_remetente_id =
            processoAtualizado.unidadeRemetente?.id;
        } else if (field === "data_recebimento" || field === "prazo") {
          dataToUpdate[field] = new Date(event.newValue).toISOString();
        } else {
          dataToUpdate[field as string] = event.newValue;
        }

        const response = await processo.server.atualizar(
          processoAtualizado.id,
          dataToUpdate
        );

        if (!response.ok) {
          // Rollback em caso de erro
          event.node.setDataValue(field as string, oldValue);
          toast.error("Erro ao atualizar processo", {
            description: response.error,
          });
        } else {
          // Atualizar versão após sucesso
          if (response.data) {
            const updatedProcesso = response.data as IProcesso;
            versionsRef.current.set(
              processoAtualizado.id,
              new Date(updatedProcesso.atualizadoEm)
            );

            // Se salvou interessado_id, manter o valor interessado localmente
            if (field === "interessado" && processoAtualizado.interessado) {
              event.node.setData({
                ...processoAtualizado,
                atualizadoEm: updatedProcesso.atualizadoEm,
                interessado: processoAtualizado.interessado,
                interessado_id: processoAtualizado.interessado_id,
              });
            }
          }

          toast.success("Processo atualizado", {
            description: "As alterações foram salvas automaticamente",
          });
          // Não fazer refresh imediato para não perder o valor do campo
          // router.refresh();
        }
      } catch (error) {
        // Rollback em caso de erro
        event.node.setDataValue(field as string, oldValue);
        toast.error("Erro ao atualizar processo", {
          description: "Erro ao se comunicar com o servidor",
        });
      }
    },
    [session?.access_token, router]
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    // Grid pronto
  }, []);

  const isFullWidthRow = useCallback((params: any) => {
    if (!params || !params.rowNode || !params.rowNode.data) {
      return false;
    }
    return params.rowNode.data._isDetail === true;
  }, []);

  const fullWidthCellRenderer = useCallback((params: ICellRendererParams) => {
    const data = params.node?.data || params.data;

    if (!data?._processo) {
      return (
        <div
          className="p-4 text-red-500"
          style={{
            backgroundColor: "#ffebee",
            minHeight: "100px",
            width: "100%",
          }}
        >
          <strong>Erro ao carregar andamentos</strong>
        </div>
      );
    }

    // Wrapper para garantir largura completa e evitar renderização múltipla
    return (
      <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
        <AndamentosDetail
          key={data._processo.id}
          processo={data._processo as IProcesso}
        />
      </div>
    );
  }, []);

  const getRowHeight = useCallback((params: any) => {
    const data = params.node?.data || params.data;
    if (data?._isDetail) {
      return 300;
    }
    return 42;
  }, []);

  const getRowId = useCallback((params: any) => {
    return params.data.id;
  }, []);

  return (
    <div className="w-full">
      <div
        className="ag-theme-alpine w-full"
        style={
          {
            height: 600,
            width: "100%",
            "--ag-header-background-color": "#f8f9fa",
            "--ag-header-foreground-color": "#212529",
            "--ag-odd-row-background-color": "#ffffff",
            "--ag-row-hover-color": "#f1f3f5",
            "--ag-border-color": "#dee2e6",
            fontSize: "14px",
          } as React.CSSProperties
        }
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          onGridReady={onGridReady}
          getRowId={getRowId}
          animateRows={true}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          pagination={false}
          suppressPaginationPanel={true}
          rowBuffer={10}
          debounceVerticalScrollbar={true}
          theme="legacy"
          // Configurações para linhas expansíveis (Full Width Rows)
          isFullWidthRow={isFullWidthRow}
          fullWidthCellRenderer={fullWidthCellRenderer}
          getRowHeight={getRowHeight}
          suppressCellFocus={true}
        />
      </div>
    </div>
  );
}
