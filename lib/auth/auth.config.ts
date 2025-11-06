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
					const response = await fetch(
						`${process.env.NEXT_PUBLIC_API_URL}login`,
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ login, senha }),
						},
					);
					const usuario = await response.json();
					if (usuario && response.ok) return usuario;
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
			if (session.usuario.exp * 1000 < now.getTime()) {
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
					},
				);
				const { access_token, refresh_token } = await response.json();
				session.access_token = access_token;
				session.refresh_token = refresh_token;
				if (access_token) session.usuario = jwtDecode(access_token);
			}
			if (session.access_token) {
				await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}usuarios/valida-usuario`,
					{
						headers: {
							Authorization: `Bearer ${session.access_token}`,
						},
					},
				);
			}
			return session;
		},
	},
	pages: {
		signIn: '/login',
		error: '/login',
	},
} satisfies NextAuthConfig;
