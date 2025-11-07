/** @format */

import { IAndamento, StatusAndamento } from '@/types/processo';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Função para calcular dias restantes (considera apenas a data, sem hora)
export function calcularDiasRestantes(
	prazo: Date | string,
	prorrogacao?: Date | string | null,
): number {
	const dataLimite = prorrogacao ? new Date(prorrogacao) : new Date(prazo);
	const hoje = new Date();
	
	// Zera as horas para comparar apenas as datas
	hoje.setHours(0, 0, 0, 0);
	dataLimite.setHours(0, 0, 0, 0);
	
	const diffTime = dataLimite.getTime() - hoje.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
}

// Função para obter status do prazo
export function getStatusPrazo(
	dias: number,
	status: StatusAndamento,
): {
	cor: string;
	bg: string;
	icone: LucideIcon;
	texto: string;
} {
	if (status === StatusAndamento.CONCLUIDO) {
		return {
			cor: 'text-green-600 dark:text-green-400',
			bg: 'bg-green-100 dark:bg-green-900/30',
			icone: CheckCircle2,
			texto: 'Concluído',
		};
	}
	if (dias < 0) {
		return {
			cor: 'text-red-600 dark:text-red-400',
			bg: 'bg-red-100 dark:bg-red-900/30',
			icone: AlertCircle,
			texto: `${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''} em atraso`,
		};
	}
	if (dias <= 3) {
		return {
			cor: 'text-orange-600 dark:text-orange-400',
			bg: 'bg-orange-100 dark:bg-orange-900/30',
			icone: Clock,
			texto: `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
		};
	}
	return {
		cor: 'text-blue-600 dark:text-blue-400',
		bg: 'bg-blue-100 dark:bg-blue-900/30',
		icone: Clock,
		texto: `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
	};
}

// Função para obter o andamento mais crítico (prioriza vencidos e prestes a vencer)
export function getUltimoAndamento(
	andamentos?: IAndamento[],
): IAndamento | null {
	if (!andamentos || andamentos.length === 0) return null;
	
	// Filtra apenas andamentos não concluídos
	const ativos = andamentos.filter((a) => a.status !== StatusAndamento.CONCLUIDO);
	
	// Se não houver ativos, retorna o último concluído
	if (ativos.length === 0) {
		const concluidos = andamentos
			.filter((a) => a.status === StatusAndamento.CONCLUIDO)
			.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
		return concluidos[0] || null;
	}
	
	// Calcula dias restantes para cada andamento e ordena por prioridade
	const andamentosComPrioridade = ativos.map((a) => {
		const dias = calcularDiasRestantes(
			new Date(a.prazo),
			a.prorrogacao,
		);
		return { andamento: a, dias };
	});
	
	// Ordena por prioridade:
	// 1. Vencidos (dias < 0) - mais negativo primeiro (mais atrasado)
	// 2. Vencendo hoje (dias = 0)
	// 3. Próximos a vencer (dias <= 3) - menos dias primeiro
	// 4. Demais (dias > 3) - menos dias primeiro
	andamentosComPrioridade.sort((a, b) => {
		// Se ambos estão vencidos, prioriza o mais atrasado
		if (a.dias < 0 && b.dias < 0) {
			return a.dias - b.dias; // Mais negativo primeiro
		}
		// Se apenas A está vencido
		if (a.dias < 0) return -1;
		// Se apenas B está vencido
		if (b.dias < 0) return 1;
		
		// Se ambos estão vencendo hoje ou próximos (dias <= 3)
		if (a.dias <= 3 && b.dias <= 3) {
			return a.dias - b.dias; // Menos dias primeiro
		}
		// Se apenas A está vencendo hoje/próximo
		if (a.dias <= 3) return -1;
		// Se apenas B está vencendo hoje/próximo
		if (b.dias <= 3) return 1;
		
		// Ambos têm mais de 3 dias, ordena por menos dias primeiro
		return a.dias - b.dias;
	});
	
	return andamentosComPrioridade[0]?.andamento || null;
}

