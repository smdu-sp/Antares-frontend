/** @format */

export interface IGrupoDisponivel {
  id: string;
  nome: string;
  sigla?: string;
}

export interface IGrupoAtivo {
  id: string;
  nome: string;
  sigla?: string;
  permissaoEfetiva?: string;
  permissaoCoordenadoria?: string;
  membroAtivo?: {
    permissao?: string;
    permissaoCoordenadoria?: string;
  };
  gruposDisponiveis?: IGrupoDisponivel[];
}

export interface IRespostaGrupoAtivo<T> {
  ok: boolean;
  error: string | null;
  data: T | null;
  status: number;
}
