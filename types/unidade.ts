/** @format */

export interface IUnidade {
	id: string;
	nome: string;
	sigla: string;
	criadoEm: Date;
	atualizadoEm: Date;
}

export interface ICreateUnidade {
	nome: string;
	sigla: string;
}

export interface IUpdateUnidade {
	nome?: string;
	sigla?: string;
}

export interface IPaginadoUnidade {
	data: IUnidade[];
	total: number;
	pagina: number;
	limite: number;
}

export interface IRespostaUnidade {
	ok: boolean;
	error: string | null;
	data:
		| IUnidade
		| IUnidade[]
		| IPaginadoUnidade
		| { removido: boolean }
		| null;
	status: number;
}



