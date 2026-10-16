// Capa de repositorios para NANIVET
// Todos los datos son mock (en memoria). Esta capa permite reemplazar
// fácilmente por una implementación con BD real en el futuro.

import {
  usuarios, veterinarios, horariosBloqueados,
  clientes, mascotas, citas, casosClinicos,
  vacunas, tratamientos, desparasitaciones, cirugias, examenes,
  pesosRegistrados,
  auditLogs, encuestas, hospitalizaciones, medicaciones, evoluciones, campanaEnvios,
} from './mock-data';
import type {
  UsuarioAuth, Veterinario, HorarioBloqueado,
  Cliente, Mascota, Cita, CasoClinico,
  Vacuna, Tratamiento, Desparasitacion, Cirugia, Examen, PesoRegistrado,
  AuditLog, Encuesta, Hospitalizacion, Medicacion, EvolucionDiaria, CampanaEnvio,
} from './models';
import { genId, genToken, ahora, LIMITE_HORAS_CANCELAR } from './constants';

// Simular latencia mínima
function delay(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== AUDIT HELPER ====================
function logAudit(entry: Omit<AuditLog, 'id' | 'fechaHora'>): void {
  auditLogs.push({ ...entry, id: genId('aud'), fechaHora: ahora() });
}

// ==================== AUTH REPOSITORY ====================
export const AuthRepository = {
  async login(email: string, password: string): Promise<UsuarioAuth | null> {
    await delay();
    const user = usuarios.find(
      (u) => u.email === email && u.password === password
    );
    return user ? { ...user } : null;
  },

  getById(id: string): UsuarioAuth | undefined {
    return usuarios.find((u) => u.id === id);
  },
};

// ==================== VETERINARIO REPOSITORY ====================
export const VeterinarioRepository = {
  async getAll(): Promise<Veterinario[]> {
    await delay();
    return [...veterinarios];
  },

  getById(id: string): Veterinario | undefined {
    return veterinarios.find((v) => v.id === v.id);
  },

  async getBloqueos(veterinarioId?: string): Promise<HorarioBloqueado[]> {
    await delay();
    return horariosBloqueados.filter((b) => !veterinarioId || b.veterinarioId === veterinarioId);
  },

  async addBloqueo(veterinarioId: string, fecha: string, motivo: string): Promise<HorarioBloqueado> {
    await delay();
    const bloqueo: HorarioBloqueado = { id: genId('blk'), veterinarioId, fecha, motivo };
    horariosBloqueados.push(bloqueo);
    return bloqueo;
  },

  async removeBloqueo(id: string): Promise<void> {
    await delay();
    const idx = horariosBloqueados.findIndex((b) => b.id === id);
    if (idx >= 0) horariosBloqueados.splice(idx, 1);
  },
};

// ==================== CLIENTE REPOSITORY ====================
export const ClienteRepository = {
  async getAll(): Promise<Cliente[]> {
    await delay();
    return [...clientes];
  },

  getById(id: string): Cliente | undefined {
    return clientes.find((c) => c.id === id);
  },

  async create(data: Omit<Cliente, 'id'>): Promise<Cliente> {
    await delay();
    const nuevo: Cliente = { ...data, id: genId('cli') };
    clientes.push(nuevo);
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'crear', entidad: 'Cliente', entidadId: nuevo.id, valoresDespues: { nombre: nuevo.nombre, apellido: nuevo.apellido } as Record<string, unknown> });
    return nuevo;
  },

  async update(id: string, data: Partial<Cliente>): Promise<Cliente | null> {
    await delay();
    const idx = clientes.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    const antes = { ...clientes[idx] };
    clientes[idx] = { ...clientes[idx], ...data, id };
    const diff = Object.keys(data).filter(k => k !== 'id').map(k => ({
      campo: k,
      antes: JSON.stringify((antes as Record<string, unknown>)[k]),
      despues: JSON.stringify((data as Record<string, unknown>)[k]),
    }));
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'editar', entidad: 'Cliente', entidadId: id, diff });
    return clientes[idx];
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = clientes.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    const tieneMascotas = mascotas.some((m) => m.clienteId === id);
    if (tieneMascotas) return false;
    clientes.splice(idx, 1);
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'eliminar', entidad: 'Cliente', entidadId: id });
    return true;
  },

  async search(query: string): Promise<Cliente[]> {
    await delay();
    const q = query.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.apellido.toLowerCase().includes(q) ||
        c.cedula.includes(q) ||
        c.telefono.includes(q)
    );
  },

  async revocarConsentimiento(id: string): Promise<Cliente | null> {
    await delay();
    const idx = clientes.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    clientes[idx].consentimientoDatos = { aceptado: false, fechaHora: null, versionAviso: null };
    clientes[idx].consentimientoComunicaciones = { aceptado: false, fechaHora: null };
    clientes[idx].fechaRevocacion = ahora();
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'revocar', entidad: 'Cliente', entidadId: id, valoresDespues: { fechaRevocacion: clientes[idx].fechaRevocacion } as Record<string, unknown> });
    return clientes[idx];
  },
};

// ==================== MASCOTA REPOSITORY ====================
export const MascotaRepository = {
  async getAll(): Promise<Mascota[]> {
    await delay();
    return [...mascotas];
  },

  async getByCliente(clienteId: string): Promise<Mascota[]> {
    await delay();
    return mascotas.filter((m) => m.clienteId === clienteId);
  },

  getById(id: string): Mascota | undefined {
    return mascotas.find((m) => m.id === id);
  },

  async create(data: Omit<Mascota, 'id'>): Promise<Mascota> {
    await delay();
    const nuevo: Mascota = { ...data, id: genId('mas') };
    mascotas.push(nuevo);
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'crear', entidad: 'Mascota', entidadId: nuevo.id, valoresDespues: { nombre: nuevo.nombre, especie: nuevo.especie } as Record<string, unknown> });
    return nuevo;
  },

  async update(id: string, data: Partial<Mascota>): Promise<Mascota | null> {
    await delay();
    const idx = mascotas.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    mascotas[idx] = { ...mascotas[idx], ...data, id };
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'editar', entidad: 'Mascota', entidadId: id });
    return mascotas[idx];
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = mascotas.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    mascotas.splice(idx, 1);
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'eliminar', entidad: 'Mascota', entidadId: id });
    return true;
  },

  async search(query: string): Promise<Mascota[]> {
    await delay();
    const q = query.toLowerCase();
    return mascotas.filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        m.especie.toLowerCase().includes(q) ||
        (m.raza || '').toLowerCase().includes(q)
    );
  },
};

// ==================== CITA REPOSITORY ====================
export const CitaRepository = {
  async getAll(): Promise<Cita[]> {
    await delay();
    return [...citas];
  },

  async getByFecha(fecha: string): Promise<Cita[]> {
    await delay();
    return citas.filter((c) => c.fechaHora.startsWith(fecha));
  },

  async getByVeterinario(veterinarioId: string): Promise<Cita[]> {
    await delay();
    return citas.filter((c) => c.veterinarioId === veterinarioId);
  },

  async getByMascota(mascotaId: string): Promise<Cita[]> {
    await delay();
    return citas.filter((c) => c.mascotaId === mascotaId);
  },

  getById(id: string): Cita | undefined {
    return citas.find((c) => c.id === id);
  },

  getByToken(token: string): Cita | undefined {
    return citas.find((c) => c.token === token);
  },

  async create(data: Omit<Cita, 'id' | 'token'>): Promise<Cita> {
    await delay();
    const nuevo: Cita = { ...data, id: genId('cit'), token: genToken() };
    citas.push(nuevo);
    logAudit({ usuario: 'Sistema', rol: 'recepcionista', accion: 'crear', entidad: 'Cita', entidadId: nuevo.id, valoresDespues: { mascotaId: nuevo.mascotaId, motivo: nuevo.motivo } as Record<string, unknown> });

    // Si es una cita de cirugía y está confirmada o atendida, crear hospitalización automática
    if (nuevo.tipoServicio === 'cirugia' && (nuevo.estado === 'confirmada' || nuevo.estado === 'atendida')) {
      const yaHospitalizada = hospitalizaciones.some(h => h.citaId === nuevo.id && h.estado === 'hospitalizado');
      if (!yaHospitalizada) {
        const jaulasDisponibles = ['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06'];
        const jaulasOcupadas = hospitalizaciones.filter(h => h.estado === 'hospitalizado').map(h => h.jaulaArea);
        const jaula = jaulasDisponibles.find(j => !jaulasOcupadas.includes(j)) || 'C-01';
        const nuevaHospitalizacion: Hospitalizacion = {
          id: genId('hos'),
          mascotaId: nuevo.mascotaId,
          casoId: null,
          veterinarioId: nuevo.veterinarioId,
          citaId: nuevo.id,
          fechaIngreso: nuevo.fechaHora,
          fechaAlta: null,
          jaulaArea: jaula,
          motivo: `Post-operatorio: ${nuevo.motivo}`,
          estado: 'hospitalizado',
        };
        hospitalizaciones.push(nuevaHospitalizacion);
        logAudit({
          usuario: 'Sistema',
          rol: 'admin',
          accion: 'alta_hospitalizacion',
          entidad: 'Hospitalizacion',
          entidadId: nuevaHospitalizacion.id,
          valoresDespues: { mascotaId: nuevaHospitalizacion.mascotaId, motivo: nuevaHospitalizacion.motivo, citaId: nuevo.id } as Record<string, unknown>,
        });
      }
    }

    return nuevo;
  },

  async update(id: string, data: Partial<Cita>): Promise<Cita | null> {
    await delay();
    const idx = citas.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    const antes = { ...citas[idx] };
    citas[idx] = { ...citas[idx], ...data, id };
    const diff = Object.keys(data).filter(k => k !== 'id').map(k => ({
      campo: k,
      antes: JSON.stringify((antes as Record<string, unknown>)[k] ?? ''),
      despues: JSON.stringify((data as Record<string, unknown>)[k] ?? ''),
    }));
    logAudit({ usuario: 'Sistema', rol: 'recepcionista', accion: 'editar', entidad: 'Cita', entidadId: id, diff });

    // Si es una cita de cirugía y cambió a 'confirmada' o 'atendida', crear hospitalización automática
    const nuevaCita = citas[idx];
    if (nuevaCita.tipoServicio === 'cirugia' && (data.estado === 'confirmada' || data.estado === 'atendida')) {
      const yaHospitalizada = hospitalizaciones.some(h => h.citaId === id && h.estado === 'hospitalizado');
      if (!yaHospitalizada) {
        const jaulasDisponibles = ['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06'];
        const jaulasOcupadas = hospitalizaciones.filter(h => h.estado === 'hospitalizado').map(h => h.jaulaArea);
        const jaula = jaulasDisponibles.find(j => !jaulasOcupadas.includes(j)) || 'C-01';
        const nuevaHospitalizacion: Hospitalizacion = {
          id: genId('hos'),
          mascotaId: nuevaCita.mascotaId,
          casoId: null,
          veterinarioId: nuevaCita.veterinarioId,
          citaId: id,
          fechaIngreso: nuevaCita.fechaHora,
          fechaAlta: null,
          jaulaArea: jaula,
          motivo: `Post-operatorio: ${nuevaCita.motivo}`,
          estado: 'hospitalizado',
        };
        hospitalizaciones.push(nuevaHospitalizacion);
        logAudit({
          usuario: 'Sistema',
          rol: 'admin',
          accion: 'alta_hospitalizacion',
          entidad: 'Hospitalizacion',
          entidadId: nuevaHospitalizacion.id,
          valoresDespues: { mascotaId: nuevaHospitalizacion.mascotaId, motivo: nuevaHospitalizacion.motivo, citaId: id } as Record<string, unknown>,
        });
      }
    }

    return citas[idx];
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = citas.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    citas.splice(idx, 1);
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'eliminar', entidad: 'Cita', entidadId: id });
    return true;
  },

  async getSlotsOcupados(veterinarioId: string, fecha: string): Promise<string[]> {
    await delay();
    return citas
      .filter((c) => c.veterinarioId === veterinarioId && c.fechaHora.startsWith(fecha) && c.estado !== 'cancelada')
      .map((c) => {
        const d = new Date(c.fechaHora);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      });
  },

  // --- Gestión pública por token ---
  async confirmarPorToken(token: string): Promise<Cita | null> {
    await delay();
    const idx = citas.findIndex((c) => c.token === token);
    if (idx < 0) return null;
    if (citas[idx].estado === 'cancelada') return null;
    citas[idx].estado = 'confirmada';
    citas[idx].confirmadaPorCliente = true;
    citas[idx].fechaConfirmacion = ahora();
    citas[idx].ultimoCambioPor = 'cliente';
    logAudit({ usuario: 'Cliente (token)', rol: 'cliente', accion: 'confirmar', entidad: 'Cita', entidadId: citas[idx].id, diff: [{ campo: 'estado', antes: 'pendiente', despues: 'confirmada' }] });
    return citas[idx];
  },

  async cancelarPorToken(token: string, motivo: string): Promise<{ ok: boolean; cita: Cita | null; error?: string }> {
    await delay();
    const idx = citas.findIndex((c) => c.token === token);
    if (idx < 0) return { ok: false, cita: null, error: 'Token no válido' };
    const cita = citas[idx];
    if (cita.estado === 'cancelada' || cita.estado === 'atendida') {
      return { ok: false, cita: null, error: 'La cita ya no se puede cancelar' };
    }
    const fechaCita = new Date(cita.fechaHora);
    const ahoraDate = new Date(ahora());
    const horasDiff = (fechaCita.getTime() - ahoraDate.getTime()) / (1000 * 60 * 60);
    if (horasDiff < LIMITE_HORAS_CANCELAR) {
      return { ok: false, cita, error: `No se puede cancelar con menos de ${LIMITE_HORAS_CANCELAR}h de anticipación` };
    }
    citas[idx].estado = 'cancelada';
    citas[idx].motivoCancelacion = motivo;
    citas[idx].canceladaPorCliente = true;
    citas[idx].ultimoCambioPor = 'cliente';
    logAudit({ usuario: 'Cliente (token)', rol: 'cliente', accion: 'cancelar', entidad: 'Cita', entidadId: cita.id, diff: [{ campo: 'estado', antes: cita.estado, despues: 'cancelada' }] });
    return { ok: true, cita: citas[idx] };
  },

  async reprogramarPorToken(token: string, nuevaFechaHora: string): Promise<{ ok: boolean; cita: Cita | null; error?: string }> {
    await delay();
    const idx = citas.findIndex((c) => c.token === token);
    if (idx < 0) return { ok: false, cita: null, error: 'Token no válido' };
    const cita = citas[idx];
    if (cita.estado === 'cancelada' || cita.estado === 'atendida') {
      return { ok: false, cita: null, error: 'La cita ya no se puede reprogramar' };
    }
    const fechaCita = new Date(cita.fechaHora);
    const ahoraDate = new Date(ahora());
    const horasDiff = (fechaCita.getTime() - ahoraDate.getTime()) / (1000 * 60 * 60);
    if (horasDiff < LIMITE_HORAS_CANCELAR) {
      return { ok: false, cita, error: `No se puede reprogramar con menos de ${LIMITE_HORAS_CANCELAR}h de anticipación` };
    }
    const antes = cita.fechaHora;
    citas[idx].fechaHora = nuevaFechaHora;
    citas[idx].ultimoCambioPor = 'cliente';
    logAudit({ usuario: 'Cliente (token)', rol: 'cliente', accion: 'reprogramar', entidad: 'Cita', entidadId: cita.id, diff: [{ campo: 'fechaHora', antes, despues: nuevaFechaHora }] });
    return { ok: true, cita: citas[idx] };
  },
};

// ==================== CASO CLÍNICO REPOSITORY ====================
export const CasoRepository = {
  async getAll(): Promise<CasoClinico[]> {
    await delay();
    return [...casosClinicos];
  },

  async getByMascota(mascotaId: string): Promise<CasoClinico[]> {
    await delay();
    return casosClinicos.filter((c) => c.mascotaId === mascotaId);
  },

  getById(id: string): CasoClinico | undefined {
    return casosClinicos.find((c) => c.id === id);
  },

  async create(data: Omit<CasoClinico, 'id'>): Promise<CasoClinico> {
    await delay();
    const nuevo: CasoClinico = { ...data, id: genId('cas') };
    casosClinicos.push(nuevo);
    logAudit({ usuario: 'Sistema', rol: 'veterinario', accion: 'crear', entidad: 'CasoClinico', entidadId: nuevo.id, valoresDespues: { motivo: nuevo.motivo, mascotaId: nuevo.mascotaId } as Record<string, unknown> });
    return nuevo;
  },

  async update(id: string, data: Partial<CasoClinico>): Promise<CasoClinico | null> {
    await delay();
    const idx = casosClinicos.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    casosClinicos[idx] = { ...casosClinicos[idx], ...data, id };
    logAudit({ usuario: 'Sistema', rol: 'veterinario', accion: 'editar', entidad: 'CasoClinico', entidadId: id });
    return casosClinicos[idx];
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = casosClinicos.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    casosClinicos.splice(idx, 1);
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'eliminar', entidad: 'CasoClinico', entidadId: id });
    return true;
  },
};

// ==================== VACUNA REPOSITORY ====================
export const VacunaRepository = {
  async getAll(): Promise<Vacuna[]> {
    await delay();
    return [...vacunas];
  },

  async getByMascota(mascotaId: string): Promise<Vacuna[]> {
    await delay();
    return vacunas.filter((v) => v.mascotaId === mascotaId);
  },

  async getByCaso(casoId: string): Promise<Vacuna[]> {
    await delay();
    return vacunas.filter((v) => v.casoId === casoId);
  },

  async create(data: Omit<Vacuna, 'id'>): Promise<Vacuna> {
    await delay();
    const nueva: Vacuna = { ...data, id: genId('vac') };
    vacunas.push(nueva);
    logAudit({ usuario: 'Sistema', rol: 'veterinario', accion: 'crear', entidad: 'Vacuna', entidadId: nueva.id, valoresDespues: { nombre: nueva.nombre, mascotaId: nueva.mascotaId } as Record<string, unknown> });
    return nueva;
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = vacunas.findIndex((v) => v.id === id);
    if (idx < 0) return false;
    vacunas.splice(idx, 1);
    logAudit({ usuario: 'Sistema', rol: 'admin', accion: 'eliminar', entidad: 'Vacuna', entidadId: id });
    return true;
  },

  async getPorVencer(diasLimite: number = 30): Promise<Vacuna[]> {
    await delay();
    const hoy = new Date('2026-10-15');
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + diasLimite);
    return vacunas.filter((v) => {
      const prox = new Date(v.proximaDosis);
      return prox >= hoy && prox <= limite;
    });
  },
};

// ==================== TRATAMIENTO REPOSITORY ====================
export const TratamientoRepository = {
  async getAll(): Promise<Tratamiento[]> {
    await delay();
    return [...tratamientos];
  },

  async getByMascota(mascotaId: string): Promise<Tratamiento[]> {
    await delay();
    return tratamientos.filter((t) => t.mascotaId === mascotaId);
  },

  async getByCaso(casoId: string): Promise<Tratamiento[]> {
    await delay();
    return tratamientos.filter((t) => t.casoId === casoId);
  },

  async create(data: Omit<Tratamiento, 'id'>): Promise<Tratamiento> {
    await delay();
    const nuevo: Tratamiento = { ...data, id: genId('tra') };
    tratamientos.push(nuevo);
    return nuevo;
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = tratamientos.findIndex((t) => t.id === id);
    if (idx < 0) return false;
    tratamientos.splice(idx, 1);
    return true;
  },
};

// ==================== DESPARASITACIÓN REPOSITORY ====================
export const DesparasitacionRepository = {
  async getAll(): Promise<Desparasitacion[]> {
    await delay();
    return [...desparasitaciones];
  },

  async getByMascota(mascotaId: string): Promise<Desparasitacion[]> {
    await delay();
    return desparasitaciones.filter((d) => d.mascotaId === mascotaId);
  },

  async getByCaso(casoId: string): Promise<Desparasitacion[]> {
    await delay();
    return desparasitaciones.filter((d) => d.casoId === casoId);
  },

  async create(data: Omit<Desparasitacion, 'id'>): Promise<Desparasitacion> {
    await delay();
    const nueva: Desparasitacion = { ...data, id: genId('des') };
    desparasitaciones.push(nueva);
    return nueva;
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = desparasitaciones.findIndex((d) => d.id === id);
    if (idx < 0) return false;
    desparasitaciones.splice(idx, 1);
    return true;
  },
};

// ==================== CIRUGÍA REPOSITORY ====================
export const CirugiaRepository = {
  async getAll(): Promise<Cirugia[]> {
    await delay();
    return [...cirugias];
  },

  async getByMascota(mascotaId: string): Promise<Cirugia[]> {
    await delay();
    return cirugias.filter((c) => c.mascotaId === mascotaId);
  },

  async getByCaso(casoId: string): Promise<Cirugia[]> {
    await delay();
    return cirugias.filter((c) => c.casoId === casoId);
  },

  async create(data: Omit<Cirugia, 'id'>): Promise<Cirugia> {
    await delay();
    const nueva: Cirugia = { ...data, id: genId('cir') };
    cirugias.push(nueva);
    return nueva;
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = cirugias.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    cirugias.splice(idx, 1);
    return true;
  },
};

// ==================== EXAMEN REPOSITORY ====================
export const ExamenRepository = {
  async getAll(): Promise<Examen[]> {
    await delay();
    return [...examenes];
  },

  async getByMascota(mascotaId: string): Promise<Examen[]> {
    await delay();
    return examenes.filter((e) => e.mascotaId === mascotaId);
  },

  async getByCaso(casoId: string): Promise<Examen[]> {
    await delay();
    return examenes.filter((e) => e.casoId === casoId);
  },

  async create(data: Omit<Examen, 'id'>): Promise<Examen> {
    await delay();
    const nuevo: Examen = { ...data, id: genId('exa') };
    examenes.push(nuevo);
    return nuevo;
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = examenes.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    examenes.splice(idx, 1);
    return true;
  },
};

// ==================== PESO REPOSITORY ====================
export const PesoRepository = {
  async getByMascota(mascotaId: string): Promise<PesoRegistrado[]> {
    await delay();
    return pesosRegistrados
      .filter((p) => p.mascotaId === mascotaId)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  },

  async create(data: Omit<PesoRegistrado, 'id'>): Promise<PesoRegistrado> {
    await delay();
    const nuevo: PesoRegistrado = { ...data, id: genId('pes') };
    pesosRegistrados.push(nuevo);
    return nuevo;
  },
};

// ==================== AUDIT LOG REPOSITORY ====================
export const AuditRepository = {
  async getAll(): Promise<AuditLog[]> {
    await delay(80);
    return [...auditLogs].sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  },

  async getByEntidad(entidad: string, entidadId?: string): Promise<AuditLog[]> {
    await delay(80);
    return auditLogs
      .filter((a) => a.entidad === entidad && (!entidadId || a.entidadId === entidadId))
      .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  },

  async search(filters: { usuario?: string; accion?: string; entidad?: string; desde?: string; hasta?: string }): Promise<AuditLog[]> {
    await delay(80);
    return auditLogs
      .filter((a) => {
        if (filters.usuario && !a.usuario.toLowerCase().includes(filters.usuario.toLowerCase())) return false;
        if (filters.accion && a.accion !== filters.accion) return false;
        if (filters.entidad && a.entidad !== filters.entidad) return false;
        if (filters.desde && a.fechaHora < filters.desde) return false;
        if (filters.hasta && a.fechaHora > filters.hasta) return false;
        return true;
      })
      .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  },

  log: logAudit,
};

// ==================== ENCUESTA REPOSITORY ====================
export const EncuestaRepository = {
  async getAll(): Promise<Encuesta[]> {
    await delay();
    return [...encuestas];
  },

  async getByCita(citaId: string): Promise<Encuesta | undefined> {
    await delay();
    return encuestas.find((e) => e.citaId === citaId);
  },

  getByToken(token: string): Encuesta | undefined {
    return encuestas.find((e) => e.token === token);
  },

  async create(data: Omit<Encuesta, 'id' | 'token'>): Promise<Encuesta> {
    await delay();
    const nueva: Encuesta = { ...data, id: genId('enc'), token: genToken() };
    encuestas.push(nueva);
    return nueva;
  },

  async responder(token: string, calificacion: number, recomienda: boolean, comentario: string | null): Promise<Encuesta | null> {
    await delay();
    const idx = encuestas.findIndex((e) => e.token === token);
    if (idx < 0) return null;
    if (encuestas[idx].respondida) return null;
    encuestas[idx].calificacion = calificacion;
    encuestas[idx].recomienda = recomienda;
    encuestas[idx].comentario = comentario;
    encuestas[idx].fechaRespuesta = ahora();
    encuestas[idx].respondida = true;
    return encuestas[idx];
  },

  async getPromedio(): Promise<{ promedio: number; total: number; recomienda: number }> {
    await delay();
    const respondidas = encuestas.filter((e) => e.respondida);
    if (respondidas.length === 0) return { promedio: 0, total: 0, recomienda: 0 };
    const promedio = respondidas.reduce((sum, e) => sum + e.calificacion, 0) / respondidas.length;
    const recomienda = respondidas.filter((e) => e.recomienda).length;
    return { promedio, total: respondidas.length, recomienda };
  },
};

// ==================== HOSPITALIZACIÓN REPOSITORY ====================
export const HospitalizacionRepository = {
  async getAll(): Promise<Hospitalizacion[]> {
    await delay();
    return [...hospitalizaciones];
  },

  async getActivas(): Promise<Hospitalizacion[]> {
    await delay();
    return hospitalizaciones.filter((h) => h.estado === 'hospitalizado');
  },

  getById(id: string): Hospitalizacion | undefined {
    return hospitalizaciones.find((h) => h.id === id);
  },

  async getByMascota(mascotaId: string): Promise<Hospitalizacion[]> {
    await delay();
    return hospitalizaciones.filter((h) => h.mascotaId === mascotaId);
  },

  async create(data: Omit<Hospitalizacion, 'id'>): Promise<Hospitalizacion> {
    await delay();
    const nueva: Hospitalizacion = { ...data, id: genId('hos') };
    hospitalizaciones.push(nueva);
    logAudit({ usuario: 'Sistema', rol: 'veterinario', accion: 'crear', entidad: 'Hospitalizacion', entidadId: nueva.id, valoresDespues: { mascotaId: nueva.mascotaId, motivo: nueva.motivo } as Record<string, unknown> });
    return nueva;
  },

  async update(id: string, data: Partial<Hospitalizacion>): Promise<Hospitalizacion | null> {
    await delay();
    const idx = hospitalizaciones.findIndex((h) => h.id === id);
    if (idx < 0) return null;
    hospitalizaciones[idx] = { ...hospitalizaciones[idx], ...data, id };
    return hospitalizaciones[idx];
  },

  async darAlta(id: string, resumenAlta: string, indicacionesAlta: string): Promise<Hospitalizacion | null> {
    await delay();
    const idx = hospitalizaciones.findIndex((h) => h.id === id);
    if (idx < 0) return null;
    hospitalizaciones[idx].estado = 'alta';
    hospitalizaciones[idx].fechaAlta = ahora();
    hospitalizaciones[idx].resumenAlta = resumenAlta;
    hospitalizaciones[idx].indicacionesAlta = indicacionesAlta;
    logAudit({ usuario: 'Sistema', rol: 'veterinario', accion: 'alta_hospitalizacion', entidad: 'Hospitalizacion', entidadId: id, diff: [{ campo: 'estado', antes: 'hospitalizado', despues: 'alta' }] });
    return hospitalizaciones[idx];
  },
};

// ==================== MEDICACIÓN REPOSITORY ====================
export const MedicacionRepository = {
  async getByHospitalizacion(hospitalizacionId: string): Promise<Medicacion[]> {
    await delay();
    return medicaciones.filter((m) => m.hospitalizacionId === hospitalizacionId);
  },

  async create(data: Omit<Medicacion, 'id'>): Promise<Medicacion> {
    await delay();
    const nueva: Medicacion = { ...data, id: genId('med') };
    medicaciones.push(nueva);
    return nueva;
  },

  async delete(id: string): Promise<boolean> {
    await delay();
    const idx = medicaciones.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    medicaciones.splice(idx, 1);
    return true;
  },

  async registrarToma(medicacionId: string, fecha: string, hora: string, usuario: string): Promise<Medicacion | null> {
    await delay();
    const idx = medicaciones.findIndex((m) => m.id === medicacionId);
    if (idx < 0) return null;
    const tomaIdx = medicaciones[idx].tomas.findIndex(t => t.fecha === fecha && t.hora === hora);
    if (tomaIdx >= 0) {
      medicaciones[idx].tomas[tomaIdx].administrada = true;
      medicaciones[idx].tomas[tomaIdx].horaReal = ahora().split('T')[1] || '';
      medicaciones[idx].tomas[tomaIdx].usuario = usuario;
    } else {
      medicaciones[idx].tomas.push({ fecha, hora, administrada: true, horaReal: ahora().split('T')[1] || '', usuario });
    }
    return medicaciones[idx];
  },
};

// ==================== EVOLUCIÓN DIARIA REPOSITORY ====================
export const EvolucionRepository = {
  async getByHospitalizacion(hospitalizacionId: string): Promise<EvolucionDiaria[]> {
    await delay();
    return evoluciones
      .filter((e) => e.hospitalizacionId === hospitalizacionId)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  },

  async create(data: Omit<EvolucionDiaria, 'id'>): Promise<EvolucionDiaria> {
    await delay();
    const nueva: EvolucionDiaria = { ...data, id: genId('evd') };
    evoluciones.push(nueva);
    return nueva;
  },
};

// ==================== CAMPAÑA REPOSITORY ====================
export const CampanaRepository = {
  async getAll(): Promise<CampanaEnvio[]> {
    await delay();
    return [...campanaEnvios];
  },

  async getBySegmento(segmento: string): Promise<CampanaEnvio[]> {
    await delay();
    return campanaEnvios.filter((c) => c.segmento === segmento);
  },

  async create(data: Omit<CampanaEnvio, 'id'>): Promise<CampanaEnvio> {
    await delay();
    const nuevo: CampanaEnvio = { ...data, id: genId('cme') };
    campanaEnvios.push(nuevo);
    return nuevo;
  },

  async enviar(segmento: string, envios: Omit<CampanaEnvio, 'id' | 'segmento'>[], enviadoPor: string): Promise<CampanaEnvio[]> {
    await delay(200);
    const nuevos: CampanaEnvio[] = [];
    for (const envio of envios) {
      const nuevo: CampanaEnvio = { ...envio, id: genId('cme'), segmento, fechaEnviado: ahora(), enviadoPor };
      campanaEnvios.push(nuevo);
      nuevos.push(nuevo);
    }
    logAudit({ usuario: enviadoPor, rol: 'admin', accion: 'enviar_campaña', entidad: 'Campana', entidadId: genId('cam'), valoresDespues: { segmento, totalEnvios: envios.length } as Record<string, unknown> });
    return nuevos;
  },

  // Segmentación: calcular destinatarios por segmento
  async calcularSegmento(segmento: string): Promise<{ clienteId: string; mascotaId: string | null; motivo: string }[]> {
    await delay(100);
    const resultados: { clienteId: string; mascotaId: string | null; motivo: string }[] = [];
    const hoy = new Date('2026-10-15');

    // Excluir clientes que revocaron consentimiento de comunicaciones
    const clientesConsent = clientes.filter(c => c.consentimientoComunicaciones.aceptado);

    if (segmento === 'vacunas_vencidas') {
      const limite30 = new Date(hoy); limite30.setDate(limite30.getDate() + 30);
      for (const v of vacunas) {
        const prox = new Date(v.proximaDosis);
        const masc = mascotas.find(m => m.id === v.mascotaId);
        if (!masc) continue;
        const cli = clientesConsent.find(c => c.id === masc.clienteId);
        if (!cli) continue;
        if (prox <= limite30) {
          resultados.push({ clienteId: cli.id, mascotaId: masc.id, motivo: `Vacuna ${v.nombre} vence/próxima: ${v.proximaDosis}` });
        }
      }
    } else if (segmento === 'desparasitacion_pendiente') {
      const limite30 = new Date(hoy); limite30.setDate(limite30.getDate() + 30);
      for (const d of desparasitaciones) {
        const prox = new Date(d.proximaDosis);
        const masc = mascotas.find(m => m.id === d.mascotaId);
        if (!masc) continue;
        const cli = clientesConsent.find(c => c.id === masc.clienteId);
        if (!cli) continue;
        if (prox <= limite30) {
          resultados.push({ clienteId: cli.id, mascotaId: masc.id, motivo: `Desparasitación próxima: ${d.proximaDosis}` });
        }
      }
    } else if (segmento === 'clientes_inactivos') {
      const seisMeses = new Date(hoy); seisMeses.setMonth(seisMeses.getMonth() - 6);
      for (const c of clientesConsent) {
        const mascotasCliente = mascotas.filter(m => m.clienteId === c.id);
        const citasCliente = citas.filter(ci =>
          mascotasCliente.some(m => m.id === ci.mascotaId) && ci.estado === 'atendida'
        );
        const ultimaCita = citasCliente.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())[0];
        if (!ultimaCita || new Date(ultimaCita.fechaHora) < seisMeses) {
          const masc = mascotasCliente[0];
          resultados.push({ clienteId: c.id, mascotaId: masc?.id ?? null, motivo: 'Sin visitas en más de 6 meses' });
        }
      }
    } else if (segmento === 'cumpleanos_mascotas') {
      const mesActual = hoy.getMonth() + 1; // 1-12
      const diaActual = hoy.getDate();
      for (const m of mascotas) {
        const cli = clientesConsent.find(c => c.id === m.clienteId);
        if (!cli) continue;
        const nac = new Date(m.fechaNacimiento);
        if (nac.getMonth() + 1 === mesActual) {
          resultados.push({ clienteId: cli.id, mascotaId: m.id, motivo: `Cumpleaños de ${m.nombre} - ${nac.getDate()}/${mesActual}` });
        }
      }
    }
    return resultados;
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
    await delay(100);
    const q = query.toLowerCase();
    return {
      clientes: clientes.filter(
        (c) => c.nombre.toLowerCase().includes(q) || c.apellido.toLowerCase().includes(q) || c.cedula.includes(q)
      ),
      mascotas: mascotas.filter(
        (m) => m.nombre.toLowerCase().includes(q) || m.especie.toLowerCase().includes(q) || (m.raza || '').toLowerCase().includes(q)
      ),
      citas: citas.filter((c) => c.motivo.toLowerCase().includes(q)),
      casos: casosClinicos.filter(
        (c) => c.motivo.toLowerCase().includes(q) || c.diagnostico.toLowerCase().includes(q)
      ),
    };
  },
};
