/** @format */

export enum StatusAndamento {
	EM_ANDAMENTO = 'EM_ANDAMENTO',
	CONCLUIDO = 'CONCLUIDO',
	PRORROGADO = 'PRORROGADO',
}

export interface IAndamento {
	id: string;
	origem: string;
	destino: string;
	prazo: Date;
	prorrogacao?: Date | null;
	conclusao?: Date | null;
	status: StatusAndamento;
	observacao?: string | null;
	criadoEm: Date;
	atualizadoEm: Date;
	processo_id: string;
	processo?: IProcesso;
}

export interface IProcesso {
	id: string;
	numero_sei: string;
	assunto: string;
	criadoEm: Date;
	atualizadoEm: Date;
	andamentos?: IAndamento[];
}

export interface ICreateProcesso {
	numero_sei: string;
	assunto: string;
}

export interface IUpdateProcesso {
	numero_sei?: string;
	assunto?: string;
}

export interface ICreateAndamento {
	processo_id: string;
	origem: string;
	destino: string;
	prazo: string;
	status?: StatusAndamento;
	observacao?: string;
}

export interface IUpdateAndamento {
	origem?: string;
	destino?: string;
	prazo?: string;
	prorrogacao?: string;
	conclusao?: string;
	status?: StatusAndamento;
	observacao?: string;
}

export interface IPaginadoProcesso {
	data: IProcesso[];
	total: number;
	pagina: number;
	limite: number;
}

export interface IRespostaProcesso {
	ok: boolean;
	error: string | null;
	data:
		| IProcesso
		| IProcesso[]
		| IPaginadoProcesso
		| { removido: boolean }
		| null;
	status: number;
}

export interface IRespostaAndamento {
	ok: boolean;
	error: string | null;
	data:
		| IAndamento
		| IAndamento[]
		| { total: number; pagina: number; limite: number; data: IAndamento[] }
		| { removido: boolean }
		| null;
	status: number;
}

