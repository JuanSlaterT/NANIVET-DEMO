'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, ClipboardList, Syringe, Pill, Scissors, FileText, Save, PawPrint, Sparkles, Brain, Plus, Edit, Trash2 } from 'lucide-react';
import { CasoRepository, MascotaRepository, VeterinarioRepository, VacunaRepository, TratamientoRepository, DesparasitacionRepository, CirugiaRepository, ExamenRepository, AuditRepository } from '@/lib/repositories';
import { ESTADOS_CASO, formatDate } from '@/lib/constants';
import type { CasoClinico, Mascota, Veterinario, Vacuna, Tratamiento, Desparasitacion, Cirugia, Examen, AuditLog } from '@/lib/models';
import { useAuth } from '@/components/auth-provider';
import { notesToSOAP, suggestDifferentials } from '@/lib/ai-service';

export default function CasoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caso, setCaso] = useState<CasoClinico | null>(null);
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [vet, setVet] = useState<Veterinario | null>(null);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [desparasitaciones, setDesparasitaciones] = useState<Desparasitacion[]>([]);
  const [cirugias, setCirugias] = useState<Cirugia[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [soap, setSoap] = useState({ subjetivo: '', objetivo: '', analisis: '', plan: '' });
  const [nuevoEstado, setNuevoEstado] = useState<string>('');
  const [aiNotas, setAiNotas] = useState('');
  const [aiSoapLoading, setAiSoapLoading] = useState(false);
  const [aiDifferentials, setAiDifferentials] = useState<{ diagnostico: string; probabilidad: string; razonamiento: string }[]>([]);
  const [aiDiffLoading, setAiDiffLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Tratamiento CRUD state
  const [tratamientoDialogOpen, setTratamientoDialogOpen] = useState(false);
  const [editingTratamiento, setEditingTratamiento] = useState<Tratamiento | null>(null);
  const [tratamientoForm, setTratamientoForm] = useState({
    nombre: '', dosis: '', duracion: '', fecha: new Date().toISOString().split('T')[0], veterinarioId: 'vet_001',
  });

  // Estado local para evitar re-renders infinitos por params/router
  const [casoId, setCasoId] = useState<string | null>(null);

  useEffect(() => {
    const id = (params as { id: string }).id;
    if (id) setCasoId(id);
  }, [params]);

  useEffect(() => {
    if (!casoId) return;

    let cancelled = false;

    (async () => {
      const id = casoId;
      const c = await CasoRepository.getById(id);
      if (cancelled) return;
      if (!c) { router.push('/admin/casos'); return; }
      setCaso(c);
      setSoap(c.soap);
      setNuevoEstado(c.estado);
      const mas = await MascotaRepository.getById(c.mascotaId);
      if (cancelled) return;
      setMascota(mas || null);
      const v = await VeterinarioRepository.getById(c.veterinarioId);
      if (cancelled) return;
      setVet(v || null);
      const [vac, tra, des, cir, exa] = await Promise.all([
        VacunaRepository.getByCaso(id), TratamientoRepository.getByCaso(id),
        DesparasitacionRepository.getByCaso(id), CirugiaRepository.getByCaso(id),
        ExamenRepository.getByCaso(id),
      ]);
      if (cancelled) return;
      setVacunas(vac); setTratamientos(tra); setDesparasitaciones(des); setCirugias(cir); setExamenes(exa);
      const auds = await AuditRepository.getByEntidad('CasoClinico', id);
      if (cancelled) return;
      setAuditLogs(auds);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [casoId]);

  const saveSoap = async () => {
    if (!caso) return;
    const updated = await CasoRepository.update(caso.id, { soap, estado: nuevoEstado as CasoClinico['estado'] });
    if (updated) {
      setCaso(updated);
      setEditing(false);
    }
  };

  // ==================== TRATAMIENTO CRUD ====================
  const openNewTratamiento = () => {
    setEditingTratamiento(null);
    setTratamientoForm({ nombre: '', dosis: '', duracion: '', fecha: new Date().toISOString().split('T')[0], veterinarioId: caso?.veterinarioId || 'vet_001' });
    setTratamientoDialogOpen(true);
  };

  const openEditTratamiento = (t: Tratamiento) => {
    setEditingTratamiento(t);
    setTratamientoForm({ nombre: t.nombre, dosis: t.dosis, duracion: t.duracion, fecha: t.fecha, veterinarioId: t.veterinarioId });
    setTratamientoDialogOpen(true);
  };

  const handleSaveTratamiento = async () => {
    if (!caso || !tratamientoForm.nombre.trim() || !tratamientoForm.dosis.trim()) return;
    const data = {
      mascotaId: caso.mascotaId,
      casoId: caso.id,
      nombre: tratamientoForm.nombre.trim(),
      dosis: tratamientoForm.dosis.trim(),
      duracion: tratamientoForm.duracion.trim(),
      fecha: tratamientoForm.fecha,
      veterinarioId: tratamientoForm.veterinarioId,
    };
    if (editingTratamiento) {
      await TratamientoRepository.update(editingTratamiento.id, data);
    } else {
      await TratamientoRepository.create(data);
    }
    const updated = await TratamientoRepository.getByCaso(caso.id);
    setTratamientos(updated);
    setTratamientoDialogOpen(false);
  };

  const handleDeleteTratamiento = async (id: string) => {
    await TratamientoRepository.delete(id);
    const updated = await TratamientoRepository.getByCaso(caso.id);
    setTratamientos(updated);
  };

  const handleAiSOAP = async () => {
    if (!aiNotas.trim()) return;
    setAiSoapLoading(true);
    const result = await notesToSOAP(aiNotas);
    setSoap(result);
    setAiSoapLoading(false);
    setEditing(true);
  };

  const handleAiDifferentials = async () => {
    if (!mascota) return;
    setAiDiffLoading(true);
    const sintomas = `${soap.subjetivo} ${soap.objetivo} ${caso?.motivo || ''}`;
    const result = await suggestDifferentials(sintomas, mascota.especie);
    setAiDifferentials(result);
    setAiDiffLoading(false);
  };

  if (loading || !caso) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <Link href="/admin/casos"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{caso.motivo}</h1>
            <Badge className={ESTADOS_CASO[caso.estado].color}>{ESTADOS_CASO[caso.estado].label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {mascota && <Link href={`/admin/mascotas/${mascota.id}`} className="hover:text-primary inline-flex items-center gap-1"><PawPrint className="h-3 w-3" />{mascota.nombre}</Link>}
            {' - '} {vet?.nombre} - {formatDate(caso.fecha)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="soap">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="soap">SOAP</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Asistente IA</TabsTrigger>
          <TabsTrigger value="tratamientos" className="gap-1.5"><Pill className="h-3.5 w-3.5" /> Tratamientos ({tratamientos.length})</TabsTrigger>
          <TabsTrigger value="vacunas" className="gap-1.5"><Syringe className="h-3.5 w-3.5" /> Vacunas ({vacunas.length})</TabsTrigger>
          <TabsTrigger value="desparasitaciones" className="gap-1.5"><Pill className="h-3.5 w-3.5" /> Desparasitaciones ({desparasitaciones.length})</TabsTrigger>
          <TabsTrigger value="cirugias" className="gap-1.5"><Scissors className="h-3.5 w-3.5" /> Cirugías ({cirugias.length})</TabsTrigger>
          <TabsTrigger value="examenes" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Exámenes ({examenes.length})</TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Auditoría ({auditLogs.length})</TabsTrigger>
        </TabsList>

        {/* SOAP */}
        <TabsContent value="soap">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Nota SOAP</CardTitle>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Editar</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSoap(caso.soap); setNuevoEstado(caso.estado); setEditing(false); }}>Cancelar</Button>
                  <Button size="sm" onClick={saveSoap} className="gap-1"><Save className="h-3 w-3" /> Guardar</Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {editing && (
                <div className="space-y-1.5">
                  <Label>Estado del caso</Label>
                  <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ESTADOS_CASO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(['subjetivo', 'objetivo', 'analisis', 'plan'] as const).map((campo) => (
                <div key={campo} className="space-y-1.5">
                  <Label className="capitalize">{campo === 'analisis' ? 'Análisis' : campo}</Label>
                  {editing ? (
                    <Textarea value={soap[campo]} onChange={(e) => setSoap({ ...soap, [campo]: e.target.value })} rows={3} />
                  ) : (
                    <p className="text-sm text-muted-foreground bg-accent/20 rounded-md p-3">{caso?.soap?.[campo] || 'Sin datos'}</p>
                  )}
                </div>
              ))}
              <div className="pt-3 border-t border-border/30">
                <Label>Diagnóstico</Label>
                <p className="text-sm font-medium mt-1">{caso.diagnostico}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tratamientos */}
        <TabsContent value="tratamientos">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Tratamientos / Recetas</CardTitle>
              <Dialog open={tratamientoDialogOpen} onOpenChange={setTratamientoDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5" onClick={openNewTratamiento}><Plus className="h-3.5 w-3.5" /> Nuevo</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingTratamiento ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Nombre del tratamiento *</Label>
                        <Input value={tratamientoForm.nombre} onChange={(e) => setTratamientoForm({ ...tratamientoForm, nombre: e.target.value })} placeholder="Ej: Meloxicam 1.5mg/ml" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Fecha</Label>
                        <Input type="date" value={tratamientoForm.fecha} onChange={(e) => setTratamientoForm({ ...tratamientoForm, fecha: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Dosis *</Label>
                      <Input value={tratamientoForm.dosis} onChange={(e) => setTratamientoForm({ ...tratamientoForm, dosis: e.target.value })} placeholder="Ej: 0.1mg/kg PO cada 24h" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Duración</Label>
                      <Input value={tratamientoForm.duracion} onChange={(e) => setTratamientoForm({ ...tratamientoForm, duracion: e.target.value })} placeholder="Ej: 30 días, Continuo, Único" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Veterinario</Label>
                      <Select value={tratamientoForm.veterinarioId} onValueChange={(v) => setTratamientoForm({ ...tratamientoForm, veterinarioId: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vet_001">Dra. Nicole Pérez</SelectItem>
                          <SelectItem value="vet_002">Dr. Andrés Torres</SelectItem>
                          <SelectItem value="vet_003">Dra. Sofía Vera</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTratamientoDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveTratamiento} disabled={!tratamientoForm.nombre.trim() || !tratamientoForm.dosis.trim()}>
                      {editingTratamiento ? 'Guardar cambios' : 'Crear tratamiento'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {tratamientos.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0"><Pill className="h-5 w-5 text-violet-500" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{t.nombre}</p>
                      <p className="text-xs text-muted-foreground">{t.dosis} - {t.duracion}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(t.fecha)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTratamiento(t)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('¿Eliminar este tratamiento?')) handleDeleteTratamiento(t.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {tratamientos.length === 0 && <p className="text-center text-muted-foreground py-8">Sin tratamientos</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vacunas */}
        <TabsContent value="vacunas">
          <Card><CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {vacunas.map(v => (
                <div key={v.id} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"><Syringe className="h-5 w-5 text-emerald-500" /></div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm">{v.nombre}</p><p className="text-xs text-muted-foreground">Lote: {v.lote} - Próxima: {formatDate(v.proximaDosis)}</p></div>
                  <span className="text-xs text-muted-foreground">{formatDate(v.fechaAplicacion)}</span>
                </div>
              ))}
              {vacunas.length === 0 && <p className="text-center text-muted-foreground py-8">Sin vacunas</p>}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Desparasitaciones */}
        <TabsContent value="desparasitaciones">
          <Card><CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {desparasitaciones.map(d => (
                <div key={d.id} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0"><Pill className="h-5 w-5 text-amber-500" /></div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm">{d.producto}</p><p className="text-xs text-muted-foreground">{d.dosis} - Próxima: {formatDate(d.proximaDosis)}</p></div>
                  <span className="text-xs text-muted-foreground">{formatDate(d.fecha)}</span>
                </div>
              ))}
              {desparasitaciones.length === 0 && <p className="text-center text-muted-foreground py-8">Sin desparasitaciones</p>}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Cirugías */}
        <TabsContent value="cirugias">
          <div className="space-y-3">
            {cirugias.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0"><Scissors className="h-5 w-5 text-red-500" /></div>
                    <div className="flex-1"><p className="font-medium text-sm">{c.tipo}</p><p className="text-xs text-muted-foreground">{formatDate(c.fecha)}</p></div>
                    <Badge variant="outline" className="text-xs">{c.prognosis}</Badge>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground pl-13">
                    <p><span className="font-medium text-foreground">Anestesia:</span> {c.anestesia}</p>
                    <p><span className="font-medium text-foreground">Notas:</span> {c.notas}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {cirugias.length === 0 && <p className="text-center text-muted-foreground py-8">Sin cirugías</p>}
          </div>
        </TabsContent>

        {/* Exámenes */}
        <TabsContent value="examenes">
          <Card><CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {examenes.map(e => (
                <div key={e.id} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0"><FileText className="h-5 w-5 text-cyan-500" /></div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm">{e.tipo}</p><p className="text-xs text-muted-foreground">{e.descripcion}</p></div>
                  <span className="text-xs text-muted-foreground">{formatDate(e.fecha)}</span>
                </div>
              ))}
              {examenes.length === 0 && <p className="text-center text-muted-foreground py-8">Sin exámenes</p>}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Asistente IA */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Notas a SOAP</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Escriba sus notas libres y el asistente IA las estructurará en formato SOAP</Label>
              <Textarea placeholder="Ej: Dueño reporta cojera en pata trasera desde hace 3 días. T: 38.5°C, FC: 90, FR: 20. Palpación revela dolor en cadera. Dx probable: displasia. Indicar AINEs y control en 15 días..." value={aiNotas} onChange={(e) => setAiNotas(e.target.value)} rows={5} />
              <Button onClick={handleAiSOAP} disabled={aiSoapLoading || !aiNotas.trim()} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {aiSoapLoading ? 'Procesando...' : 'Convertir a SOAP'}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Diagnósticos diferenciales</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Basado en los síntomas del caso, el asistente sugerirá posibles diagnósticos.</p>
              <Button onClick={handleAiDifferentials} disabled={aiDiffLoading} variant="outline" className="gap-1.5">
                <Brain className="h-3.5 w-3.5" /> {aiDiffLoading ? 'Analizando...' : 'Sugerir diferenciales'}
              </Button>
              {aiDifferentials.length > 0 && (
                <div className="space-y-2 pt-2">
                  {aiDifferentials.map((d, i) => (
                    <div key={i} className="p-3 rounded-lg bg-accent/20 border border-border/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{d.diagnostico}</span>
                        <Badge variant={d.probabilidad === 'Alta' ? 'destructive' : d.probabilidad === 'Media' ? 'secondary' : 'outline'} className="text-[10px]">{d.probabilidad}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{d.razonamiento}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auditoría */}
        <TabsContent value="auditoria">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="text-[10px] shrink-0">{log.accion}</Badge>
                    <span className="text-muted-foreground flex-1 min-w-0 truncate">{log.usuario} - {formatDate(log.fechaHora)}</span>
                    {log.diff && log.diff.length > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">{log.diff[0].campo}: {log.diff[0].antes} → {log.diff[0].despues}</span>
                    )}
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-center text-muted-foreground py-8">Sin registros de auditoría</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
