'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { HeartPulse, PawPrint, Pill, CalendarPlus, Activity, Check, Plus, ArrowUpRight, Calendar } from 'lucide-react';
import { HospitalizacionRepository, MedicacionRepository, EvolucionRepository, MascotaRepository, VeterinarioRepository, ClienteRepository, CitaRepository } from '@/lib/repositories';
import { ESTADOS_HOSPITALIZACION, ESTADOS_CITA, TIPOS_SERVICIO, formatDate, formatDateTime } from '@/lib/constants';
import type { Hospitalizacion, Medicacion, EvolucionDiaria, Mascota, Veterinario, Cliente, Cita } from '@/lib/models';

export default function HospitalizacionPage() {
  const [hospitalizaciones, setHospitalizaciones] = useState<Hospitalizacion[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [medicaciones, setMedicaciones] = useState<Medicacion[]>([]);
  const [evoluciones, setEvoluciones] = useState<EvolucionDiaria[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [altaDialog, setAltaDialog] = useState(false);
  const [altaResumen, setAltaResumen] = useState('');
  const [altaIndicaciones, setAltaIndicaciones] = useState('');
  const [nuevaEvolution, setNuevaEvolution] = useState({ signosVitales: '', estadoGeneral: '', observaciones: '' });
  const [nuevaMed, setNuevaMed] = useState({ medicamento: '', dosis: '', via: '', frecuencia: '', horasProgramadas: '' });

  useEffect(() => {
    (async () => {
      const [hosps, mas, vs, clis, cit] = await Promise.all([
        HospitalizacionRepository.getAll(),
        MascotaRepository.getAll(),
        VeterinarioRepository.getAll(),
        ClienteRepository.getAll(),
        CitaRepository.getAll(),
      ]);
      // Fetch all medicaciones and evoluciones for each hospitalization
      const allMedicaciones: Medicacion[] = [];
      const allEvoluciones: EvolucionDiaria[] = [];
      for (const h of hosps) {
        const meds = await MedicacionRepository.getByHospitalizacion(h.id);
        const evols = await EvolucionRepository.getByHospitalizacion(h.id);
        allMedicaciones.push(...meds);
        allEvoluciones.push(...evols);
      }
      setHospitalizaciones(hosps);
      setMascotas(mas);
      setVets(vs);
      setClientes(clis);
      setMedicaciones(allMedicaciones);
      setEvoluciones(allEvoluciones);
      setCitas(cit);
      setLoading(false);
      // Select first active by default
      const activa = hosps.find(h => h.estado === 'hospitalizado');
      if (activa) setSelectedId(activa.id);
    })();
  }, []);

  const getMascota = (id: string) => mascotas.find(m => m.id === id);
  const getCliente = (mascotaId: string) => {
    const mas = getMascota(mascotaId);
    return mas ? clientes.find(c => c.id === mas.clienteId) : undefined;
  };
  const getVet = (id: string) => vets.find(v => v.id === id);
  const getCita = (id: string) => citas.find(c => c.id === id);

  const selected = hospitalizaciones.find(h => h.id === selectedId);
  const selectedMeds = medicaciones.filter(m => m.hospitalizacionId === selectedId);
  const selectedEvols = evoluciones.filter(e => e.hospitalizacionId === selectedId).sort((a, b) => a.fecha.localeCompare(b.fecha));

  const handleRegistrarToma = async (medId: string, fecha: string, hora: string) => {
    const updated = await MedicacionRepository.registrarToma(medId, fecha, hora, 'Dra. Nicole Pérez');
    if (updated) {
      setMedicaciones(prev => prev.map(m => m.id === medId ? updated : m));
    }
  };

  const handleDarAlta = async () => {
    if (!selected) return;
    const result = await HospitalizacionRepository.darAlta(selected.id, altaResumen, altaIndicaciones);
    if (result) {
      setHospitalizaciones(prev => prev.map(h => h.id === result.id ? result : h));
      setAltaDialog(false);
      setAltaResumen('');
      setAltaIndicaciones('');
    }
  };

  const handleAddEvolution = async () => {
    if (!selected || !nuevaEvolution.signosVitales || !nuevaEvolution.estadoGeneral) return;
    const nueva = await EvolucionRepository.create({
      hospitalizacionId: selected.id,
      fecha: '2026-10-15',
      signosVitales: nuevaEvolution.signosVitales,
      estadoGeneral: nuevaEvolution.estadoGeneral,
      observaciones: nuevaEvolution.observaciones,
      veterinarioId: 'vet_001',
    });
    setEvoluciones(prev => [...prev, nueva]);
    setNuevaEvolution({ signosVitales: '', estadoGeneral: '', observaciones: '' });
  };

  const handleAddMed = async () => {
    if (!selected || !nuevaMed.medicamento || !nuevaMed.dosis) return;
    const horas = nuevaMed.horasProgramadas.split(',').map(h => h.trim()).filter(Boolean);
    const nueva = await MedicacionRepository.create({
      hospitalizacionId: selected.id,
      medicamento: nuevaMed.medicamento,
      dosis: nuevaMed.dosis,
      via: nuevaMed.via,
      frecuencia: nuevaMed.frecuencia,
      horasProgramadas: horas,
      fechaInicio: '2026-10-15',
      fechaFin: null,
      tomas: [],
    });
    setMedicaciones(prev => [...prev, nueva]);
    setNuevaMed({ medicamento: '', dosis: '', via: '', frecuencia: '', horasProgramadas: '' });
  };

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  const activas = hospitalizaciones.filter(h => h.estado === 'hospitalizado');
  const altas = hospitalizaciones.filter(h => h.estado === 'alta');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hospitalización</h1>
        <p className="text-sm text-muted-foreground mt-1">Pacientes hospitalizados y su seguimiento</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground font-medium">Hospitalizados</p><p className="text-2xl font-bold mt-1">{activas.length}</p></div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><HeartPulse className="h-5 w-5 text-orange-500" /></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground font-medium">Altas</p><p className="text-2xl font-bold mt-1">{altas.length}</p></div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Check className="h-5 w-5 text-emerald-500" /></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground font-medium">Total medicaciones</p><p className="text-2xl font-bold mt-1">{medicaciones.length}</p></div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center"><Pill className="h-5 w-5 text-violet-500" /></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Pacientes</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
              {[...activas, ...altas].map((h) => {
                const mas = getMascota(h.mascotaId);
                const cli = getMascota(h.mascotaId) ? getCliente(h.mascotaId) : null;
                const active = h.id === selectedId;
                const citaOrigen = h.citaId ? getCita(h.citaId) : null;
                const esCirugia = citaOrigen?.tipoServicio === 'cirugia';
                return (
                  <button key={h.id} onClick={() => setSelectedId(h.id)}
                    className={`w-full text-left p-4 hover:bg-accent/30 transition-colors ${active ? 'bg-primary/10 border-l-2 border-primary' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${esCirugia ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                        {esCirugia ? <HeartPulse className="h-5 w-5 text-red-500" /> : <PawPrint className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{mas?.nombre || 'N/A'}</p>
                          {esCirugia && <Badge className="text-[9px] bg-red-500/20 text-red-700 dark:text-red-400 shrink-0">Cirugía</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{cli?.nombre} {cli?.apellido}</p>
                        <p className="text-xs text-muted-foreground">Jaula: {h.jaulaArea} - Ingreso: {formatDate(h.fechaIngreso)}</p>
                      </div>
                      <Badge className={`text-[10px] shrink-0 ${ESTADOS_HOSPITALIZACION[h.estado].color}`}>{ESTADOS_HOSPITALIZACION[h.estado].label}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Tabs defaultValue="info">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="meds" className="gap-1.5"><Pill className="h-3.5 w-3.5" /> Medicación ({selectedMeds.length})</TabsTrigger>
                <TabsTrigger value="evolution" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Evolución ({selectedEvols.length})</TabsTrigger>
              </TabsList>

              {/* Info tab */}
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base">Datos de hospitalización</CardTitle>
                    {selected.estado === 'hospitalizado' && (
                      <Dialog open={altaDialog} onOpenChange={setAltaDialog}>
                        <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><ArrowUpRight className="h-3.5 w-3.5" /> Dar de alta</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Alta hospitalaria</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div><Label>Resumen del alta</Label><Textarea value={altaResumen} onChange={(e) => setAltaResumen(e.target.value)} rows={3} /></div>
                            <div><Label>Indicaciones para el domicilio</Label><Textarea value={altaIndicaciones} onChange={(e) => setAltaIndicaciones(e.target.value)} rows={3} /></div>
                          </div>
                          <DialogFooter><Button onClick={handleDarAlta} disabled={!altaResumen}>Confirmar alta</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Mascota:</span> <span className="font-medium">{getMascota(selected.mascotaId)?.nombre}</span></div>
                      <div><span className="text-muted-foreground">Jaula/Área:</span> <span className="font-medium">{selected.jaulaArea}</span></div>
                      <div><span className="text-muted-foreground">Ingreso:</span> <span className="font-medium">{formatDateTime(selected.fechaIngreso)}</span></div>
                      <div><span className="text-muted-foreground">Estado:</span> <Badge className={`text-[10px] ${ESTADOS_HOSPITALIZACION[selected.estado].color}`}>{ESTADOS_HOSPITALIZACION[selected.estado].label}</Badge></div>
                      <div><span className="text-muted-foreground">Veterinario:</span> <span className="font-medium">{getVet(selected.veterinarioId)?.nombre}</span></div>
                      {selected.fechaAlta && <div><span className="text-muted-foreground">Alta:</span> <span className="font-medium">{formatDateTime(selected.fechaAlta)}</span></div>}
                    </div>
                    {selected.citaId && (() => {
                      const citaOrigen = getCita(selected.citaId);
                      const mascCita = citaOrigen ? getMascota(citaOrigen.mascotaId) : null;
                      const esCirugia = citaOrigen?.tipoServicio === 'cirugia';
                      return (
                        <div className="pt-2 border-t">
                          <Label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Cita origen {esCirugia && <Badge className="text-[9px] bg-red-500/20 text-red-700 dark:text-red-400">Cirugía</Badge>}</Label>
                          <div className="mt-1 text-sm text-muted-foreground">
                            <p><span className="font-medium">Cita:</span> #{selected.citaId}</p>
                            <p><span className="font-medium">Servicio:</span> {citaOrigen ? TIPOS_SERVICIO[citaOrigen.tipoServicio]?.label : 'N/A'}</p>
                            <p><span className="font-medium">Mascota de la cita:</span> {mascCita?.nombre || 'N/A'}</p>
                            <p><span className="font-medium">Fecha cita:</span> {citaOrigen ? formatDateTime(citaOrigen.fechaHora) : 'N/A'}</p>
                            <p><span className="font-medium">Estado cita:</span> {citaOrigen ? <Badge className={`text-[10px] ${ESTADOS_CITA[citaOrigen.estado]?.color || ''}`}>{ESTADOS_CITA[citaOrigen.estado]?.label || 'N/A'}</Badge> : 'N/A'}</p>
                            {esCirugia && (
                              <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                <p className="text-xs text-red-700 dark:text-red-400 font-medium">⚕️ Hospitalización automática por cirugía</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Esta hospitalización se creó automáticamente cuando la cita fue confirmada/atendida</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <div><Label>Motivo</Label><p className="text-sm text-muted-foreground mt-1">{selected.motivo}</p></div>
                    {selected.resumenAlta && <div><Label>Resumen del alta</Label><p className="text-sm text-muted-foreground mt-1">{selected.resumenAlta}</p></div>}
                    {selected.indicacionesAlta && <div><Label>Indicaciones</Label><p className="text-sm text-muted-foreground mt-1">{selected.indicacionesAlta}</p></div>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Medicación tab */}
              <TabsContent value="meds" className="space-y-4">
                {/* Add medicación */}
                {selected.estado === 'hospitalizado' && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <Label className="text-sm font-medium">Agregar medicación</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Medicamento" value={nuevaMed.medicamento} onChange={(e) => setNuevaMed({ ...nuevaMed, medicamento: e.target.value })} />
                        <Input placeholder="Dosis" value={nuevaMed.dosis} onChange={(e) => setNuevaMed({ ...nuevaMed, dosis: e.target.value })} />
                        <Input placeholder="Vía (IV, SC, PO...)" value={nuevaMed.via} onChange={(e) => setNuevaMed({ ...nuevaMed, via: e.target.value })} />
                        <Input placeholder="Frecuencia" value={nuevaMed.frecuencia} onChange={(e) => setNuevaMed({ ...nuevaMed, frecuencia: e.target.value })} />
                        <Input placeholder="Horas (08:00, 16:00, 00:00)" value={nuevaMed.horasProgramadas} onChange={(e) => setNuevaMed({ ...nuevaMed, horasProgramadas: e.target.value })} className="col-span-2" />
                      </div>
                      <Button size="sm" onClick={handleAddMed} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Agregar</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Medication grid */}
                {selectedMeds.map((med) => (
                  <Card key={med.id}>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Pill className="h-4 w-4 text-violet-500" /> {med.medicamento}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Dosis: <strong className="text-foreground">{med.dosis}</strong></span>
                        <span>Vía: <strong className="text-foreground">{med.via}</strong></span>
                        <span>Frecuencia: <strong className="text-foreground">{med.frecuencia}</strong></span>
                        <span>Inicio: <strong className="text-foreground">{formatDate(med.fechaInicio)}</strong></span>
                      </div>
                      {/* Tomas grid */}
                      <div className="border-t border-border/30 pt-2">
                        <p className="text-xs text-muted-foreground mb-2">Tomas programadas:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {med.tomas.map((toma, i) => (
                            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${toma.administrada ? 'bg-emerald-500/10' : 'bg-accent/30'}`}>
                              {toma.administrada ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                              )}
                              <span className="text-muted-foreground">{toma.fecha} - {toma.hora}</span>
                              {toma.administrada && toma.usuario && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-auto">{toma.usuario}</span>
                              )}
                              {!toma.administrada && selected.estado === 'hospitalizado' && (
                                <Button size="sm" variant="outline" className="h-5 text-[10px] px-2 ml-auto" onClick={() => handleRegistrarToma(med.id, toma.fecha, toma.hora)}>
                                  Registrar
                                </Button>
                              )}
                            </div>
                          ))}
                          {med.tomas.length === 0 && <p className="text-xs text-muted-foreground col-span-full py-1">Sin tomas registradas</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {selectedMeds.length === 0 && <p className="text-center text-muted-foreground py-8">Sin medicaciones registradas</p>}
              </TabsContent>

              {/* Evolución tab */}
              <TabsContent value="evolution" className="space-y-4">
                {/* Add evolución */}
                {selected.estado === 'hospitalizado' && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <Label className="text-sm font-medium">Registrar evolución diaria</Label>
                      <div className="space-y-2">
                        <Input placeholder="Signos vitales (T:, FC:, FR:)" value={nuevaEvolution.signosVitales} onChange={(e) => setNuevaEvolution({ ...nuevaEvolution, signosVitales: e.target.value })} />
                        <Input placeholder="Estado general" value={nuevaEvolution.estadoGeneral} onChange={(e) => setNuevaEvolution({ ...nuevaEvolution, estadoGeneral: e.target.value })} />
                        <Textarea placeholder="Observaciones" value={nuevaEvolution.observaciones} onChange={(e) => setNuevaEvolution({ ...nuevaEvolution, observaciones: e.target.value })} rows={2} />
                        <Button size="sm" onClick={handleAddEvolution} className="gap-1.5"><CalendarPlus className="h-3.5 w-3.5" /> Registrar</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                <div className="space-y-3">
                  {selectedEvols.map((ev) => (
                    <Card key={ev.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center"><Activity className="h-4 w-4 text-teal-500" /></div>
                          <span className="text-sm font-medium">{formatDate(ev.fecha)}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{getVet(ev.veterinarioId)?.nombre}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Signos vitales:</span> {ev.signosVitales}</p>
                          <p><span className="text-muted-foreground">Estado general:</span> {ev.estadoGeneral}</p>
                          {ev.observaciones && <p className="text-muted-foreground italic">{ev.observaciones}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {selectedEvols.length === 0 && <p className="text-center text-muted-foreground py-8">Sin evoluciones registradas</p>}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Seleccione un paciente de la lista</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
