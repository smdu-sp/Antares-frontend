/** @format */

"use client";

import { IUnidade } from "@/types/unidade";
import { ICellEditorComp } from "ag-grid-community";
import { criar as criarUnidade } from "@/services/unidades/server-functions/criar";
import {
  listarTodas as listarTodasUnidades,
  reativarUnidade,
} from "@/services/unidades/server-functions/listar-todas";

class UnidadeAutocompleteEditor implements ICellEditorComp {
  private eGui!: HTMLDivElement;
  private input!: HTMLInputElement;
  private listContainer!: HTMLDivElement;
  private unidades: IUnidade[] = [];
  private params: any;

  init(params: any) {
    this.params = params;
    // Buscar dados do context do AG-Grid em vez de params diretos
    this.unidades = params.context?.unidades || params.unidades || [];
    console.log(
      "UnidadeAutocompleteEditor init - unidades:",
      this.unidades,
      "from context:",
      params.context?.unidades,
    );

    this.eGui = document.createElement("div");
    this.eGui.style.position = "relative";
    this.eGui.style.width = "100%";
    this.eGui.style.height = "100%";

    // Input
    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.value = params.value || "";
    this.input.style.width = "100%";
    this.input.style.height = "100%";
    this.input.style.padding = "8px";
    this.input.style.boxSizing = "border-box";
    this.input.style.border = "none";
    this.input.style.outline = "2px solid #2563eb";
    this.input.style.fontSize = "14px";

    // Lista de sugestões - adicionar ao body para escapar do overflow da célula
    this.listContainer = document.createElement("div");
    this.listContainer.style.position = "fixed";
    this.listContainer.style.backgroundColor = "white";
    this.listContainer.style.border = "1px solid #ccc";
    this.listContainer.style.maxHeight = "250px";
    this.listContainer.style.overflowY = "auto";
    this.listContainer.style.zIndex = "10000";
    this.listContainer.style.display = "none";
    this.listContainer.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    this.listContainer.style.minWidth = "200px";
    this.listContainer.style.backgroundColor = "#ffffff";
    this.listContainer.style.borderRadius = "4px";
    // Adicionar um data attribute para identificar e limpar depois
    this.listContainer.setAttribute("data-unidade-list", "true");
    document.body.appendChild(this.listContainer);

    this.eGui.appendChild(this.input);

    // Event listeners
    this.input.addEventListener("input", () => this.onInputChange());
    this.input.addEventListener("focus", () => this.onFocus());
    this.input.addEventListener("blur", () => this.onBlur());
    this.input.addEventListener("keydown", (e) => this.onKeyDown(e));

    // Mostrar sugestões iniciais
    setTimeout(() => {
      this.input.focus();
      this.input.select();
      this.updateSuggestions();
    }, 0);
  }

  private onInputChange() {
    this.updateSuggestions();
  }

  private onFocus() {
    this.updateSuggestions();
  }

  private onBlur() {
    // Fechar lista após um pequeno delay para permitir clique
    setTimeout(() => {
      this.listContainer.style.display = "none";
    }, 200);
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      this.listContainer.style.display = "none";
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = this.listContainer.querySelector(
        "[data-selected='true']",
      ) as HTMLDivElement;
      if (selectedItem) {
        selectedItem.click();
      }
    }
  }

  private updateSuggestions() {
    const value = this.input.value.toLowerCase().trim();
    this.listContainer.innerHTML = "";
    console.log(
      "updateSuggestions - value:",
      value,
      "unidades count:",
      this.unidades.length,
    );

    // Calcular posição do input para posicionar fixed
    const rect = this.input.getBoundingClientRect();
    this.listContainer.style.top = `${rect.bottom}px`;
    this.listContainer.style.left = `${rect.left}px`;
    this.listContainer.style.width = `${rect.width}px`;

    // Filtrar unidades
    const filtered = this.unidades.filter((u) =>
      `${u.sigla} ${u.nome}`.toLowerCase().includes(value),
    );

    if (filtered.length > 0) {
      filtered.forEach((unidade, index) => {
        const item = document.createElement("div");
        item.textContent = `${unidade.sigla} - ${unidade.nome}`;
        item.style.padding = "10px";
        item.style.cursor = "pointer";
        item.style.borderBottom = "1px solid #eee";
        item.style.transition = "background-color 0.2s";
        item.style.fontSize = "14px";

        if (index === 0) {
          item.setAttribute("data-selected", "true");
          item.style.backgroundColor = "#f0f9ff";
        }

        item.addEventListener("mouseover", () => {
          // Remove data-selected de todos
          this.listContainer
            .querySelectorAll("[data-selected='true']")
            .forEach((el) => {
              el.removeAttribute("data-selected");
              (el as HTMLDivElement).style.backgroundColor = "transparent";
            });
          // Add ao atual
          item.setAttribute("data-selected", "true");
          item.style.backgroundColor = "#f0f9ff";
        });

        item.addEventListener("mousedown", (e) => {
          e.preventDefault(); // Previne que o input perca foco
          this.selectItem(unidade);
        });

        this.listContainer.appendChild(item);
      });

      this.listContainer.style.display = "block";
    } else if (value.trim().length > 0) {
      // Mostrar opção de criar novo
      const item = document.createElement("div");
      item.textContent = `Criar: "${value}"`;
      item.style.padding = "10px";
      item.style.cursor = "pointer";
      item.style.color = "#666";
      item.style.fontStyle = "italic";
      item.style.backgroundColor = "#f9fafb";
      item.setAttribute("data-selected", "true");

      item.addEventListener("mouseover", () => {
        item.style.backgroundColor = "#f0f9ff";
      });

      item.addEventListener("mouseout", () => {
        item.style.backgroundColor = "#f9fafb";
      });

      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        // Criar nova unidade
        this.criarNovaUnidade(value);
      });

      this.listContainer.appendChild(item);
      this.listContainer.style.display = "block";
    } else {
      // Mostrar placeholder
      const item = document.createElement("div");
      item.textContent = "Selecione uma unidade";
      item.style.padding = "10px";
      item.style.color = "#999";
      item.style.fontStyle = "italic";

      this.listContainer.appendChild(item);
      this.listContainer.style.display = "block";
    }
  }

  private selectItem(unidade: IUnidade) {
    this.input.value = `${unidade.sigla} - ${unidade.nome}`;
    this.listContainer.style.display = "none";
    // Finalizar a edição no AG-Grid para disparar onCellValueChanged
    if (this.params.stopEditing) {
      this.params.stopEditing();
    }
  }

  private async criarNovaUnidade(valor: string) {
    // Mostrar loading
    this.input.disabled = true;
    this.input.style.opacity = "0.6";

    try {
      // Tentar extrair sigla e nome a partir do input
      // Se o input for "ABC - Nome Completo", usa ABC como sigla
      // Se for apenas "Nome", usa os primeiros 3 caracteres como sigla
      let sigla = "";
      let nome = valor.trim();

      const partes = valor.split("-");
      if (partes.length === 2) {
        sigla = partes[0].trim().toUpperCase();
        nome = partes[1].trim();
      } else {
        // Se não tem "-", usar os primeiros 3 caracteres como sigla
        sigla = valor.substring(0, 3).toUpperCase();
      }

      // Validar se tem sigla e nome
      if (!sigla || sigla.length === 0 || !nome || nome.length === 0) {
        alert("Preencha corretamente: [SIGLA] - [NOME] ou apenas o nome");
        this.input.disabled = false;
        this.input.style.opacity = "1";
        return;
      }

      // Chamar server function para criar
      let resposta = await criarUnidade({
        sigla: sigla,
        nome: nome,
      });

      // Se erro de duplicata (409 Conflict ou mensagem de duplicata), tentar reativar
      const isDuplicata =
        resposta.status === 409 ||
        (resposta.error &&
          resposta.error.toLowerCase().includes("já existe")) ||
        (resposta.error && resposta.error.toLowerCase().includes("duplicat"));

      if (!resposta.ok && isDuplicata) {
        try {
          // Tentar reativar uma unidade inativa com mesmo nome/sigla
          resposta = await this.reativarUnidadeInativa(sigla, nome);
        } catch (error) {
          console.error("Erro ao reativar unidade:", error);
        }
      }

      if (resposta.ok && resposta.data) {
        // Unidade criada ou reativada com sucesso
        const novaUnidade = resposta.data as IUnidade;

        // Adicionar à lista local
        this.unidades.push(novaUnidade);

        // Usar o valor criado
        this.input.value = `${novaUnidade.sigla} - ${novaUnidade.nome}`;
        this.listContainer.style.display = "none";

        // Finalizar edição
        if (this.params.stopEditing) {
          this.params.stopEditing();
        }
      } else {
        alert(`Erro ao criar unidade: ${resposta.error}`);
      }
    } catch (error) {
      console.error("Erro ao criar unidade:", error);
      alert("Erro ao criar unidade. Tente novamente.");
    } finally {
      this.input.disabled = false;
      this.input.style.opacity = "1";
    }
  }

  private async reativarUnidadeInativa(sigla: string, nome: string) {
    try {
      // Buscar todas as unidades (incluindo inativas) via server action
      const todasUnidades = await listarTodasUnidades();

      // Procurar unidade inativa com mesma sigla ou nome
      const unidadeInativa = (todasUnidades as IUnidade[]).find(
        (u) =>
          u.ativo === false &&
          (u.sigla.toUpperCase() === sigla.toUpperCase() ||
            u.nome.toUpperCase() === nome.toUpperCase()),
      );

      if (unidadeInativa) {
        // Reativar a unidade
        const respostaAtualizar = await reativarUnidade(unidadeInativa.id, {
          nome: nome,
          sigla: sigla,
        });

        return respostaAtualizar;
      }

      // Se não encontrou inativa, retornar erro
      return {
        ok: false,
        error: "Unidade não encontrada",
        data: null,
        status: 404,
      };
    } catch (error) {
      console.error("Erro ao reativar unidade:", error);
      return {
        ok: false,
        error: "Erro ao reativar unidade",
        data: null,
        status: 500,
      };
    }
  }

  getGui() {
    return this.eGui;
  }

  getValue() {
    return this.input.value;
  }

  isPopup() {
    return false;
  }

  focusIn() {
    this.input.focus();
  }

  focusOut() {
    this.listContainer.style.display = "none";
  }

  destroy() {
    // Remover o listContainer do DOM quando o editor fechar
    if (this.listContainer && this.listContainer.parentNode) {
      this.listContainer.parentNode.removeChild(this.listContainer);
    }
  }

  isCancelAfterEnd?(): boolean {
    return false;
  }

  isCancelBeforeStart?(): boolean {
    return false;
  }
}

export default UnidadeAutocompleteEditor;
