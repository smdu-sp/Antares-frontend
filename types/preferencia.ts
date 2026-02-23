export interface IPreferencia {
  id: string;
  usuario_id: string;
  chave: string;
  valor: any; // JSON genérico
  criado_em: string;
  atualizado_em: string;
}

export interface CriarPreferenciaDTO {
  chave: string;
  valor: any;
}

export interface AtualizarPreferenciaDTO {
  valor: any;
}
