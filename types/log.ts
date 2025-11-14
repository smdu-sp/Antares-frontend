/** @format */

import { IUsuario } from './usuario';

export enum TipoAcao {
	PROCESSO_CRIADO = 'PROCESSO_CRIADO',
	PROCESSO_ATUALIZADO = 'PROCESSO_ATUALIZADO',
	PROCESSO_REMOVIDO = 'PROCESSO_REMOVIDO',
	ANDAMENTO_CRIADO = 'ANDAMENTO_CRIADO',
	ANDAMENTO_ATUALIZADO = 'ANDAMENTO_ATUALIZADO',
	ANDAMENTO_PRORROGADO = 'ANDAMENTO_PRORROGADO',
	ANDAMENTO_CONCLUIDO = 'ANDAMENTO_CONCLUIDO',
	ANDAMENTO_REMOVIDO = 'ANDAMENTO_REMOVIDO',
}

export interface ILog {
	id: string;
	tipoAcao: TipoAcao;
	descricao: string;
	entidadeTipo: string;
	entidadeId: string;
	dadosAntigos: string | null;
	dadosNovos: string | null;
	criadoEm: Date;
	usuario_id: string;
	usuario?: IUsuario;
}

export interface IPaginadoLog {
	data: ILog[];
	total: number;
	pagina: number;
	limite: number;
}

export interface IRespostaLog {
	ok: boolean;
	error: string | null;
	data: ILog | ILog[] | IPaginadoLog | null;
	status: number;
}

