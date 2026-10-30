// Catálogo de constantes para NANIVET

export const ESPECIES = ['Perro', 'Gato', 'Conejo', 'Ave'] as const;
export const SEXOS = ['Macho', 'Hembra'] as const;

export const ESTADOS_CITA = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  confirmada: { label: 'Confirmada', color: 'bg-sky-500/20 text-sky-700 dark:text-sky-400' },
  atendida: { label: 'Atendida', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  cancelada: { label: 'Cancelada', color: 'bg-red-500/20 text-red-700 dark:text-red-400' },
  no_asistio: { label: 'No asistió', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400' },
} as const;

export type EstadoCita = keyof typeof ESTADOS_CITA;

export const ESTADOS_CASO = {
  abierto: { label: 'Abierto', color: 'bg-sky-500/20 text-sky-700 dark:text-sky-400' },
  seguimiento: { label: 'En seguimiento', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  cerrado: { label: 'Cerrado', color: 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400' },
} as const;

export type EstadoCaso = keyof typeof ESTADOS_CASO;

export const TIPOS_SERVICIO = {
  consulta: { label: 'Consulta', color: 'bg-sky-500' },
  vacunacion: { label: 'Vacunación', color: 'bg-emerald-500' },
  cirugia: { label: 'Cirugía', color: 'bg-red-500' },
  desparasitacion: { label: 'Desparasitación', color: 'bg-amber-500' },
  urgencia: { label: 'Urgencia', color: 'bg-orange-500' },
  estetica: { label: 'Estética', color: 'bg-pink-500' },
  control: { label: 'Control', color: 'bg-violet-500' },
} as const;

export type TipoServicio = keyof typeof TIPOS_SERVICIO;

export const ROLES = {
  admin: 'Administrador',
  veterinario: 'Veterinario',
  recepcionista: 'Recepcionista',
} as const;

export type Rol = keyof typeof ROLES;

// Permisos por rol para navegación
export const PERMISOS_NAV: Record<string, Rol[]> = {
  dashboard: ['admin', 'veterinario', 'recepcionista'],
  calendario: ['admin', 'veterinario', 'recepcionista'],
  citas: ['admin', 'veterinario', 'recepcionista'],
  clientes: ['admin', 'veterinario', 'recepcionista'],
  mascotas: ['admin', 'veterinario', 'recepcionista'],
  staff: ['admin'],
  casos: ['admin', 'veterinario'],
  vacunas: ['admin', 'veterinario', 'recepcionista'],
  desparasitacion: ['admin', 'veterinario', 'recepcionista'],
  horarios: ['admin', 'veterinario'],
  campanas: ['admin', 'veterinario', 'recepcionista'],
  hospitalizacion: ['admin', 'veterinario'],
  auditoria: ['admin'],
};

// Permisos para ver datos clínicos sensibles (SOAP, diagnósticos, tratamientos)
export const ROLES_CLINICOS: Rol[] = ['admin', 'veterinario'];

// Estados de hospitalización
export const ESTADOS_HOSPITALIZACION = {
  hospitalizado: { label: 'Hospitalizado', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  alta: { label: 'Alta', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
} as const;

export type EstadoHospitalizacion = keyof typeof ESTADOS_HOSPITALIZACION;

// Segmentos de campaña
export const SEGMENTOS_CAMPANA = {
  vacunas_vencidas: { label: 'Vacunas vencidas o por vencer', icon: 'syringe' },
  desparasitacion_pendiente: { label: 'Desparasitación pendiente', icon: 'pill' },
  clientes_inactivos: { label: 'Clientes inactivos (+6 meses)', icon: 'users' },
  cumpleanos_mascotas: { label: 'Cumpleaños de mascotas', icon: 'cake' },
} as const;

export type SegmentoCampana = keyof typeof SEGMENTOS_CAMPANA;

// Plantillas de mensaje por segmento
export const PLANTILLAS_CAMPANA: Record<SegmentoCampana, string> = {
  vacunas_vencidas: 'Estimado/a {{dueno}}, le recordamos que {{mascota}} tiene una vacuna vencida o por vencer el {{fecha}}. Le invitamos a agendar una cita en NANIVET. Motivo: {{motivo}}',
  desparasitacion_pendiente: 'Estimado/a {{dueno}}, le recordamos que {{mascota}} tiene la desparasitación pendiente desde el {{fecha}}. Motivo: {{motivo}}. Agende su cita en NANIVET.',
  clientes_inactivos: 'Estimado/a {{dueno}}, hace tiempo que {{mascota}} no nos visita. ¿Le gustaría agendar un control? Motivo: {{motivo}}. NANIVET - Clínica Veterinaria.',
  cumpleanos_mascotas: 'Estimado/a {{dueno}}, ¡Feliz cumpleaños de {{mascota}}! Le deseamos un día maravilloso. NANIVET - Clínica Veterinaria.',
};

// Límite de horas para cancelar/reprogramar (configurable)
export const LIMITE_HORAS_CANCELAR = 12;

// Zona horaria: Esmeraldas, Ecuador (UTC-5)
export const TIMEZONE = 'America/Guayaquil';

// Horario de atención por defecto
export const HORARIO_DEFAULT = {
  inicio: '08:00',
  fin: '18:00',
  dias: [1, 2, 3, 4, 5, 6], // Lunes a Sábado (0=Domingo)
  intervalo: 30, // minutos por slot
};

// Formato fechas: dd/mm/aaaa
// IMPORTANTE: Estas funciones parsean strings ISO directamente sin conversión de timezone.
// No usar new Date(string) porque JavaScript interpreta strings ISO como UTC y luego
// getHours()/getDate() devuelven valores convertidos al timezone local, causando desfases.
export function formatDate(date: string | Date): string {
  if (!date) return '—';
  // Si es string, parsear directamente sin crear Date object
  if (typeof date === 'string') {
    // Formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss...
    const match = date.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, yyyy, mm, dd] = match;
      return `${dd}/${mm}/${yyyy}`;
    }
    return '—';
  }
  const d = date;
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '—';
  if (typeof date === 'string') {
    // Extraer hora directamente del string
    const match = date.match(/T(\d{2}):(\d{2})/);
    if (match) {
      const [_, hh, min] = match;
      return `${formatDate(date)} ${hh}:${min}`;
    }
    return '—';
  }
  const d = date;
  if (isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${hh}:${min}`;
}

export function formatTime(date: string | Date): string {
  if (!date) return '—';
  if (typeof date === 'string') {
    // Extraer hora directamente del string sin conversión
    const match = date.match(/T(\d{2}):(\d{2})/);
    if (match) {
      const [_, hh, min] = match;
      return `${hh}:${min}`;
    }
    return '—';
  }
  const d = date;
  if (isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// IDs generadores
export function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

// WhatsApp helper
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const prefix = '593'; // Ecuador country code
  const fullPhone = cleanPhone.startsWith('0') ? prefix + cleanPhone.slice(1) : prefix + cleanPhone;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

// Token generator for public links
export function genToken(): string {
  return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 6);
}

// Fecha/hora actual fija para datos mock (simula "hoy" en Esmeraldas, Ecuador)
// En una implementación real, usar: new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })
export const HOY = '2026-10-15';

// Fecha/hora actual ISO para logs de auditoría
export function ahora(): string {
  // En producción: new Date().toISOString()
  return `${HOY}T${new Date().toTimeString().slice(0, 8)}`;
}
