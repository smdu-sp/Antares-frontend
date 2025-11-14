/** @format */

export async function contarVencendoHoje(
	access_token: string,
): Promise<{ ok: boolean; error: string | null; data: number | null; status: number }> {
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const response = await fetch(`${baseURL}processos/contar/vencendo-hoje`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${access_token}`,
			},
			cache: 'no-store',
		});
		const data = await response.json();
		if (response.status === 200)
			return {
				ok: true,
				error: null,
				data: data.total as number,
				status: 200,
			};
		return {
			ok: false,
			error: data.message,
			data: null,
			status: data.statusCode,
		};
	} catch (error) {
		return {
			ok: false,
			error: 'Não foi possível contar processos vencendo hoje: ' + error,
			data: null,
			status: 400,
		};
	}
}

