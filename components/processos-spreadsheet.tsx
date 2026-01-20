/** @format */

"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useTheme } from "next-themes";
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
import { IProcesso, IAndamento, StatusAndamento } from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import { IInteressado } from "@/types/interessado";
import * as processo from "@/services/processos";
import * as andamento from "@/services/andamentos";
import * as interessado from "@/services/interessados";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import DateCellEditor from "@/components/date-cell-editor";
import ModalDeleteProcesso from "@/app/(rotas-auth)/processos/_components/modal-delete-processo";
import ModalDeleteAndamento from "@/app/(rotas-auth)/processos/_components/modal-delete-andamento";
import InteressadoAutocompleteCellEditor from "@/components/interessado-autocomplete-cell-editor";

// Registrar todos os módulos da comunidade AG-Grid
ModuleRegistry.registerModules([AllCommunityModule]);

// Componente para mostrar andamentos como detalhe expansível
function AndamentosDetail({
  processo,
  unidades,
}: {
  processo: IProcesso;
  unidades: IUnidade[];
}) {
  const { data: session } = useSession();
  const { theme, systemTheme } = useTheme();
  const [andamentos, setAndamentos] = useState<IAndamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const router = useRouter();
  const savingRef = useRef<Set<string>>(new Set()); // Prevenir salvamentos duplicados

  useEffect(() => {
    async function loadAndamentos() {
      if (!session?.access_token || !processo.id || loaded) return;

      setLoading(true);
      try {
        const response = await andamento.query.buscarPorProcesso(
          session.access_token,
          processo.id,
        );
        if (response.ok && response.data) {
          // Não precisa converter - valueGetter das colunas fará isso
          setAndamentos(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        // Erro ao carregar andamentos
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }

    loadAndamentos();
  }, [processo.id, session?.access_token, loaded, unidades]);

  const adicionarAndamento = () => {
    const novoAndamento: any = {
      id: `temp-${Date.now()}`,
      processo_id: processo.id,
      origem: "",
      destino: "",
      data_envio: new Date().toISOString(),
      prazo: null,
      status: "EM_ANDAMENTO",
      data_resposta: null,
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
      const saveKey = `${andamentoAtualizado.id}-${event.colDef.field}`;

      // Verificar se o valor realmente mudou
      if (event.oldValue === event.newValue) {
        return;
      }

      // IMPORTANTE: Ignorar mudanças onde newValue está vazio mas oldValue tinha valor
      // Isso acontece durante Fast Refresh quando o AG-Grid re-renderiza
      // Se vem de um valor válido (como 'CPU - ...') para vazio, é um artefato de renderização
      if (
        !event.newValue &&
        event.oldValue &&
        typeof event.oldValue === "string" &&
        event.oldValue.trim() !== ""
      ) {
        // Não fazer nada - apenas ignorar este evento falso
        return;
      }

      // Prevenir múltiplas requisições simultâneas do mesmo andamento
      if (savingRef.current.has(andamentoAtualizado.id)) {
        return;
      }

      // Prevenir múltiplas requisições simultâneas do mesmo campo
      if (savingRef.current.has(saveKey)) {
        return;
      }

      // Validar campos obrigatórios antes de salvar no backend
      // Campos obrigatórios: origem, destino, data_envio, status
      // Prazo é OPCIONAL
      // IMPORTANTE: usar newValue do evento, pois valueSetter é chamado DEPOIS de onCellValueChanged
      const field = event.colDef.field as string;
      const camposObrigatorios = {
        origem:
          field === "origem" ? event.newValue : andamentoAtualizado.origem,
        destino:
          field === "destino" ? event.newValue : andamentoAtualizado.destino,
        data_envio:
          field === "data_envio"
            ? event.newValue
            : andamentoAtualizado.data_envio,
        status:
          field === "status" ? event.newValue : andamentoAtualizado.status,
      };

      const camposFaltando = Object.entries(camposObrigatorios)
        .filter(([, valor]) => {
          if (!valor) return true;
          if (typeof valor === "string" && valor.trim() === "") return true;
          return false;
        })
        .map(([campo]) => campo);

      if (camposFaltando.length > 0) {
        // Valor foi salvo no grid, apenas não enviamos ao backend ainda
        return;
      }

      // Marcar como salvando - ambos o andamento e o campo específico
      savingRef.current.add(andamentoAtualizado.id);
      savingRef.current.add(saveKey);

      try {
        const dataToSave: any = {
          processo_id: processo.id,
          // Usar event.newValue para campos que foram alterados, do objeto para os outros
          origem:
            field === "origem" ? event.newValue : andamentoAtualizado.origem,
          destino:
            field === "destino" ? event.newValue : andamentoAtualizado.destino,
          data_envio:
            field === "data_envio"
              ? event.newValue
              : andamentoAtualizado.data_envio,
          prazo: field === "prazo" ? event.newValue : andamentoAtualizado.prazo,
          status:
            field === "status" ? event.newValue : andamentoAtualizado.status,
          resposta:
            field === "data_resposta"
              ? event.newValue
              : andamentoAtualizado.data_resposta,
          observacao:
            field === "observacao"
              ? event.newValue
              : andamentoAtualizado.observacao,
        };

        // Converter campos de data para ISO
        const convertDateField = (value: any) => {
          if (value === null || value === undefined || value === "")
            return null;
          if (typeof value === "string" && value.includes("T")) {
            // Já é ISO, retornar como está
            return value;
          }
          if (typeof value === "string" && value.includes("-")) {
            // Formato YYYY-MM-DD, adicionar T00:00:00
            return new Date(value + "T00:00:00").toISOString();
          }
          return new Date(value).toISOString();
        };

        // Converter datas para ISO
        if (dataToSave.data_envio)
          dataToSave.data_envio = convertDateField(dataToSave.data_envio);
        if (dataToSave.prazo)
          dataToSave.prazo = convertDateField(dataToSave.prazo);
        if (dataToSave.resposta)
          dataToSave.resposta = convertDateField(dataToSave.resposta);

        // IMPORTANTE: Remover campos null/undefined do payload
        // Alguns backends rejeitam null, então é melhor não enviar o campo
        Object.keys(dataToSave).forEach((key) => {
          if (dataToSave[key] === null || dataToSave[key] === undefined) {
            delete dataToSave[key];
          }
        });

        let response: any;
        if (isNew) {
          response = await andamento.server.criar(dataToSave);
          const errorMessage = Array.isArray(response.error)
            ? response.error.join(", ")
            : response.error;
          if (response.ok && response.data) {
            // IMPORTANTE: Manter os dados que enviamos se a resposta não os incluir
            // Isso previne perder dados quando o servidor não retorna o objeto completo
            const responseData = {
              ...response.data,
              // Garantir que origem e destino não sejam perdidos
              origem: response.data.origem || dataToSave.origem,
              destino: response.data.destino || dataToSave.destino,
            };
            // Atualizar com o ID real do servidor
            const updatedAndamentos = andamentos.map((a) =>
              (a as any).id === andamentoAtualizado.id ? responseData : a,
            );
            setAndamentos(updatedAndamentos as IAndamento[]);
            toast.success("Andamento criado com sucesso");
          }
        } else {
          response = await andamento.server.atualizar(
            andamentoAtualizado.id,
            dataToSave,
          );
          if (response.ok) {
            toast.success("Andamento atualizado com sucesso");
          }
        }

        if (!response.ok) {
          const errorMessage = Array.isArray(response.error)
            ? response.error.join(", ")
            : response.error;
          toast.error("Erro ao salvar andamento", {
            description: errorMessage,
          });
          // NÃO chamar setDataValue - isso causa outro onCellValueChanged
          // event.node.setDataValue(event.colDef.field as string, event.oldValue);
        }
      } catch (error) {
        toast.error("Erro ao salvar andamento");
        // NÃO chamar setDataValue - isso causa outro onCellValueChanged
        // event.node.setDataValue(event.colDef.field as string, event.oldValue);
      } finally {
        // Remover da lista de salvamento
        savingRef.current.delete(saveKey);
        savingRef.current.delete(andamentoAtualizado.id);
      }
    },
    [session?.access_token, processo.id, andamentos],
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "origem",
        headerName: "Origem",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: unidades.map((u) => `${u.sigla} - ${u.nome}`),
        },
        valueSetter: (params) => {
          params.data.origem = params.newValue;
          return true;
        },
        width: 200,
      },
      {
        field: "destino",
        headerName: "Destino",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: unidades.map((u) => `${u.sigla} - ${u.nome}`),
        },
        valueSetter: (params) => {
          params.data.destino = params.newValue;
          return true;
        },
        width: 200,
      },
      {
        field: "data_envio",
        headerName: "Data Envio",
        editable: true,
        cellEditor: DateCellEditor,
        valueGetter: (params) => {
          if (!params.data?.data_envio) return null;
          return new Date(params.data.data_envio);
        },
        valueSetter: (params) => {
          params.data.data_envio = params.newValue
            ? params.newValue.toISOString()
            : null;
          return true;
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(params.value, "dd/MM/yyyy", { locale: ptBR });
        },
        width: 130,
      },
      {
        field: "prazo",
        headerName: "Prazo",
        editable: true,
        cellEditor: DateCellEditor,
        valueGetter: (params) => {
          if (!params.data?.prazo) return null;
          return new Date(params.data.prazo);
        },
        valueSetter: (params) => {
          params.data.prazo = params.newValue
            ? params.newValue.toISOString()
            : null;
          return true;
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(params.value, "dd/MM/yyyy", { locale: ptBR });
        },
        cellStyle: (params: any) => {
          const andamento = params.data as IAndamento;
          // Se concluído, colorir de verde
          if (andamento.status === StatusAndamento.CONCLUIDO) {
            return { backgroundColor: "#dcfce7", color: "#15803d" };
          }

          if (!params.value)
            return { backgroundColor: "transparent", color: "inherit" };

          const prazo = new Date(params.value);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          prazo.setHours(0, 0, 0, 0);

          const diffDays = Math.ceil(
            (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (diffDays < 0) {
            // Vencido - Vermelho
            return { backgroundColor: "#fee", color: "#c00" };
          } else if (diffDays === 0) {
            // Vence hoje - Laranja
            return { backgroundColor: "#ffebcc", color: "#cc6600" };
          } else if (diffDays === 1) {
            // Vence amanhã - Amarelo
            return { backgroundColor: "#ffc", color: "#880" };
          }
          return { backgroundColor: "transparent", color: "inherit" };
        },
        width: 130,
      },
      {
        field: "status",
        headerName: "Status",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["EM_ANDAMENTO", "CONCLUIDO", "PENDENTE", "CANCELADO"],
        },
        width: 150,
      },
      {
        field: "data_resposta",
        headerName: "Data Resposta",
        editable: true,
        cellEditor: DateCellEditor,
        valueGetter: (params) => {
          if (!params.data?.data_resposta) return null;
          return new Date(params.data.data_resposta);
        },
        valueSetter: (params) => {
          params.data.data_resposta = params.newValue
            ? params.newValue.toISOString()
            : null;
          return true;
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(params.value, "dd/MM/yyyy", { locale: ptBR });
        },
        width: 150,
      },
      {
        field: "observacao",
        headerName: "Observação",
        editable: true,
        width: 250,
        wrapText: true,
        autoHeight: true,
      },
      {
        headerName: "Ações",
        field: "acoes",
        width: 80,
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (params: ICellRendererParams) => {
          const andamentoData = params.data as IAndamento;

          const handleSuccess = () => {
            const updatedAndamentos = andamentos.filter(
              (a) => a.id !== andamentoData.id,
            );
            setAndamentos(updatedAndamentos);
          };

          return (
            <div className="flex items-center justify-center h-full">
              <ModalDeleteAndamento
                andamento={andamentoData}
                onSuccess={handleSuccess}
              />
            </div>
          );
        },
      },
    ],
    [unidades, andamentos],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
    }),
    [],
  );

  // Calcular altura dinâmica baseada no número de andamentos
  const gridHeight = useMemo(() => {
    const minHeight = 300; // Altura mínima
    const maxHeight = 800; // Altura máxima
    const rowHeight = 50; // Altura aproximada de cada linha
    const headerHeight = 56; // Altura do header

    const calculatedHeight = headerHeight + andamentos.length * rowHeight;

    // Se tiver poucos andamentos, usar altura mínima
    // Se tiver muitos, usar altura máxima com scroll
    return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
  }, [andamentos.length]);

  return (
    <div
      className={`p-6 bg-gradient-to-r ${
        theme === "dark" || (theme === "system" && systemTheme === "dark")
          ? "from-gray-900 to-gray-800"
          : "from-gray-50 to-gray-100"
      }`}
      style={{ width: "100%", minHeight: "200px" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`text-lg font-semibold ${
            theme === "dark" || (theme === "system" && systemTheme === "dark")
              ? "text-gray-200"
              : "text-gray-700"
          }`}
        >
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

      <div
        className={`ag-theme-alpine ${
          theme === "dark" || (theme === "system" && systemTheme === "dark")
            ? "dark"
            : ""
        }`}
        style={
          {
            height: `${gridHeight}px`,
            width: "100%",
            ...(theme === "dark" ||
            (theme === "system" && systemTheme === "dark")
              ? {
                  "--ag-background-color": "#1a1a1a",
                  "--ag-header-background-color": "#262626",
                  "--ag-header-foreground-color": "#e5e7eb",
                  "--ag-odd-row-background-color": "#1a1a1a",
                  "--ag-row-hover-color": "#2d2d2d",
                  "--ag-border-color": "#404040",
                  "--ag-foreground-color": "#e5e7eb",
                  "--ag-secondary-foreground-color": "#a3a3a3",
                  "--ag-cell-horizontal-padding": "12px",
                }
              : {}),
          } as React.CSSProperties
        }
      >
        <AgGridReact
          ref={gridRef}
          rowData={andamentos}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          suppressHorizontalScroll={false}
          alwaysShowVerticalScroll={true}
          theme="legacy"
          overlayNoRowsTemplate="Nenhum andamento cadastrado"
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
  const { theme, systemTheme } = useTheme();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [processosLocal, setProcessosLocal] = useState<IProcesso[]>(processos);

  // Mapa de versões para controle de conflito
  const versionsRef = useRef<Map<string, Date>>(new Map());

  // Atualizar processos locais quando props mudar
  useEffect(() => {
    setProcessosLocal(processos);
  }, [processos]);

  // Criar dados da linha incluindo linhas de detalhe
  const rowData = useMemo(() => {
    const rows: any[] = [];
    processosLocal.forEach((processo) => {
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
  }, [processosLocal, expandedRows]);

  useEffect(() => {
    // Inicializa versões
    processosLocal.forEach((p) => {
      if (!(p as any)._isNew) {
        versionsRef.current.set(p.id, new Date(p.atualizadoEm));
      }
    });
  }, [processosLocal]);

  const unidadesOptions = useMemo(
    () => unidades.map((u) => `${u.sigla} - ${u.nome}`),
    [unidades],
  );

  const interessadosOptions = useMemo(
    () => interessados.map((i) => i.valor),
    [interessados],
  );

  const adicionarProcesso = () => {
    const novoProcesso: any = {
      id: `temp-${Date.now()}`,
      numero_sei: "",
      assunto: "",
      interessado: "",
      interessado_id: "",
      origem: "",
      data_recebimento: new Date().toISOString().split("T")[0],
      prazo: "",
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      _isNew: true,
    };
    setProcessosLocal([...processosLocal, novoProcesso]);
  };

  const columnDefs = useMemo(
    () =>
      [
        {
          headerName: "",
          field: "expand",
          width: 50,
          pinned: "left" as const,
          headerComponent: () => {
            const allExpanded = expandedRows.size === processosLocal.length;

            return (
              <button
                onClick={() => {
                  if (allExpanded) {
                    setExpandedRows(new Set());
                  } else {
                    const allIds = new Set(processosLocal.map((p) => p.id));
                    setExpandedRows(allIds);
                  }
                }}
                className="flex items-center justify-center w-full h-full hover:bg-gray-100 transition-colors"
                title={allExpanded ? "Colapsar tudo" : "Expandir tudo"}
              >
                {allExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            );
          },
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
          cellEditor: InteressadoAutocompleteCellEditor,
          cellEditorParams: {
            interessados: interessados,
            onSave: (valor: string, id: string) => {
              // Este callback será chamado pelo editor
              return { valor, id };
            },
          },
          valueGetter: (params: any) => {
            if (params.data?._isDetail) return "";
            const processo = params.data as IProcesso;
            return processo.interessado || "";
          },
          valueFormatter: (params: any) => {
            const value = params.value || "";
            return value.toUpperCase();
          },
          valueSetter: (params: ValueSetterParams) => {
            // O novo valor vem do autocomplete
            const newValue = params.newValue as string;

            // Tentar encontrar o interessado nos existentes
            let interessadoObj = interessados.find((i) => i.valor === newValue);

            // Se não encontrou, criar um novo (será persistido no backend)
            if (!interessadoObj && newValue.trim()) {
              // Para novo interessado digitado, usamos um ID temporário
              // O backend será responsável de criar e retornar o ID real
              interessadoObj = {
                id: `temp-${Date.now()}`,
                valor: newValue,
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
              };
            }

            if (interessadoObj && params.node) {
              params.data.interessado = interessadoObj.valor;
              params.data.interessado_id = interessadoObj.id;
              params.data._interessadoChanged = true;

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
          cellEditor: DateCellEditor,
          valueGetter: (params: any) => {
            if (!params.data?.data_recebimento) return null;
            return new Date(params.data.data_recebimento);
          },
          valueSetter: (params: any) => {
            params.data.data_recebimento = params.newValue
              ? params.newValue.toISOString()
              : null;
            return true;
          },
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(params.value, "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          flex: 1,
        },
        {
          field: "prazo",
          headerName: "Prazo",
          editable: true,
          cellEditor: DateCellEditor,
          valueGetter: (params: any) => {
            if (!params.data?.prazo) return null;
            return new Date(params.data.prazo);
          },
          valueSetter: (params: any) => {
            params.data.prazo = params.newValue
              ? params.newValue.toISOString()
              : null;
            return true;
          },
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(params.value, "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          cellStyle: (params: any) => {
            const processo = params.data as IProcesso;
            // Se concluído, não colorir
            if (isProcessoConcluido(processo)) {
              return { backgroundColor: "transparent", color: "inherit" };
            }

            if (!params.value)
              return { backgroundColor: "transparent", color: "inherit" };
            const prazo = new Date(params.value);
            const hoje = new Date();
            const diffDays = Math.ceil(
              (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
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
        {
          field: "data_resposta_final",
          headerName: "Data Resposta Final",
          editable: true,
          cellEditor: DateCellEditor,
          valueGetter: (params: any) => {
            if (!params.data?.data_resposta_final) return null;
            return new Date(params.data.data_resposta_final);
          },
          valueSetter: (params: any) => {
            params.data.data_resposta_final = params.newValue
              ? params.newValue.toISOString()
              : null;
            return true;
          },
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(params.value, "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          flex: 1,
        },
        {
          field: "resposta_final",
          headerName: "Resposta Final",
          editable: true,
          flex: 2,
          wrapText: true,
          autoHeight: true,
        },
        {
          headerName: "Ações",
          field: "acoes",
          width: 80,
          pinned: "right" as const,
          sortable: false,
          filter: false,
          editable: false,
          cellRenderer: (params: ICellRendererParams) => {
            if (params.data?._isDetail) return null;

            const processo = params.data as IProcesso;

            return (
              <div className="flex items-center justify-center h-full">
                <ModalDeleteProcesso id={processo.id} />
              </div>
            );
          },
        },
      ] as ColDef[],
    [
      unidadesOptions,
      unidades,
      interessadosOptions,
      interessados,
      expandedRows,
    ],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      editable: (params) => !params.data?._isDetail,
    }),
    [],
  );

  const onCellValueChanged = useCallback(
    async (event: CellValueChangedEvent) => {
      if (!session?.access_token) return;

      const processoAtualizado = event.data as IProcesso;
      const field = event.colDef.field as string;
      const oldValue = event.oldValue;
      const newValue = event.newValue;
      const isNew = (processoAtualizado as any)._isNew;

      // Verificar se houve alteração real
      if (oldValue === newValue && !isNew) return;

      // Se for novo processo, criar
      if (isNew) {
        // Validar campos obrigatórios antes de tentar criar
        if (
          !processoAtualizado.numero_sei ||
          !processoAtualizado.assunto ||
          !processoAtualizado.origem
        ) {
          // Ainda faltam campos obrigatórios, apenas atualizar localmente
          return;
        }

        try {
          // Helper para converter data
          const convertDateField = (value: any) => {
            if (!value) return undefined;
            if (typeof value === "string" && value.includes("-")) {
              // Se está no formato YYYY-MM-DD, converter para ISO completo
              return new Date(value + "T00:00:00").toISOString();
            }
            return new Date(value).toISOString();
          };

          // Se tem um interessado com ID temporário, criar primeiro
          let interessadoIdFinal = processoAtualizado.interessado_id;
          if (
            interessadoIdFinal &&
            interessadoIdFinal.startsWith("temp-") &&
            processoAtualizado.interessado
          ) {
            try {
              const novoInteressado = {
                valor: processoAtualizado.interessado,
              };
              const respostaInteressado =
                await interessado.server.criar(novoInteressado);
              if (respostaInteressado.ok && respostaInteressado.data) {
                interessadoIdFinal = respostaInteressado.data.id;
                toast.success("Novo interessado criado");
              } else {
                toast.error("Erro ao criar interessado", {
                  description: respostaInteressado.error,
                });
                return;
              }
            } catch (error) {
              toast.error("Erro ao criar interessado");
              return;
            }
          }

          const dataToCreate: any = {
            numero_sei: processoAtualizado.numero_sei,
            assunto: processoAtualizado.assunto,
            origem: processoAtualizado.origem,
            data_recebimento:
              convertDateField(processoAtualizado.data_recebimento) ||
              new Date().toISOString(),
          };

          if (interessadoIdFinal) {
            dataToCreate.interessado_id = interessadoIdFinal;
          }
          if (processoAtualizado.unidadeRemetente?.id) {
            dataToCreate.unidade_remetente_id =
              processoAtualizado.unidadeRemetente.id;
          }
          if (processoAtualizado.prazo) {
            dataToCreate.prazo = convertDateField(processoAtualizado.prazo);
          }

          const response = await processo.server.criar(dataToCreate);

          if (response.ok && response.data) {
            // Atualizar com o processo real do servidor
            const createdProcesso = response.data as IProcesso;
            const updatedProcessos = processosLocal.map((p) =>
              p.id === processoAtualizado.id ? createdProcesso : p,
            );
            setProcessosLocal(updatedProcessos);
            versionsRef.current.set(
              createdProcesso.id,
              new Date(createdProcesso.atualizadoEm),
            );
            toast.success("Processo criado com sucesso");
            router.refresh();
          } else {
            toast.error("Erro ao criar processo", {
              description: response.error,
            });
            event.node.setDataValue(field as string, oldValue);
          }
          return;
        } catch (error) {
          toast.error("Erro ao criar processo");
          event.node.setDataValue(field as string, oldValue);
          return;
        }
      }

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
        // Validar campos obrigatórios antes de atualizar
        if (
          !processoAtualizado.numero_sei ||
          !processoAtualizado.assunto ||
          !processoAtualizado.origem
        ) {
          // Não salvar se campos obrigatórios estiverem faltando
          return;
        }

        const dataToUpdate: any = {};

        // Helper para converter data
        const convertDateField = (value: any) => {
          if (!value) return null;
          if (typeof value === "string" && value.includes("T")) {
            // Já é ISO string
            return value;
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          return new Date(value).toISOString();
        };

        // Mapear campos para os nomes corretos do backend
        if (field === "interessado") {
          let interessadoId = processoAtualizado.interessado_id;

          // Se o ID começa com 'temp-', significa que é um novo interessado
          // Precisa ser criado no backend
          if (interessadoId && interessadoId.startsWith("temp-")) {
            try {
              const novoInteressado = {
                valor: processoAtualizado.interessado,
              };

              const respostaInteressado =
                await interessado.server.criar(novoInteressado);

              if (respostaInteressado.ok && respostaInteressado.data) {
                // Usar o ID real do interessado criado
                interessadoId = respostaInteressado.data.id;
                // Atualizar no estado local também
                processoAtualizado.interessado_id = interessadoId;
                toast.success("Novo interessado criado");
              } else {
                toast.error("Erro ao criar interessado", {
                  description: respostaInteressado.error,
                });
                return;
              }
            } catch (error) {
              toast.error("Erro ao criar interessado");
              return;
            }
          }

          // Enviar apenas interessado_id
          dataToUpdate.interessado_id = interessadoId;
        } else if (field === "unidadeRemetente") {
          dataToUpdate.unidade_remetente_id =
            processoAtualizado.unidadeRemetente?.id;
        } else if (
          field === "data_recebimento" ||
          field === "prazo" ||
          field === "data_resposta_final"
        ) {
          dataToUpdate[field] = newValue ? convertDateField(newValue) : null;
        } else if (field === "resposta_final") {
          dataToUpdate[field] = newValue || null;
        } else {
          dataToUpdate[field as string] = newValue;
        }

        const response = await processo.server.atualizar(
          processoAtualizado.id,
          dataToUpdate,
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
              new Date(updatedProcesso.atualizadoEm),
            );

            // Se salvou data_resposta_final, marcar todos os andamentos como CONCLUIDO
            if (field === "data_resposta_final" && newValue) {
              try {
                // Buscar andamentos do processo
                if (session?.access_token) {
                  const andamentosResponse =
                    await andamento.query.buscarPorProcesso(
                      session.access_token,
                      processoAtualizado.id,
                    );

                  if (
                    andamentosResponse.ok &&
                    andamentosResponse.data &&
                    Array.isArray(andamentosResponse.data)
                  ) {
                    // Atualizar cada andamento para status CONCLUIDO
                    const andamentosArray =
                      andamentosResponse.data as IAndamento[];
                    for (const anda of andamentosArray) {
                      if (anda.status !== "CONCLUIDO") {
                        await andamento.server.atualizar(anda.id, {
                          status: StatusAndamento.CONCLUIDO,
                        });
                      }
                    }
                    toast.success(
                      "Andamentos do processo marcados como concluídos",
                    );
                  }
                }
              } catch (error) {
                // Erro ao atualizar andamentos
              }
            }

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
        }
      } catch (error) {
        // Rollback em caso de erro
        event.node.setDataValue(field as string, oldValue);
        toast.error("Erro ao atualizar processo", {
          description: "Erro ao se comunicar com o servidor",
        });
      }
    },
    [session?.access_token, router, processosLocal],
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    // Grid pronto
  }, []);

  const isProcessoConcluido = useCallback((processo: IProcesso) => {
    // Um processo é concluído se tem data_resposta_final ou resposta_final
    return !!processo.data_resposta_final || !!processo.resposta_final;
  }, []);

  const getRowStyle = useCallback(
    (params: any) => {
      if (!params.data || params.data._isDetail) {
        return undefined;
      }
      const processo = params.data as IProcesso;
      if (isProcessoConcluido(processo)) {
        return {
          backgroundColor: "#dcfce7",
          color: "#15803d",
        };
      }
      return undefined;
    },
    [isProcessoConcluido],
  );

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

    // Wrapper para garantir largura completa e permitir scroll
    return (
      <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
        <AndamentosDetail
          key={data._processo.id}
          processo={data._processo as IProcesso}
          unidades={unidades}
        />
      </div>
    );
  }, []);

  const getRowHeight = useCallback((params: any) => {
    const data = params.node?.data || params.data;
    if (data?._isDetail) {
      // Altura dinâmica baseada no número de andamentos
      const andamentosCount = data._processo?.andamentos?.length || 0;
      const minHeight = 450; // Altura mínima para cabeçalho + tabela vazia
      const rowHeight = 45; // Altura de cada linha
      const headerHeight = 80; // Altura do cabeçalho
      const calculatedHeight = headerHeight + andamentosCount * rowHeight;
      return Math.max(calculatedHeight, minHeight);
    }
    return 42;
  }, []);

  const getRowId = useCallback((params: any) => {
    return params.data.id;
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button
          onClick={adicionarProcesso}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          + Novo Processo
        </Button>
      </div>
      <div
        className={`ag-theme-alpine w-full ${
          theme === "dark" || (theme === "system" && systemTheme === "dark")
            ? "dark"
            : ""
        }`}
        style={
          {
            height: "calc(100vh - 200px)",
            width: "100%",
            ...(theme === "dark" ||
            (theme === "system" && systemTheme === "dark")
              ? {
                  "--ag-background-color": "#1a1a1a",
                  "--ag-header-background-color": "#262626",
                  "--ag-header-foreground-color": "#e5e7eb",
                  "--ag-odd-row-background-color": "#1a1a1a",
                  "--ag-row-hover-color": "#2d2d2d",
                  "--ag-border-color": "#404040",
                  "--ag-foreground-color": "#e5e7eb",
                  "--ag-secondary-foreground-color": "#a3a3a3",
                  "--ag-cell-horizontal-padding": "12px",
                }
              : {
                  "--ag-header-background-color": "#f8f9fa",
                  "--ag-header-foreground-color": "#212529",
                  "--ag-odd-row-background-color": "#ffffff",
                  "--ag-row-hover-color": "#f1f3f5",
                  "--ag-border-color": "#dee2e6",
                }),
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
          getRowStyle={getRowStyle}
          suppressCellFocus={true}
          overlayNoRowsTemplate="Nenhum processo cadastrado"
        />
      </div>
    </div>
  );
}
