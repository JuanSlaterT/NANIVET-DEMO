// Modelos de datos para NANIVET

import type { EstadoCita, EstadoCaso, TipoServicio, Rol } from './constants';

export interface UsuarioAuth {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  veterinarioId?: string;
}

export interface Veterinario {
  id: string;
  nombre: string;
  especialidad: string;
  telefono: string;
  horario: {
    inicio: string;
    fin: string;
    dias: number[];
    intervalo: number;
  };
}

export interface HorarioBloqueado {
  id: string;
  veterinarioId: string;
  fecha: string;
  motivo: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  cedula: string;
  email: string | null;
  direccion: string | null;
  consentimientoDatos: {
    aceptado: boolean;
    fechaHora: string | null;
    versionAviso: string | null;
  };
  consentimientoComunicaciones: {
    aceptado: boolean;
    fechaHora: string | null;
  };
  fechaRevocacion: string | null;
}

export interface Mascota {
  id: string;
  clienteId: string;
  nombre: string;
  especie: string;
  sexo: string;
  fechaNacimiento: string;
  raza?: string | null;
  color?: string | null;
  esterilizado?: boolean;
  alergias?: string | null;
  microchip?: string | null;
  notas?: string | null;
}

export interface Cita {
  id: string;
  mascotaId: string;
  veterinarioId: string;
  tipoServicio: TipoServicio;
  fechaHora: string;
  estado: EstadoCita;
  motivo: string;
  notas: string;
  token?: string;
  motivoCancelacion?: string | null;
  fechaConfirmacion?: string | null;
  ultimoCambioPor?: string | null;
  confirmadaPorCliente?: boolean;
  canceladaPorCliente?: boolean;
}

export interface SOAP {
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
}

export interface CasoClinico {
  id: string;
  mascotaId: string;
  motivo: string;
  soap: SOAP;
  diagnostico: string;
  estado: EstadoCaso;
  fecha: string;
  veterinarioId: string;
}

export interface Vacuna {
  id: string;
  mascotaId: string;
  casoId: string | null;
  nombre: string;
  lote: string;
  fechaAplicacion: string;
  proximaDosis: string;
  veterinarioId: string;
}

export interface Tratamiento {
  id: string;
  mascotaId: string;
  casoId: string | null;
  nombre: string;
  dosis: string;
  duracion: string;
  fecha: string;
  veterinarioId: string;
}

export interface Desparasitacion {
  id: string;
  mascotaId: string;
  casoId: string | null;
  producto: string;
  dosis: string;
  fecha: string;
  proximaDosis: string;
  veterinarioId: string;
}

export interface Cirugia {
  id: string;
  mascotaId: string;
  casoId: string | null;
  tipo: string;
  fecha: string;
  veterinarioId: string;
  anestesia: string;
  notas: string;
  prognosis: string;
}

export interface Examen {
  id: string;
  mascotaId: string;
  casoId: string | null;
  tipo: string;
  descripcion: string;
  fecha: string;
  veterinarioId: string;
}

export interface PesoRegistrado {
  id: string;
  mascotaId: string;
  peso: number;
  fecha: string;
}

// ==================== NUEVAS ENTIDADES ====================

export interface AuditLog {
  id: string;
  usuario: string;
  rol: string;
  fechaHora: string;
  accion: 'crear' | 'editar' | 'eliminar' | 'consultar' | 'revocar' | 'confirmar' | 'cancelar' | 'reprogramar' | 'enviar_campaña' | 'alta_hospitalizacion';
  entidad: string;
  entidadId: string;
  valoresAntes?: Record<string, unknown> | null;
  valoresDespues?: Record<string, unknown> | null;
  diff?: { campo: string; antes: string; despues: string }[];
}

export interface Encuesta {
  id: string;
  citaId: string;
  token: string;
  mascotaId: string;
  veterinarioId: string;
  calificacion: number;
  recomienda: boolean;
  comentario: string | null;
  fechaRespuesta: string | null;
  respondida: boolean;
}

export interface Hospitalizacion {
  id: string;
  mascotaId: string;
  casoId: string | null;
  veterinarioId: string;
  citaId: string | null;
  fechaIngreso: string;
  fechaAlta: string | null;
  jaulaArea: string;
  motivo: string;
  estado: 'hospitalizado' | 'alta';
  resumenAlta?: string | null;
  indicacionesAlta?: string | null;
}

export interface Medicacion {
  id: string;
  hospitalizacionId: string;
  medicamento: string;
  dosis: string;
  via: string;
  frecuencia: string;
  horasProgramadas: string[];
  fechaInicio: string;
  fechaFin: string | null;
  tomas: { fecha: string; hora: string; administrada: boolean; horaReal: string | null; usuario: string | null }[];
}

export interface EvolucionDiaria {
  id: string;
  hospitalizacionId: string;
  fecha: string;
  signosVitales: string;
  estadoGeneral: string;
  observaciones: string;
  veterinarioId: string;
}

export interface CampanaEnvio {
  id: string;
  segmento: string;
  clienteId: string;
  mascotaId: string | null;
  motivo: string;
  fechaEnviado: string | null;
  enviadoPor: string | null;
}

// Versión del aviso de privacidad
export const VERSION_AVISO_PRIVACIDAD = '1.0';
