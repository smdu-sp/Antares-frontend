/** @format */

export interface IUsuario {
	id: string;
	nome: string;
	login: string;
	email: string;
	permissao: IPermissao;
	avatar?: string;
	status: boolean;
	ultimoLogin: Date;
	criadoEm: Date;
	atualizadoEm: Date;
	nomeSocial?: string;
}

export enum IPermissao {
	DEV,
	TEC,
	ADM,
	USR,
}

export interface ICreateUsuario {
	nome: string;
	email: string;
	login: string;
	avatar?: string;
	permissao?: IPermissao;
	status?: boolean;
	nomeSocial?: string;
}

export interface IUpdateUsuario {
	id?: string;
	status?: boolean;
	nomeSocial?: string;
	avatar?: string;
	permissao?: IPermissao;
}

export interface IPaginadoUsuario {
	data: IUsuario[];
	total: number;
	pagina: number;
	limite: number;
}

export interface INovoUsuario {
	login: string;
	nome: string;
	email: string;
}

export interface IUsuarioTecnico {
	id: string;
	nome: string;
}

export interface IRespostaUsuario {
	ok: boolean;
	error: string | null;
	data:
		| INovoUsuario
		| IUsuario
		| IUsuario[]
		| IUsuarioTecnico[]
		| IPaginadoUsuario
		| { autorizado: boolean }
		| { desativado: boolean }
		| null;
	status: number;
}

export interface IUsuarioSession {
	sub: string;
	nome: string;
	login: string;
	email: string;
	nomeSocial?: string;
	permissao: IPermissao;
	status: number;
	avatar?: string;
	iat: number;
	exp: number;
}
