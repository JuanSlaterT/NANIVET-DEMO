'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { CitaRepository, MascotaRepository, VeterinarioRepository, VacunaRepository, CirugiaRepository } from '@/lib/repositories';
import { TIPOS_SERVICIO, formatTime, formatDate } from '@/lib/constants';
import type { Cita, Mascota, Veterinario, Vacuna, Cirugia } from '@/lib/models';

type Vista = 'mes' | 'semana' | 'dia';
type CalEvent = { id: string; fecha: string; titulo: string; color: string; tipo: string; hora: string };

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function CalendarioPage() {
  const [vista, setVista] = useState<Vista>('mes');
  const [fechaActual, setFechaActual] = useState(new Date('2026-10-15'));
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [cirugias, setCirugias] = useState<Cirugia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

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

  const getMascota = (id: string) => mascotas.find(m => m.id === id);

  // Build all events
  const allEvents: CalEvent[] = [
    ...citas.map(c => {
      const mas = getMascota(c.mascotaId);
      return {
        id: c.id, fecha: c.fechaHora.slice(0, 10),
        titulo: `${mas?.nombre || 'N/A'} - ${TIPOS_SERVICIO[c.tipoServicio].label}`,
        color: TIPOS_SERVICIO[c.tipoServicio].color, tipo: 'Cita',
        hora: formatTime(c.fechaHora),
      };
    }),
    ...vacunas.map(v => {
      const mas = getMascota(v.mascotaId);
      return {
        id: v.id, fecha: v.proximaDosis,
        titulo: `${mas?.nombre || 'N/A'} - Vac. ${v.nombre}`,
        color: 'bg-emerald-500', tipo: 'Vacuna', hora: '09:00',
      };
    }),
    ...cirugias.map(c => {
      const mas = getMascota(c.mascotaId);
      return {
        id: c.id, fecha: c.fecha,
        titulo: `${mas?.nombre || 'N/A'} - Cirugía: ${c.tipo}`,
        color: 'bg-red-500', tipo: 'Cirugía', hora: '08:00',
      };
    }),
  ];

  const getEventsForDate = (dateStr: string) => allEvents.filter(e => e.fecha === dateStr);

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
  const goToday = () => setFechaActual(new Date('2026-10-15'));

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
  const isToday = (d: Date) => dateStr(d) === '2026-10-15';

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
        <div className="flex items-center gap-2">
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevPeriod}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={nextPeriod}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={goToday}>Hoy</Button>
            </div>
            <h2 className="text-base font-semibold">{headerLabel}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Cita</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Vacuna</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Cirugía</span>
            </div>
          </div>

          {/* Month view */}
          {vista === 'mes' && (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((d, i) => {
                  if (!d) return <div key={i} className="min-h-[80px] rounded-lg bg-muted/20 border border-border/20" />;
                  const ds = dateStr(d);
                  const events = getEventsForDate(ds);
                  const today = isToday(d);
                  return (
                    <div key={i} className={`min-h-[80px] rounded-lg border p-1.5 cursor-pointer transition-colors ${today ? 'border-primary/50 bg-primary/5' : 'border-border/30 hover:border-border'}`}>
                      <div className={`text-xs font-medium mb-1 ${today ? 'text-primary' : 'text-muted-foreground'}`}>{d.getDate()}</div>
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
          )}

          {/* Week view */}
          {vista === 'semana' && (
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => {
                const ds = dateStr(d);
                const events = getEventsForDate(ds);
                const today = isToday(d);
                return (
                  <div key={i} className={`rounded-lg border p-2 min-h-[200px] ${today ? 'border-primary/50 bg-primary/5' : 'border-border/30'}`}>
                    <div className={`text-xs font-medium mb-2 ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                      {DIAS_SEMANA[d.getDay()]} {d.getDate()}
                    </div>
                    <div className="space-y-1">
                      {events.sort((a, b) => a.hora.localeCompare(b.hora)).map(e => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedEvent(null)}>
          <Card className="max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
