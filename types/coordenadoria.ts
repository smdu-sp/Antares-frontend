/** @format */

export interface ICoordenadoriaContexto {
  contextoAtivo?: string;
  contextoConfigurado?: string;
  coordenadoria: string;
  contexto: string;
}

export interface IOpcaoContexto {
  value: string;
  label: string;
}

export interface ICoordenadoriaConfiguracao {
  tela: string;
  contexto: string;
  habilitado?: boolean;
  [key: string]: unknown;
}

export interface ICoordenadoriaApiResponse<T> {
  ok: boolean;
  error: string | null;
  data: T | null;
  status: number;
}
