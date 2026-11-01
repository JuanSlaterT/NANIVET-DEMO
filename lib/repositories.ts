// Capa de repositorios para NANIVET
// Conectada al backend API REST. Los datos mock se mantienen en mock-data.ts
// pero ya no se usan aquí.

import { api } from './api-client';
import type {
  UsuarioAuth, Veterinario, HorarioBloqueado, Staff,
  Cliente, Mascota, Cita, CasoClinico,
  Vacuna, Tratamiento, Desparasitacion, Cirugia, Examen, PesoRegistrado,
  AuditLog, Hospitalizacion, Medicacion, EvolucionDiaria, CampanaEnvio, PuntuacionCita,
  CatalogoVacuna, CatalogoDesparasitacion,
  SOAP,
} from './models';
import type { Rol, EstadoCita, TipoServicio } from './constants';
import { LIMITE_HORAS_CANCELAR } from './constants';

// ==================== AUTH REPOSITORY ====================
export const AuthRepository = {
  async login(email: string, password: string): Promise<UsuarioAuth | null> {
    const res = await api.login({ email, password });
    if (res.error) throw new Error(res.error.message);
    return (res.data?.user as UsuarioAuth | undefined) ?? null;
  },

  async getCurrentUser(): Promise<UsuarioAuth | null> {
    const res = await api.getUser();
    if (res.error) return null;
    return (res.data as UsuarioAuth | undefined) ?? null;
  },
};

// ==================== STAFF REPOSITORY ====================
export const StaffRepository = {
  async getAll(): Promise<Staff[]> {
    const res = await api.getStaff();
    return res.error ? [] : (res.data as Staff[]);
  },

  getById(id: string): Promise<Staff | undefined> {
    return api.getStaffById(id).then(r => r.error ? undefined : (r.data as Staff));
  },

  async getByEmail(email: string): Promise<Staff | undefined> {
    try {
      const res = await api.getStaffByEmail(email);
      return res.error ? undefined : (res.data as Staff);
    } catch {
      return undefined;
    }
  },

  async create(data: Omit<Staff, 'id' | 'activo' | 'fechaAlta'>): Promise<Staff> {
    const res = await api.createStaff(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Staff;
  },

  async update(id: string, data: Partial<Staff>): Promise<Staff | null> {
    const res = await api.updateStaff(id, data);
    if (res.error) return null;
    return res.data as Staff;
  },

  async toggleActivo(id: string, activo: boolean): Promise<Staff | null> {
    const res = await api.toggleStaffActivo(id, activo);
    if (res.error) return null;
    return res.data as Staff;
  },

  async delete(id: string): Promise<void> {
    const res = await api.deleteStaff(id);
    if (res.error) throw new Error(res.error.message);
  },
};

// ==================== VETERINARIO REPOSITORY ====================
export const VeterinarioRepository = {
  async getAll(): Promise<Veterinario[]> {
    const res = await api.getVeterinarios();
    if (res.error) return [];
    
    // Normalizar datos del backend (camelCase) al formato del frontend
    const rawVets = res.data as any[];
    return rawVets.map((v: any) => {
      // Backend envía todo en camelCase plano: horarioInicio, diasSemana, etc.
      if (v.horarioInicio != null) {
        // Normalizar "08:00:00" → "08:00"
        const normalizeTime = (t: string) => t && t.includes(':') ? t.slice(0, 5) : t;
        // Días ya vienen en formato JS nativo (0=Dom, 1=Lun, ..., 6=Sáb) - mismo que el frontend
        return {
          id: v.id,
          nombre: v.nombre || v.staffNombre,
          especialidad: v.especialidad,
          telefono: v.telefono || v.staffTelefono,
          horario: {
            inicio: normalizeTime(v.horarioInicio),
            fin: normalizeTime(v.horarioFin),
            dias: Array.isArray(v.diasSemana) ? v.diasSemana.filter((d: number) => typeof d === 'number' && d >= 0 && d <= 6) : [1,2,3,4,5],
            intervalo: v.intervaloMinutos || 30
          }
        };
      }
      // Mock data: ya viene en formato anidado
      return v as Veterinario;
    });
  },

  getById(id: string): Promise<Veterinario | undefined> {
    return api.getVeterinarioById(id).then(r => {
      if (r.error) return undefined;
      const v = r.data as any;
      if (v.horarioInicio != null) {
        const normalizeTime = (t: string) => t && t.includes(':') ? t.slice(0, 5) : t;
        // Días ya vienen en formato JS nativo (0=Dom, 1=Lun, ..., 6=Sáb) - mismo que el frontend
        return {
          id: v.id,
          nombre: v.nombre || v.staffNombre,
          especialidad: v.especialidad,
          telefono: v.telefono || v.staffTelefono,
          horario: {
            inicio: normalizeTime(v.horarioInicio),
            fin: normalizeTime(v.horarioFin),
            dias: Array.isArray(v.diasSemana) ? v.diasSemana.filter((d: number) => typeof d === 'number' && d >= 0 && d <= 6) : [1,2,3,4,5],
            intervalo: v.intervaloMinutos || 30
          }
        } as Veterinario;
      }
      return v as Veterinario;
    });
  },

  async getBloqueos(veterinarioId: string): Promise<HorarioBloqueado[]> {
    const res = await api.getBloqueos(veterinarioId);
    return res.error ? [] : (res.data as HorarioBloqueado[]);
  },

  async addBloqueo(veterinarioId: string, fecha: string, motivo: string): Promise<HorarioBloqueado> {
    const res = await api.createBloqueo(veterinarioId, fecha, motivo);
    if (res.error) throw new Error(res.error.message);
    return res.data as HorarioBloqueado;
  },

  async removeBloqueo(id: string): Promise<void> {
    const res = await api.deleteBloqueo(id);
    if (res.error) throw new Error(res.error.message);
  },
};

// ==================== CLIENTE REPOSITORY ====================
export const ClienteRepository = {
  async getAll(): Promise<Cliente[]> {
    const res = await api.getClientes();
    return res.error ? [] : (res.data as Cliente[]);
  },

  async getById(id: string): Promise<Cliente | undefined> {
    const res = await api.getClientById(id);
    return res.error ? undefined : (res.data as Cliente);
  },

  async create(data: Omit<Cliente, 'id'>): Promise<Cliente> {
    const res = await api.createClient(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Cliente;
  },

  async update(id: string, data: Partial<Cliente>): Promise<Cliente | null> {
    const res = await api.updateClient(id, data);
    if (res.error) return null;
    return res.data as Cliente;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteClient(id);
      return !res.error;
    } catch {
      return false;
    }
  },

  async search(query: string): Promise<Cliente[]> {
    const res = await api.searchClientes(query);
    return res.error ? [] : (res.data as Cliente[]);
  },

  async revocarConsentimiento(id: string): Promise<Cliente | null> {
    const res = await api.revokeConsentimiento(id);
    if (res.error) return null;
    return res.data as Cliente;
  },
};

// ==================== MASCOTA REPOSITORY ====================
export const MascotaRepository = {
  async getAll(): Promise<Mascota[]> {
    const res = await api.getMascotas();
    return res.error ? [] : (res.data as Mascota[]);
  },

  async getByCliente(clienteId: string): Promise<Mascota[]> {
    const res = await api.getMascotas({ clienteId });
    return res.error ? [] : (res.data as Mascota[]);
  },

  async getById(id: string): Promise<Mascota | undefined> {
    const res = await api.getMascotaById(id);
    return res.error ? undefined : (res.data as Mascota);
  },

  async create(data: Omit<Mascota, 'id'>): Promise<Mascota> {
    const res = await api.createMascota(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Mascota;
  },

  async update(id: string, data: Partial<Mascota>): Promise<Mascota | null> {
    const res = await api.updateMascota(id, data);
    if (res.error) return null;
    return res.data as Mascota;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteMascota(id);
      return !res.error;
    } catch {
      return false;
    }
  },

  async search(query: string): Promise<Mascota[]> {
    const res = await api.searchMascotas(query);
    return res.error ? [] : (res.data as Mascota[]);
  },

  async uploadProfile(id: string, image: File): Promise<Mascota> {
    const res = await api.uploadMascotaProfile(id, image);
    if (res.error) throw new Error(res.error.message);
    return res.data as Mascota;
  },
};

// ==================== CITA REPOSITORY ====================
export const CitaRepository = {
  async getAll(): Promise<Cita[]> {
    const res = await api.getCitas();
    return res.error ? [] : (res.data as Cita[]);
  },

  async getByFecha(fecha: string): Promise<Cita[]> {
    const res = await api.getCitas({ fecha });
    return res.error ? [] : (res.data as Cita[]);
  },

  async getByVeterinario(veterinarioId: string): Promise<Cita[]> {
    const res = await api.getCitas({ veterinarioId });
    return res.error ? [] : (res.data as Cita[]);
  },

  async getByMascota(mascotaId: string): Promise<Cita[]> {
    const res = await api.getCitas({ mascotaId });
    return res.error ? [] : (res.data as Cita[]);
  },

  async getById(id: string): Promise<Cita | undefined> {
    const res = await api.getCitaById(id);
    return res.error ? undefined : (res.data as Cita);
  },

  async getByToken(token: string): Promise<Cita | undefined> {
    const res = await api.getCitaByToken(token);
    return res.error ? undefined : (res.data as Cita);
  },

  async create(data: Omit<Cita, 'id' | 'token'>): Promise<Cita> {
    const res = await api.createCita(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Cita;
  },

  async update(id: string, data: Partial<Cita>): Promise<Cita | null> {
    const res = await api.updateCita(id, data);
    if (res.error) return null;
    return res.data as Cita;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteCita(id);
      return !res.error;
    } catch {
      return false;
    }
  },

  async getSlotsOcupados(veterinarioId: string, fecha: string): Promise<string[]> {
    const res = await api.getSlotsOcupados(veterinarioId, fecha);
    if (res.error) return [];
    // El backend devuelve { data: { ocupados: string[], bloqueado: boolean } }
    const responseData = res.data ?? null;
    return responseData?.ocupados || [];
  },

  async getProximas(veterinarioId: string): Promise<any[]> {
    const res = await api.getProximas(veterinarioId);
    if (res.error) return [];
    const data = res.data as { data?: any[] } | any[] | null;
    const citas = Array.isArray(data) ? data : (data?.data || []);
    return citas as any[];
  },

  // --- Gestión pública por token ---
  async confirmarPorToken(token: string): Promise<Cita | null> {
    const res = await api.confirmByToken(token);
    if (res.error) return null;
    return res.data as Cita;
  },

  async cancelarPorToken(token: string, motivo: string): Promise<{ ok: boolean; cita: Cita | null; error?: string }> {
    const res = await api.cancelByToken(token, motivo);
    if (res.error) return { ok: false, cita: null, error: res.error.message };
    return { ok: true, cita: res.data as Cita };
  },

  async reprogramarPorToken(token: string, nuevaFechaHora: string): Promise<{ ok: boolean; cita: Cita | null; error?: string }> {
    const res = await api.rescheduleByToken(token, nuevaFechaHora);
    if (res.error) return { ok: false, cita: null, error: res.error.message };
    return { ok: true, cita: res.data as Cita };
  },
};

// ==================== CASO CLÍNICO REPOSITORY ====================
// Helper to transform flat soap fields from backend into nested soap object
function transformCasoRow(row: any): CasoClinico | undefined {
  if (!row) return undefined;
  const base = {
    id: row.id,
    mascotaId: row.mascota_id || row.mascotaId,
    motivo: row.motivo,
    soap: {
      subjetivo: row.soap_subjetivo || '',
      objetivo: row.soap_objetivo || '',
      analisis: row.soap_analisis || '',
      plan: row.soap_plan || '',
    },
    diagnostico: row.diagnostico,
    estado: row.estado,
    fecha: row.fecha_hora_inicio || row.fecha || row.fecha_creacion,
    veterinarioId: row.veterinario_id || row.veterinarioId,
  };
  // If soap is already an object (e.g., from mock data), keep it as-is
  if (row.soap && typeof row.soap === 'object' && !row.soap_subjetivo) {
    return { ...base, soap: row.soap };
  }
  return base;
}

export const CasoRepository = {
  async getAll(params?: Record<string, string>): Promise<CasoClinico[]> {
    const res = await api.getCasos(params);
    if (res.error) return [];
    const data = res.data as any[];
    return Array.isArray(data)
      ? data.map(transformCasoRow).filter((caso): caso is CasoClinico => caso !== undefined)
      : [];
  },

  async getByMascota(mascotaId: string): Promise<CasoClinico[]> {
    const res = await api.getCasos({ mascotaId });
    if (res.error) return [];
    const data = res.data as any[];
    return Array.isArray(data)
      ? data.map(transformCasoRow).filter((caso): caso is CasoClinico => caso !== undefined)
      : [];
  },

  async getById(id: string): Promise<CasoClinico | undefined> {
    const res = await api.getCasoById(id);
    if (res.error) return undefined;
    return transformCasoRow(res.data);
  },

  async create(data: Omit<CasoClinico, 'id'>): Promise<CasoClinico> {
    const res = await api.createCaso(data);
    if (res.error) throw new Error(res.error.message);
    return transformCasoRow(res.data) as CasoClinico;
  },

  async update(id: string, data: Partial<CasoClinico>, options?: { silent?: boolean }): Promise<CasoClinico | null> {
    const res = await api.updateCaso(id, data, options?.silent);
    if (res.error) return null;
    return res.data as CasoClinico;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteCaso(id);
      return !res.error;
    } catch {
      return false;
    }
  },
};

// ==================== VACUNA REPOSITORY ====================
export const VacunaRepository = {
  async getAll(params?: Record<string, string>): Promise<Vacuna[]> {
    const res = await api.getVacunas(params);
    return res.error ? [] : (res.data as Vacuna[]);
  },

  async getByMascota(mascotaId: string): Promise<Vacuna[]> {
    const res = await api.getVacunas({ mascotaId });
    return res.error ? [] : (res.data as Vacuna[]);
  },

  async getByCaso(casoId: string): Promise<Vacuna[]> {
    const res = await api.getVacunas({ casoId });
    return res.error ? [] : (res.data as Vacuna[]);
  },

  async create(data: Omit<Vacuna, 'id'>): Promise<Vacuna> {
    const res = await api.createVacuna(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Vacuna;
  },

  async update(id: string, data: Partial<Vacuna>): Promise<Vacuna | null> {
    const res = await api.updateVacuna(id, data);
    if (res.error) return null;
    return res.data as Vacuna;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteVacuna(id);
      return !res.error;
    } catch {
      return false;
    }
  },

  async getPorVencer(diasLimite: number = 30): Promise<Vacuna[]> {
    const res = await api.getVacunas({ porVencer: String(diasLimite) });
    return res.error ? [] : (res.data as Vacuna[]);
  },
};

// ==================== TRATAMIENTO REPOSITORY ====================
export const TratamientoRepository = {
  async getAll(params?: Record<string, string>): Promise<Tratamiento[]> {
    const res = await api.getTratamientos(params);
    return res.error ? [] : (res.data as Tratamiento[]);
  },

  async getByMascota(mascotaId: string): Promise<Tratamiento[]> {
    const res = await api.getTratamientos({ mascotaId });
    return res.error ? [] : (res.data as Tratamiento[]);
  },

  async getByCaso(casoId: string): Promise<Tratamiento[]> {
    const res = await api.getTratamientos({ casoId });
    return res.error ? [] : (res.data as Tratamiento[]);
  },

  async create(data: Omit<Tratamiento, 'id'>): Promise<Tratamiento> {
    const res = await api.createTratamiento(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Tratamiento;
  },

  async update(id: string, data: Partial<Tratamiento>): Promise<Tratamiento | null> {
    const res = await api.updateTratamiento(id, data);
    if (res.error) return null;
    return res.data as Tratamiento;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteTratamiento(id);
      return !res.error;
    } catch {
      return false;
    }
  },
};

// ==================== DESPARASITACIÓN REPOSITORY ====================
export const DesparasitacionRepository = {
  async getAll(params?: Record<string, string>): Promise<Desparasitacion[]> {
    const res = await api.getDesparasitaciones(params);
    if (res.error) return [];
    const raw = res.data as Record<string, unknown>[];
    return raw.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      mascotaId: (item.mascota_id ?? item.mascotaId) as string,
      casoId: (item.caso_id ?? item.casoId ?? null) as string | null,
      producto: item.producto as string,
      dosis: item.dosis as string,
      fecha: item.fecha as string,
      proximaDosis: (item.proxima_dosis ?? item.proximaDosis) as string,
      veterinarioId: (item.veterinario_id ?? item.veterinarioId) as string,
    }));
  },

  async getByMascota(mascotaId: string): Promise<Desparasitacion[]> {
    const res = await api.getDesparasitaciones({ mascotaId });
    if (res.error) return [];
    const raw = res.data as Record<string, unknown>[];
    return raw.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      mascotaId: (item.mascota_id ?? item.mascotaId) as string,
      casoId: (item.caso_id ?? item.casoId ?? null) as string | null,
      producto: item.producto as string,
      dosis: item.dosis as string,
      fecha: item.fecha as string,
      proximaDosis: (item.proxima_dosis ?? item.proximaDosis) as string,
      veterinarioId: (item.veterinario_id ?? item.veterinarioId) as string,
    }));
  },

  async getByCaso(casoId: string): Promise<Desparasitacion[]> {
    const res = await api.getDesparasitaciones({ casoId });
    if (res.error) return [];
    const raw = res.data as Record<string, unknown>[];
    return raw.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      mascotaId: (item.mascota_id ?? item.mascotaId) as string,
      casoId: (item.caso_id ?? item.casoId ?? null) as string | null,
      producto: item.producto as string,
      dosis: item.dosis as string,
      fecha: item.fecha as string,
      proximaDosis: (item.proxima_dosis ?? item.proximaDosis) as string,
      veterinarioId: (item.veterinario_id ?? item.veterinarioId) as string,
    }));
  },

  async create(data: Omit<Desparasitacion, 'id'>): Promise<Desparasitacion> {
    const res = await api.createDesparasitacion(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Desparasitacion;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteDesparasitacion(id);
      return !res.error;
    } catch {
      return false;
    }
  },
};

// ==================== CIRUGÍA REPOSITORY ====================
export const CirugiaRepository = {
  async getAll(params?: Record<string, string>): Promise<Cirugia[]> {
    const res = await api.getCirugias(params);
    return res.error ? [] : (res.data as Cirugia[]);
  },

  async getByMascota(mascotaId: string): Promise<Cirugia[]> {
    const res = await api.getCirugias({ mascotaId });
    return res.error ? [] : (res.data as Cirugia[]);
  },

  async getByCaso(casoId: string): Promise<Cirugia[]> {
    const res = await api.getCirugias({ casoId });
    return res.error ? [] : (res.data as Cirugia[]);
  },

  async create(data: Omit<Cirugia, 'id'>): Promise<Cirugia> {
    const res = await api.createCirugia(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Cirugia;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteCirugia(id);
      return !res.error;
    } catch {
      return false;
    }
  },
};

// ==================== EXAMEN REPOSITORY ====================
export const ExamenRepository = {
  async getAll(params?: Record<string, string>): Promise<Examen[]> {
    const res = await api.getExamenes(params);
    return res.error ? [] : (res.data as Examen[]);
  },

  async getByMascota(mascotaId: string): Promise<Examen[]> {
    const res = await api.getExamenes({ mascotaId });
    return res.error ? [] : (res.data as Examen[]);
  },

  async getByCaso(casoId: string): Promise<Examen[]> {
    const res = await api.getExamenes({ casoId });
    return res.error ? [] : (res.data as Examen[]);
  },

  async create(data: Omit<Examen, 'id'>): Promise<Examen> {
    const res = await api.createExamen(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Examen;
  },

  async uploadRadiograph(
    mascotaId: string,
    data: { image: File; fecha: string; descripcion: string; titulo?: string; casoId?: string },
  ): Promise<Examen> {
    const res = await api.uploadMascotaRadiograph(mascotaId, data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Examen;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteExamen(id);
      return !res.error;
    } catch {
      return false;
    }
  },
};

// ==================== PESO REPOSITORY ====================
export const PesoRepository = {
  async getByMascota(mascotaId: string): Promise<PesoRegistrado[]> {
    const res = await api.getPesos(mascotaId);
    return res.error ? [] : (res.data as PesoRegistrado[]);
  },

  async create(data: Omit<PesoRegistrado, 'id'>): Promise<PesoRegistrado> {
    const res = await api.createPeso(data.mascotaId, data.peso, data.fecha);
    if (res.error) throw new Error(res.error.message);
    return res.data as PesoRegistrado;
  },
};

// ==================== AUDIT LOG REPOSITORY ====================
export const AuditRepository = {
  async getAll(params?: Record<string, string>): Promise<AuditLog[]> {
    const res = await api.getAuditoria(params);
    if (res.error) return [];
    return normalizeAuditLogs(res.data);
  },

  async getByEntidad(entidad: string, entidadId?: string): Promise<AuditLog[]> {
    const res = await api.getAuditoriaEntidad(entidad, entidadId || '');
    if (res.error) return [];
    return normalizeAuditLogs(res.data);
  },

  async getByMascota(mascotaId: string): Promise<AuditLog[]> {
    const res = await api.getAuditoriaMascota(mascotaId);
    if (res.error) return [];
    return normalizeAuditLogs(res.data);
  },

  async registerReferralExport(mascotaId: string, data: { incluyeRadiografias: boolean }): Promise<boolean> {
    const res = await api.registerMascotaReferralExport(mascotaId, data);
    return !res.error;
  },

  async search(filters: { usuario?: string; accion?: string; entidad?: string; desde?: string; hasta?: string }): Promise<AuditLog[]> {
    const params: Record<string, string> = {};
    if (filters.usuario) params.usuario = filters.usuario;
    if (filters.accion) params.accion = filters.accion;
    if (filters.entidad) params.entidad = filters.entidad;
    if (filters.desde) params.desde = filters.desde;
    if (filters.hasta) params.hasta = filters.hasta;
    const res = await api.getAuditoria(params);
    if (res.error) return [];
    return normalizeAuditLogs(res.data);
  },
};

function normalizeAuditLogs(data: unknown): AuditLog[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: Record<string, unknown>) => ({
    ...(item as unknown as AuditLog),
    valoresAntes: (item.valoresAntes ?? item.valoresAnteriores ?? null) as Record<string, unknown> | null,
    valoresDespues: (item.valoresDespues ?? item.valoresNuevos ?? null) as Record<string, unknown> | null,
    diff: (item.diff ?? item.diffCampos ?? []) as AuditLog['diff'],
  })).sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
}

// ==================== HOSPITALIZACIÓN REPOSITORY ====================
export const HospitalizacionRepository = {
  async getAll(): Promise<Hospitalizacion[]> {
    const res = await api.getHospitalizaciones();
    return res.error ? [] : (res.data as Hospitalizacion[]);
  },

  async getActivas(): Promise<Hospitalizacion[]> {
    const res = await api.getHospitalizaciones({ estado: 'hospitalizado' });
    return res.error ? [] : (res.data as Hospitalizacion[]);
  },

  async getById(id: string): Promise<Hospitalizacion | undefined> {
    const res = await api.getHospitalizacionById(id);
    return res.error ? undefined : (res.data as Hospitalizacion);
  },

  async getByMascota(mascotaId: string): Promise<Hospitalizacion[]> {
    const res = await api.getHospitalizaciones({ mascotaId });
    return res.error ? [] : (res.data as Hospitalizacion[]);
  },

  async create(data: Omit<Hospitalizacion, 'id'>): Promise<Hospitalizacion> {
    const res = await api.createHospitalizacion(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Hospitalizacion;
  },

  async update(id: string, data: Partial<Hospitalizacion>): Promise<Hospitalizacion | null> {
    const res = await api.updateHospitalizacion(id, data);
    if (res.error) return null;
    return res.data as Hospitalizacion;
  },

  async darAlta(id: string, resumenAlta: string, indicacionesAlta: string): Promise<Hospitalizacion | null> {
    const res = await api.darAltaHospitalizacion(id, { resumenAlta, indicacionesAlta });
    if (res.error) return null;
    return res.data as Hospitalizacion;
  },
};

// ==================== MEDICACIÓN REPOSITORY ====================
export const MedicacionRepository = {
  async getByHospitalizacion(hospitalizacionId: string): Promise<Medicacion[]> {
    const res = await api.getMedicaciones(hospitalizacionId);
    return res.error ? [] : (res.data as Medicacion[]);
  },

  async getByMascota(mascotaId: string): Promise<Medicacion[]> {
    const hospRes = await api.getHospitalizaciones({ mascotaId });
    if (hospRes.error) return [];
    const hosps = hospRes.data as Hospitalizacion[];
    const results = await Promise.all(
      hosps.map(async (hosp) => {
        const medRes = await api.getMedicaciones(hosp.id);
        return !medRes.error && medRes.data ? medRes.data as Medicacion[] : [];
      })
    );
    return results.flat();
  },

  async create(data: Omit<Medicacion, 'id'>): Promise<Medicacion> {
    const res = await api.createMedicacion(data.hospitalizacionId, data);
    if (res.error) throw new Error(res.error.message);
    return res.data as Medicacion;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await api.deleteMedicacion(id);
      return !res.error;
    } catch {
      return false;
    }
  },

  async registrarToma(medicacionId: string, tomaId: string, horaReal: string): Promise<Medicacion | null> {
    const res = await api.administrarToma(medicacionId, tomaId, horaReal);
    if (res.error) return null;
    return res.data as Medicacion;
  },
};

// ==================== EVOLUCIÓN DIARIA REPOSITORY ====================
export const EvolucionRepository = {
  async getByHospitalizacion(hospitalizacionId: string): Promise<EvolucionDiaria[]> {
    const res = await api.getEvoluciones(hospitalizacionId);
    if (res.error) return [];
    return (res.data as EvolucionDiaria[]).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  },

  async create(data: Omit<EvolucionDiaria, 'id'>): Promise<EvolucionDiaria> {
    const res = await api.createEvolucion(data.hospitalizacionId, data);
    if (res.error) throw new Error(res.error.message);
    return res.data as EvolucionDiaria;
  },
};

// ==================== CAMPAÑA REPOSITORY ====================
export const CampanaRepository = {
  async getAll(): Promise<CampanaEnvio[]> {
    const res = await api.getCampanaEnvios();
    return res.error ? [] : (res.data as CampanaEnvio[]);
  },

  async getBySegmento(segmento: string): Promise<CampanaEnvio[]> {
    const res = await api.getCampanaEnvios(segmento);
    return res.error ? [] : (res.data as CampanaEnvio[]);
  },

  async calcularSegmentos(): Promise<Record<string, { clienteId: string; mascotaId: string | null; motivo: string }[]>> {
    const res = await api.getCampanaSegmentos();
    if (res.error) return {};
    return res.data as Record<string, { clienteId: string; mascotaId: string | null; motivo: string }[]>;
  },

  async enviar(segmento: string, envios: { clienteId: string; mascotaId: string | null; motivo: string }[]): Promise<{ total: number; error?: string }> {
    // El backend calcula y envía las campañas automáticamente
    // Este método es para compatibilidad con el frontend
    return { total: envios.length };
  },
};

// ==================== PUNTUACIÓN DE CITA REPOSITORY ====================
export const PuntuacionRepository = {
  async getAll(): Promise<PuntuacionCita[]> {
    const res = await api.getPuntuaciones();
    return res.error ? [] : (res.data as PuntuacionCita[]);
  },

  async getByCita(citaId: string): Promise<PuntuacionCita | undefined> {
    const res = await api.getPuntuacionByCita(citaId);
    return res.error ? undefined : (res.data as PuntuacionCita);
  },

  async getPuntuacionByToken(token: string): Promise<PuntuacionCita | undefined> {
    const res = await api.getPuntuacionByToken(token);
    return res.error ? undefined : (res.data as PuntuacionCita);
  },

  async getByCitaIdOrCreate(citaId: string): Promise<PuntuacionCita | null> {
    // Intentar obtener existente primero
    const existing = await this.getByCita(citaId);
    if (existing) return existing;
    // Si no existe, crear una nueva
    const res = await api.createPuntuacion(citaId);
    if (res.error) return null;
    return res.data as PuntuacionCita;
  },

  async responder(
    token: string,
    calificacion: number,
    recomienda: boolean,
    comentario: string | null
  ): Promise<PuntuacionCita | null> {
    const res = await api.responderPuntuacion(token, {
      calificacion,
      recomienda,
      comentario,
    });
    if (res.error) return null;
    return res.data as PuntuacionCita;
  },

  async getStats(): Promise<{
    promedio: number;
    total: number;
    respondidas: number;
    pendientes: number;
    recomienda: number;
    porEstrella: Record<number, number>;
    porVeterinario?: Array<{ veterinarioId: string; nombre: string; promedio: number; total: number }>;
    comentarios?: string[];
  }> {
    const res = await api.getPuntuacionesStats();
    if (res.error) {
      return { promedio: 0, total: 0, respondidas: 0, pendientes: 0, recomienda: 0, porEstrella: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    const stats = res.data as {
      promedio: number;
      total: number;
      respondidas: number;
      pendientes: number;
      recomienda: number;
      porEstrella?: Record<number, number>;
      porVeterinario?: Array<{ veterinarioId: string; nombre: string; promedio: number; total: number }>;
      comentarios?: string[];
    };
    // Ensure porEstrella has default values even if backend doesn't return it
    return {
      ...stats,
      porEstrella: stats.porEstrella || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  },

  async getPendientes(): Promise<PuntuacionCita[]> {
    const res = await api.getPuntuacionesPendientes();
    return res.error ? [] : (res.data as PuntuacionCita[]);
  },
};

// ==================== CATÁLOGO REPOSITORY ====================
export const CatalogoRepository = {
  // --- Vacunas ---
  async getVacunasActivas(): Promise<import('./models').CatalogoVacuna[]> {
    const res = await api.getCatalogoVacunas();
    return res.error ? [] : (res.data as import('./models').CatalogoVacuna[]).filter(v => v.activa);
  },

  async getAllVacunas(): Promise<import('./models').CatalogoVacuna[]> {
    const res = await api.getCatalogoVacunas();
    return res.error ? [] : (res.data as import('./models').CatalogoVacuna[]);
  },

  async getVacunaById(id: string): Promise<import('./models').CatalogoVacuna | undefined> {
    const all = await this.getAllVacunas();
    return all.find(v => v.id === id);
  },

  async createVacuna(data: Omit<import('./models').CatalogoVacuna, 'id'>): Promise<import('./models').CatalogoVacuna> {
    const res = await api.createCatalogoVacuna(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as import('./models').CatalogoVacuna;
  },

  async updateVacuna(id: string, data: Partial<import('./models').CatalogoVacuna>): Promise<import('./models').CatalogoVacuna | null> {
    const res = await api.updateCatalogoVacuna(id, data);
    if (res.error) return null;
    return res.data as import('./models').CatalogoVacuna;
  },

  async deleteVacuna(id: string): Promise<boolean> {
    try {
      const res = await api.deleteCatalogoVacuna(id);
      return !res.error;
    } catch {
      return false;
    }
  },

  // --- Desparasitación ---
  async getDesparasitacionActivas(): Promise<import('./models').CatalogoDesparasitacion[]> {
    const res = await api.getCatalogoDesparasitacion();
    if (res.error) return [];
    const raw = res.data as Record<string, unknown>[];
    const mapped = raw.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      nombre: item.nombre as string,
      intervaloMeses: (item.intervalo_meses ?? item.intervaloMeses ?? 3) as number,
      via: (item.via ?? 'Oral') as 'Oral' | 'Subcutánea' | 'Tópica' | 'Inyectable',
      activa: (item.activa ?? true) as boolean,
    }));
    return mapped.filter(d => d.activa);
  },

  async getAllDesparasitaciones(): Promise<import('./models').CatalogoDesparasitacion[]> {
    const res = await api.getCatalogoDesparasitacion();
    if (res.error) return [];
    const raw = res.data as Record<string, unknown>[];
    return raw.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      nombre: item.nombre as string,
      intervaloMeses: (item.intervalo_meses ?? item.intervaloMeses ?? 3) as number,
      via: (item.via ?? 'Oral') as 'Oral' | 'Subcutánea' | 'Tópica' | 'Inyectable',
      activa: (item.activa ?? true) as boolean,
    }));
  },

  async getDesparasitacionById(id: string): Promise<import('./models').CatalogoDesparasitacion | undefined> {
    const all = await this.getAllDesparasitaciones();
    return all.find(d => d.id === id);
  },

  async createDesparasitacion(data: Omit<import('./models').CatalogoDesparasitacion, 'id'>): Promise<import('./models').CatalogoDesparasitacion> {
    const res = await api.createCatalogoDesparasitacion(data);
    if (res.error) throw new Error(res.error.message);
    return res.data as import('./models').CatalogoDesparasitacion;
  },

  async updateDesparasitacion(id: string, data: Partial<import('./models').CatalogoDesparasitacion>): Promise<import('./models').CatalogoDesparasitacion | null> {
    const res = await api.updateCatalogoDesparasitacion(id, data);
    if (res.error) return null;
    return res.data as import('./models').CatalogoDesparasitacion;
  },

  async deleteDesparasitacion(id: string): Promise<boolean> {
    try {
      const res = await api.deleteCatalogoDesparasitacion(id);
      return !res.error;
    } catch {
      return false;
    }
  },
};

// ==================== BÚSQUEDA GLOBAL ====================
export const BusquedaRepository = {
  async global(query: string): Promise<{
    clientes: Cliente[];
    mascotas: Mascota[];
    citas: Cita[];
    casos: CasoClinico[];
  }> {
    const res = await api.searchGlobal(query);
    if (res.error) {
      return { clientes: [], mascotas: [], citas: [], casos: [] };
    }
    const data = res.data as {
      clientes?: Cliente[];
      mascotas?: Mascota[];
      citas?: Cita[];
      casos?: CasoClinico[];
    };
    return {
      clientes: data.clientes || [],
      mascotas: data.mascotas || [],
      citas: data.citas || [],
      casos: data.casos || [],
    };
  },
};
