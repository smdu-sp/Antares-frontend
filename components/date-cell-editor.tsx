/** @format */

import { ICellEditorComp, ICellEditorParams } from "ag-grid-community";

export default class DateCellEditor implements ICellEditorComp {
  value: Date | null = null;
  params!: ICellEditorParams;
  input!: HTMLInputElement;

  init(params: ICellEditorParams): void {
    this.params = params;
    this.value = params.value || null;
  }

  getGui(): HTMLElement {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.padding = "0";

    this.input = document.createElement("input");
    this.input.type = "date";
    this.input.style.width = "100%";
    this.input.style.height = "100%";
    this.input.style.padding = "0 8px";
    this.input.style.border = "none";
    this.input.style.outline = "none";
    this.input.style.fontFamily = "inherit";
    this.input.style.fontSize = "inherit";

    // Converter Date para formato YYYY-MM-DD
    if (this.value instanceof Date) {
      const year = this.value.getFullYear();
      const month = String(this.value.getMonth() + 1).padStart(2, "0");
      const day = String(this.value.getDate()).padStart(2, "0");
      this.input.value = `${year}-${month}-${day}`;
    }

    // Fechar editor quando selecionar a data
    this.input.addEventListener("change", () => {
      if (this.input.value) {
        // Parse da data considerando timezone local
        const [year, month, day] = this.input.value.split("-");
        this.value = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        );
      }
      this.params.stopEditing();
    });

    // Fechar editor ao perder o foco
    this.input.addEventListener("blur", () => {
      this.params.stopEditing();
    });

    container.appendChild(this.input);
    return container;
  }

  getValue(): any {
    if (this.input.value) {
      // Parse considerando timezone local
      const [year, month, day] = this.input.value.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  }

  isCancelBeforeStart(): boolean {
    return false;
  }

  isCancelAfterEnd(): boolean {
    return false;
  }

  isPopup(): boolean {
    return false;
  }

  focusIn(): void {
    this.input.focus();
  }

  focusOut(): void {
    // noop
  }
}
