'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Lock, UserCog } from 'lucide-react';
import { CitaRepository, MascotaRepository, VeterinarioRepository, VacunaRepository, CirugiaRepository } from '@/lib/repositories';
import { TIPOS_SERVICIO, formatTime, formatDate } from '@/lib/constants';
import { useAuth } from '@/components/auth-provider';
import type { Cita, Mascota, Veterinario, Vacuna, Cirugia, HorarioBloqueado } from '@/lib/models';

type Vista = 'mes' | 'semana' | 'dia';
type CalEvent = { id: string; fecha: string; titulo: string; color: string; tipo: string; hora: string };

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function CalendarioPage() {
  const { user } = useAuth();
  const [vista, setVista] = useState<Vista>('mes');
  const [fechaActual, setFechaActual] = useState(new Date('2026-10-15'));
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [cirugias, setCirugias] = useState<Cirugia[]>([]);
  const [bloqueos, setBloqueos] = useState<HorarioBloqueado[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [selectedVetId, setSelectedVetId] = useState<string | 'all' | null>(null);

  // Determine if user should see vet selector
  const showVetSelector = user && (user.rol === 'admin' || user.rol === 'recepcionista');

  // Auto-select user's vet ID if they are a veterinario
  useEffect(() => {
    if (user?.rol === 'veterinario' && user.veterinarioId) {
      setSelectedVetId(user.veterinarioId);
    } else if (user?.rol === 'admin' || user?.rol === 'recepcionista') {
      // Admin/recepcionista: default to "all"
      setSelectedVetId('all');
    }
  }, [user]);

  // Load all data once on mount
  useEffect(() => {
    (async () => {
      const [c, m, v, vac, cir] = await Promise.all([
        CitaRepository.getAll(), MascotaRepository.getAll(),
        VeterinarioRepository.getAll(), VacunaRepository.getAll(),
        CirugiaRepository.getAll(),
      ]);
      setCitas(c); setMascotas(m); setVets(v); setVacunas(vac); setCirugias(cir);
      setLoading(false);
    })();
  }, []);

  // Load bloqueos when selectedVetId changes
  useEffect(() => {
    if (!user || !selectedVetId) {
      setBloqueos([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const nextBloqueos = selectedVetId === 'all'
        ? (await Promise.all(vets.map(vet => VeterinarioRepository.getBloqueos(vet.id)))).flat()
        : await VeterinarioRepository.getBloqueos(selectedVetId);
      if (!cancelled) setBloqueos(nextBloqueos);
    })();

    return () => { cancelled = true; };
  }, [selectedVetId, user, vets]);

  const mascotasById = useMemo(() => new Map(mascotas.map(m => [m.id, m])), [mascotas]);

  // Build all events
  const allEvents = useMemo<CalEvent[]>(() => [
    ...citas.map(c => {
      const mas = mascotasById.get(c.mascotaId);
      return {
        id: c.id, fecha: c.fechaHora.slice(0, 10),
        titulo: `${mas?.nombre || 'N/A'} - ${TIPOS_SERVICIO[c.tipoServicio].label}`,
        color: TIPOS_SERVICIO[c.tipoServicio].color, tipo: 'Cita',
        hora: formatTime(c.fechaHora),
      };
    }),
    ...vacunas.map(v => {
      const mas = mascotasById.get(v.mascotaId);
      return {
        id: v.id, fecha: v.proximaDosis,
        titulo: `${mas?.nombre || 'N/A'} - Vac. ${v.nombre}`,
        color: 'bg-emerald-500', tipo: 'Vacuna', hora: '09:00',
      };
    }),
    ...cirugias.map(c => {
      const mas = mascotasById.get(c.mascotaId);
      return {
        id: c.id, fecha: c.fecha,
        titulo: `${mas?.nombre || 'N/A'} - Cirugía: ${c.tipo}`,
        color: 'bg-red-500', tipo: 'Cirugía', hora: '08:00',
      };
    }),
  ], [citas, vacunas, cirugias, mascotasById]);

  const eventsByDate = useMemo(() => {
    const index = new Map<string, CalEvent[]>();
    for (const event of allEvents) {
      const dayEvents = index.get(event.fecha);
      if (dayEvents) dayEvents.push(event);
      else index.set(event.fecha, [event]);
    }
    index.forEach((dayEvents) => {
      dayEvents.sort((a, b) => a.hora.localeCompare(b.hora));
    });
    return index;
  }, [allEvents]);

  const blockedDates = useMemo(() => new Set(bloqueos.map(b => b.fecha)), [bloqueos]);

  const getEventsForDate = (dateStr: string) => eventsByDate.get(dateStr) ?? [];
  const isBlocked = (dateStr: string) => blockedDates.has(dateStr);

  const prevPeriod = () => {
    const d = new Date(fechaActual);
    if (vista === 'mes') d.setMonth(d.getMonth() - 1);
    else if (vista === 'semana') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setFechaActual(d);
  };
  const nextPeriod = () => {
    const d = new Date(fechaActual);
    if (vista === 'mes') d.setMonth(d.getMonth() + 1);
    else if (vista === 'semana') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setFechaActual(d);
  };

  const goToday = () => setFechaActual(new Date());

  const headerLabel = (() => {
    if (vista === 'mes') return `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
    if (vista === 'dia') return formatDate(fechaActual);
    // semana
    const start = new Date(fechaActual);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${formatDate(start)} - ${formatDate(end)}`;
  })();

  // Month grid
  const monthGrid = (() => {
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  })();

  // Week days
  const weekDays = (() => {
    const start = new Date(fechaActual);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  })();

  const dateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isToday = (d: Date) => {
    const today = new Date();
    return dateStr(d) === dateStr(today);
  };

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="text-sm text-muted-foreground mt-1">Citas, vacunas próximas y cirugías</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {showVetSelector && (
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <UserCog className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedVetId ?? 'all'} onValueChange={(val) => setSelectedVetId(val as string | 'all' | null)}>
                <SelectTrigger className="min-w-0 flex-1 sm:w-[200px]">
                  <SelectValue placeholder="Seleccionar veterinario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los veterinarios</SelectItem>
                  {vets.map(vet => (
                    <SelectItem key={vet.id} value={vet.id}>
                      {vet.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {(['mes', 'semana', 'dia'] as Vista[]).map(v => (
              <Button key={v} variant={vista === v ? 'default' : 'ghost'} size="sm" className="text-xs" onClick={() => setVista(v)}>
                {v === 'mes' ? 'Mes' : v === 'semana' ? 'Semana' : 'Día'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevPeriod}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={nextPeriod}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={goToday}>Hoy</Button>
            </div>
            <h2 className="text-center text-base font-semibold md:text-left">{headerLabel}</h2>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:justify-end">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Cita</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Vacuna</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Cirugía</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-red-500" /> Bloqueado</span>
            </div>
          </div>

          {/* Month view */}
          {vista === 'mes' && (
            <div className="touch-scroll -mx-2 overflow-x-auto px-2 pb-2">
              <div className="min-w-[640px] md:min-w-0">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((d, i) => {
                  if (!d) return <div key={i} className="min-h-[80px] rounded-lg bg-muted/20 border border-border/20" />;
                  const ds = dateStr(d);
                  const events = getEventsForDate(ds);
                  const today = isToday(d);
                  const blocked = isBlocked(ds);
                  return (
                    <div key={i} className={`min-h-[80px] rounded-lg border p-1.5 cursor-pointer transition-colors ${blocked ? 'border-red-300 bg-red-50/50' : today ? 'border-sky-400 bg-sky-100' : 'border-border/30 hover:border-border'}`}>
                      <div className={`text-xs font-medium mb-1 ${today ? 'text-sky-700' : blocked ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {d.getDate()}
                        {blocked && <span className="ml-1" title="Día bloqueado">🔒</span>}
                      </div>
                      <div className="space-y-0.5">
                        {events.slice(0, 3).map(e => (
                          <div key={`${e.id}-${e.tipo}`} className={`cal-event ${e.color} text-white`} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}>
                            <span className="hidden sm:inline">{e.hora} </span>{e.titulo}
                          </div>
                        ))}
                        {events.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{events.length - 3} más</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {/* Week view */}
          {vista === 'semana' && (
            <div className="touch-scroll -mx-2 overflow-x-auto px-2 pb-2">
              <div className="grid min-w-[720px] grid-cols-7 gap-1 md:min-w-0">
              {weekDays.map((d, i) => {
                const ds = dateStr(d);
                const events = getEventsForDate(ds);
                const today = isToday(d);
                const blocked = isBlocked(ds);
                return (
                  <div key={i} className={`rounded-lg border p-2 min-h-[200px] ${blocked ? 'border-red-300 bg-red-50/50' : today ? 'border-sky-400 bg-sky-100' : 'border-border/30'}`}>
                    <div className={`text-xs font-medium mb-2 ${today ? 'text-sky-700' : blocked ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {DIAS_SEMANA[d.getDay()]} {d.getDate()}
                      {blocked && <span className="ml-1" title="Día bloqueado">🔒</span>}
                    </div>
                    <div className="space-y-1">
                      {events.map(e => (
                        <div key={`${e.id}-${e.tipo}`} className={`cal-event ${e.color} text-white`} onClick={() => setSelectedEvent(e)}>
                          <span className="font-mono">{e.hora}</span> {e.titulo}
                        </div>
                      ))}
                      {events.length === 0 && <p className="text-[10px] text-muted-foreground">Sin eventos</p>}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* Day view */}
          {vista === 'dia' && (
            <div className="space-y-1 max-w-2xl mx-auto">
              {Array.from({ length: 12 }, (_, i) => {
                const hour = i + 7; // 7am to 6pm
                const ds = dateStr(fechaActual);
                const events = getEventsForDate(ds).filter(e => parseInt(e.hora.split(':')[0]) === hour);
                return (
                  <div key={hour} className="flex gap-3 border-b border-border/20 py-2">
                    <div className="w-16 text-xs font-mono text-muted-foreground pt-1">{String(hour).padStart(2, '0')}:00</div>
                    <div className="flex-1 space-y-1">
                      {events.map(e => (
                        <div key={`${e.id}-${e.tipo}`} className={`cal-event ${e.color} text-white`} onClick={() => setSelectedEvent(e)}>
                          {e.hora} - {e.titulo}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event detail popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedEvent(null)}>
          <Card className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${selectedEvent.color}`} />
                <Badge variant="secondary">{selectedEvent.tipo}</Badge>
              </div>
              <p className="font-medium text-sm">{selectedEvent.titulo}</p>
              <p className="text-xs text-muted-foreground">{formatDate(selectedEvent.fecha)} a las {selectedEvent.hora}</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedEvent(null)}>Cerrar</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
