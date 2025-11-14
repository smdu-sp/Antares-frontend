/** @format */

import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { jwtDecode } from 'jwt-decode';

export default {
	providers: [
		Credentials({
			name: 'credentials',
			credentials: {
				login: { label: 'Login', type: 'text' },
				senha: { label: 'Senha', type: 'password' },
			},
			type: 'credentials',
			async authorize(credentials) {
				if (credentials?.login && credentials?.senha) {
					const { login, senha } = credentials;
					try {
						const controller = new AbortController();
						const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
						
						const response = await fetch(
							`${process.env.NEXT_PUBLIC_API_URL}login`,
							{
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ login, senha }),
								signal: controller.signal,
							},
						);
						
						clearTimeout(timeoutId);
						
						if (!response.ok) {
							console.error('Erro na autenticação:', response.status, response.statusText);
							return null;
						}
						
						const usuario = await response.json();
						if (usuario) return usuario;
					} catch (error) {
						if (error instanceof Error && error.name === 'AbortError') {
							console.error('Timeout na requisição de autenticação - backend não respondeu em 10 segundos');
						} else if (error instanceof TypeError && error.message.includes('fetch failed')) {
							console.error('Erro de conexão - verifique se o backend está rodando em', process.env.NEXT_PUBLIC_API_URL);
						} else {
							console.error('Erro inesperado na autenticação:', error);
						}
						return null;
					}
				}
				return null;
			},
		}),
	],
	callbacks: {
		async jwt({ token, user, trigger, session }) {
			if (trigger === 'update' && session) {
				if (session.usuario) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(token.user as any).usuario.avatar = session.usuario.avatar;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(token.user as any).usuario.permissao = session.usuario.permissao;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(token.user as any).usuario.nomeSocial = session.usuario.nomeSocial;
					return token;
				}
			}
			if (user) token.user = user;
			return token;
		},
		async session({ session, token }) {
			//eslint-disable-next-line @typescript-eslint/no-explicit-any
			session = token.user as any;

			if (session.access_token && !session.usuario)
				session.usuario = jwtDecode(session.access_token);
			const now = new Date();
			if (session.usuario?.exp && session.usuario.exp * 1000 < now.getTime()) {
				// Só tenta renovar se houver refresh_token
				if (!session.refresh_token) {
					return session;
				}
				
				try {
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 10000);
					
					const response = await fetch(
						`${process.env.NEXT_PUBLIC_API_URL}refresh`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								refresh_token: session.refresh_token,
							}),
							signal: controller.signal,
						},
					);
					
					clearTimeout(timeoutId);
					
					if (response.ok) {
						const { access_token, refresh_token } = await response.json();
						session.access_token = access_token;
						session.refresh_token = refresh_token;
						if (access_token) session.usuario = jwtDecode(access_token);
					}
				} catch (error) {
					// Trata erros de conexão de forma silenciosa
					if (error instanceof Error) {
						const isConnectionError = 
							error.name === 'AbortError' || 
							(error.cause as { code?: string })?.code === 'ECONNREFUSED' ||
							error.message.includes('fetch failed');
						
						if (isConnectionError) {
							// Backend não está disponível - log apenas em desenvolvimento
							if (process.env.NODE_ENV === 'development') {
								console.warn('Backend não está disponível. Verifique se o servidor está rodando em', process.env.NEXT_PUBLIC_API_URL);
							}
						} else {
							console.error('Erro ao renovar token:', error);
						}
					}
				}
			}
			if (session.access_token) {
				try {
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 5000);
					
					await fetch(
						`${process.env.NEXT_PUBLIC_API_URL}usuarios/valida-usuario`,
						{
							headers: {
								Authorization: `Bearer ${session.access_token}`,
							},
							signal: controller.signal,
						},
					);
					
					clearTimeout(timeoutId);
				} catch (error) {
					// Trata erros de conexão de forma silenciosa
					if (error instanceof Error) {
						const isConnectionError = 
							error.name === 'AbortError' || 
							(error.cause as { code?: string })?.code === 'ECONNREFUSED' ||
							error.message.includes('fetch failed');
						
						// Silenciosamente ignora erros de conexão para não bloquear a sessão
						// Log apenas em desenvolvimento
						if (!isConnectionError && process.env.NODE_ENV === 'development') {
							console.warn('Erro ao validar usuário:', error);
						}
					}
				}
			}
			return session;
		},
	},
	pages: {
		signIn: '/login',
		error: '/login',
	},
} satisfies NextAuthConfig;
