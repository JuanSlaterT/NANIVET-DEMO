// Servicio de Inteligencia Artificial — Conexión al backend NANIVET
// Todas las solicitudes pasan por el backend. Nunca expone AI_API_KEY.

import { fetchApi } from './api-client';
import type { ApiResponse } from './api-client';
import type {
  RedactarMensajeRequest,
  DiagnosticoDiferencial,
} from './models';

const IA_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/ia`;

// ==================== RESUMIR HISTORIA CLÍNICA ====================

export interface ResumenHistoriaInput {
  mascotaId: string;
}

export interface ResumenHistoriaResult {
  mascota: {
    id: string;
    nombre: string;
    especie: string;
  };
  resumen: string;
  disclaimer: string;
}

/**
 * Genera un resumen de la historia clínica de una mascota.
 * Requiere rol admin o veterinario.
 */
export async function resumirHistoria(
  mascotaId: string,
  signal?: AbortSignal
): Promise<ApiResponse<ResumenHistoriaResult>> {
  return fetchApi<ResumenHistoriaResult>(
    `${IA_BASE}/resumir-historia`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mascotaId }),
      signal,
    }
  );
}

// ==================== CONVERTIR NOTAS A SOAP ====================

export interface NotasSoapInput {
  mascotaId: string;
  notasLibres: string;
}

export interface NotasSoapResult {
  mascotaId: string;
  soap: {
    subjetivo: string;
    objetivo: string;
    analisis: string;
    plan: string;
  };
  disclaimer: string;
}

/**
 * Convierte notas clínicas libres a formato SOAP.
 * Requiere rol admin o veterinario.
 */
export async function convertirNotasASoap(
  mascotaId: string,
  notasLibres: string,
  signal?: AbortSignal
): Promise<ApiResponse<NotasSoapResult>> {
  return fetchApi<NotasSoapResult>(
    `${IA_BASE}/notas-a-soap`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mascotaId, notasLibres }),
      signal,
    }
  );
}

// ==================== REDACTAR MENSAJE ====================

/**
 * Redacta un mensaje para el dueño de una mascota.
 * Requiere rol admin o veterinario.
 */
export async function redactarMensaje(
  request: RedactarMensajeRequest,
  signal?: AbortSignal
): Promise<ApiResponse<{ mensaje: string; disclaimer: string }>> {
  return fetchApi<{ mensaje: string; disclaimer: string }>(
    `${IA_BASE}/redactar-mensaje`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    }
  );
}

// ==================== DIAGNÓSTICOS DIFERENCIALES ====================

export interface SignosVitales {
  temperaturaC?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
}

export interface DatosClinicosDiferenciales {
  mascotaId?: string;
  especie?: string;
  raza?: string;
  edad?: number;
  sexo?: string;
  pesoKg?: number;
  signos?: string[];
  signosVitales?: SignosVitales;
  antecedentes?: string;
  hallazgos?: string;
}

export interface DiferencialesResult {
  diferenciales: Array<{
    diagnostico: string;
    probabilidad: 'Alta' | 'Media' | 'Baja' | string;
    descripcion: string;
    examenes: string[];
  }>;
  disclaimer: string;
}

/**
 * Genera diagnósticos diferenciales basados en signos clínicos.
 * Requiere rol admin o veterinario.
 */
export async function obtenerDiferenciales(
  datosClinicos: DatosClinicosDiferenciales,
  signal?: AbortSignal
): Promise<ApiResponse<DiferencialesResult>> {
  return fetchApi<DiferencialesResult>(
    `${IA_BASE}/diferenciales`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosClinicos),
      signal,
    }
  );
}

// ==================== EXPORTS ====================

/** Servicio de IA centralizado con todas las funciones disponibles */
export const iaService = {
  resumirHistoria,
  convertirNotasASoap,
  redactarMensaje,
  obtenerDiferenciales,
};

export default iaService;
