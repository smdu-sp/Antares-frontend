"use server";

import { auth } from "@/lib/auth/auth";
import type {
  IPreferencia,
  CriarPreferenciaDTO,
  AtualizarPreferenciaDTO,
} from "@/types/preferencia";

// Remover barra final se existir
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");

/**
 * Buscar uma preferência específica por chave
 */
export async function buscarPreferencia(
  chave: string
): Promise<IPreferencia | null> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const url = `${API_URL}/preferencias/${chave}`;
    console.log('🌐 Buscando preferência:', { url, chave, API_URL });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      console.log('ℹ️ Preferência não encontrada:', chave);
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao buscar:', { 
        status: response.status, 
        url: response.url,
        errorText 
      });
      throw new Error(
        `Erro ao buscar preferência: ${response.status} - ${errorText}`
      );
    }

    const preferencia = await response.json();

    // Tentar fazer parse do valor se for string JSON
    if (preferencia && typeof preferencia.valor === 'string') {
      try {
        preferencia.valor = JSON.parse(preferencia.valor);
      } catch {
        // Se não for JSON válido, manter como string
      }
    }

    return preferencia;
  } catch (error) {
    console.error("Erro ao buscar preferência:", error);
    throw error;
  }
}

/**
 * Salvar ou atualizar uma preferência
 */
export async function salvarPreferencia(
  data: CriarPreferenciaDTO
): Promise<IPreferencia> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // Converter valor para string JSON se não for string
    const valorString = typeof data.valor === 'string' 
      ? data.valor 
      : JSON.stringify(data.valor);

    const payload = {
      chave: data.chave,
      valor: valorString,
    };

    const url = `${API_URL}/preferencias`;
    console.log('🌐 Chamando API:', { 
      url, 
      method: 'POST',
      API_URL,
      chave: data.chave,
      valorLength: valorString.length 
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', { 
        status: response.status, 
        statusText: response.statusText,
        url: response.url,
        errorText 
      });
      throw new Error(
        `Erro ao salvar preferência: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Erro ao salvar preferência:", error);
    throw error;
  }
}

/**
 * Buscar todas as preferências do usuário
 */
export async function buscarTodasPreferencias(): Promise<IPreferencia[]> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const response = await fetch(`${API_URL}/preferencias`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao buscar preferências: ${response.status} - ${errorText}`
      );
    }

    const preferencias = await response.json();

    // Tentar fazer parse do valor de cada preferência
    return preferencias.map((pref: IPreferencia) => {
      if (typeof pref.valor === 'string') {
        try {
          return { ...pref, valor: JSON.parse(pref.valor) };
        } catch {
          return pref;
        }
      }
      return pref;
    });
  } catch (error) {
    console.error("Erro ao buscar preferências:", error);
    throw error;
  }
}

/**
 * Deletar uma preferência específica
 */
export async function deletarPreferencia(chave: string): Promise<void> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const response = await fetch(`${API_URL}/preferencias/${chave}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao deletar preferência: ${response.status} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Erro ao deletar preferência:", error);
    throw error;
  }
}

/**
 * Deletar todas as preferências do usuário
 */
export async function deletarTodasPreferencias(): Promise<void> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const response = await fetch(`${API_URL}/preferencias`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao deletar preferências: ${response.status} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Erro ao deletar preferências:", error);
    throw error;
  }
}
