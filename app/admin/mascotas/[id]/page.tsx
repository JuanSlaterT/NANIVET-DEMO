'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertTriangle, ArrowLeft, PawPrint, Syringe, Pill, Scissors, FileText, Calendar, TrendingUp, MessageCircle, User, ClipboardList, Sparkles } from 'lucide-react';
import { MascotaRepository, ClienteRepository, CitaRepository, CasoRepository, VacunaRepository, TratamientoRepository, DesparasitacionRepository, CirugiaRepository, ExamenRepository, PesoRepository, AuditRepository } from '@/lib/repositories';
import { formatDate, formatDateTime, buildWhatsAppUrl, ESTADOS_CITA, ESTADOS_CASO, TIPOS_SERVICIO } from '@/lib/constants';
import type { Mascota, Cliente, Cita, CasoClinico, Vacuna, Tratamiento, Desparasitacion, Cirugia, Examen, PesoRegistrado, AuditLog } from '@/lib/models';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAuth } from '@/components/auth-provider';
import { summarizeHistory } from '@/lib/ai-service';
import { ROLES_CLINICOS } from '@/lib/constants';

type TimelineEvent = { id: string; fecha: string; titulo: string; descripcion: string; tipo: string; icon: React.ComponentType<{ className?: string }>; color: string };

export default function MascotaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [casos, setCasos] = useState<CasoClinico[]>([]);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [desparasitaciones, setDesparasitaciones] = useState<Desparasitacion[]>([]);
  const [cirugias, setCirugias] = useState<Cirugia[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [pesos, setPesos] = useState<PesoRegistrado[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const { user } = useAuth();
  const isClinical = user ? ROLES_CLINICOS.includes(user.rol) : false;

  useEffect(() => {
    (async () => {
      const id = params.id as string;
      const mas = MascotaRepository.getById(id);
      if (!mas) { router.push('/admin/mascotas'); return; }
      setMascota(mas);
      const cli = ClienteRepository.getById(mas.clienteId);
      setCliente(cli || null);
      const [c, cas, vac, tra, des, cir, exa, pes] = await Promise.all([
        CitaRepository.getByMascota(id),
        CasoRepository.getByMascota(id),
        VacunaRepository.getByMascota(id),
        TratamientoRepository.getByMascota(id),
        DesparasitacionRepository.getByMascota(id),
        CirugiaRepository.getByMascota(id),
        ExamenRepository.getByMascota(id),
        PesoRepository.getByMascota(id),
      ]);
      setCitas(c.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)));
      setCasos(cas.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setVacunas(vac.sort((a, b) => b.fechaAplicacion.localeCompare(a.fechaAplicacion)));
      setTratamientos(tra.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setDesparasitaciones(des.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setCirugias(cir.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setExamenes(exa.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setPesos(pes);
      const auds = await AuditRepository.getByEntidad('Mascota', id);
      setAuditLogs(auds);
      setLoading(false);
    })();
  }, [params, router]);

  const handleAISummary = async () => {
    if (!mascota) return;
    setAiLoading(true);
    const summary = await summarizeHistory(mascota, casos, vacunas, tratamientos, desparasitaciones, cirugias, examenes);
    setAiSummary(summary);
    setAiLoading(false);
  };

  if (loading || !mascota) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /></div>;
  }

  const edadMascota = (fechaNac: string) => {
    const nac = new Date(fechaNac);
    const ahora = new Date('2026-10-15');
    const meses = (ahora.getFullYear() - nac.getFullYear()) * 12 + (ahora.getMonth() - nac.getMonth());
    if (meses < 12) return `${meses} meses`;
    const años = Math.floor(meses / 12);
    const m = meses % 12;
    return m > 0 ? `${años} año(s) ${m} mes(es)` : `${años} año(s)`;
  };

  // Timeline
  const timeline: TimelineEvent[] = [
    ...citas.map(c => ({ id: c.id, fecha: c.fechaHora, titulo: `Cita: ${TIPOS_SERVICIO[c.tipoServicio].label}`, descripcion: c.motivo, tipo: 'cita', icon: Calendar, color: 'text-sky-500' })),
    ...casos.map(c => ({ id: c.id, fecha: c.fecha, titulo: `Caso clínico: ${c.motivo}`, descripcion: c.diagnostico, tipo: 'caso', icon: ClipboardList, color: 'text-teal-500' })),
    ...vacunas.map(v => ({ id: v.id, fecha: v.fechaAplicacion, titulo: `Vacuna: ${v.nombre}`, descripcion: `Lote: ${v.lote}`, tipo: 'vacuna', icon: Syringe, color: 'text-emerald-500' })),
    ...tratamientos.map(t => ({ id: t.id, fecha: t.fecha, titulo: `Tratamiento: ${t.nombre}`, descripcion: `${t.dosis} - ${t.duracion}`, tipo: 'tratamiento', icon: Pill, color: 'text-violet-500' })),
    ...desparasitaciones.map(d => ({ id: d.id, fecha: d.fecha, titulo: `Desparasitación: ${d.producto}`, descripcion: d.dosis, tipo: 'desparasitacion', icon: Pill, color: 'text-amber-500' })),
    ...cirugias.map(c => ({ id: c.id, fecha: c.fecha, titulo: `Cirugía: ${c.tipo}`, descripcion: c.notas, tipo: 'cirugia', icon: Scissors, color: 'text-red-500' })),
    ...examenes.map(e => ({ id: e.id, fecha: e.fecha, titulo: `Examen: ${e.tipo}`, descripcion: e.descripcion, tipo: 'examen', icon: FileText, color: 'text-cyan-500' })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const pesoData = pesos.map(p => ({ fecha: formatDate(p.fecha), peso: p.peso }));
  const ultimoPeso = pesos.length > 0 ? pesos[pesos.length - 1].peso : null;

  const whatsappMsg = cliente
    ? `Hola ${cliente.nombre}, le recordamos que ${mascota.nombre} tiene registros en Clínica Veterinaria NANIVET.`
    : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <Link href="/admin/mascotas"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{mascota.nombre}</h1>
          <p className="text-sm text-muted-foreground">{mascota.especie} - {mascota.raza || 'Mestizo'} - {mascota.sexo} - {edadMascota(mascota.fechaNacimiento)}</p>
        </div>
      </div>

      {/* Alerts */}
      {mascota.alergias && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Alergias documentadas</p>
            <p className="text-sm text-amber-600 dark:text-amber-400/80">{mascota.alergias}</p>
          </div>
        </div>
      )}
      {casos.some(c => c.estado === 'seguimiento') && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-sky-500/10 border border-sky-500/30">
          <ClipboardList className="h-5 w-5 text-sky-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-sky-700 dark:text-sky-400">Caso crónico en seguimiento</p>
            <p className="text-sm text-sky-600 dark:text-sky-400/80">{casos.find(c => c.estado === 'seguimiento')?.diagnostico}</p>
          </div>
        </div>
      )}

      {/* Info + Owner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos de la mascota</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Especie</span><span className="font-medium">{mascota.especie}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sexo</span><span className="font-medium">{mascota.sexo}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Nacimiento</span><span className="font-medium">{formatDate(mascota.fechaNacimiento)}</span></div>
            {mascota.raza && <div className="flex justify-between"><span className="text-muted-foreground">Raza</span><span className="font-medium">{mascota.raza}</span></div>}
            {mascota.color && <div className="flex justify-between"><span className="text-muted-foreground">Color</span><span className="font-medium">{mascota.color}</span></div>}
            {mascota.microchip && <div className="flex justify-between"><span className="text-muted-foreground">Microchip</span><span className="font-mono text-xs">{mascota.microchip}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Esterilizado</span><span className="font-medium">{mascota.esterilizado ? 'Sí' : 'No'}</span></div>
            {ultimoPeso && <div className="flex justify-between"><span className="text-muted-foreground">Último peso</span><span className="font-medium">{ultimoPeso} kg</span></div>}
            {mascota.notas && <div className="pt-2 border-t border-border/30"><span className="text-muted-foreground">Notas: </span><span>{mascota.notas}</span></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dueño</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {cliente && (
              <>
                <Link href={`/admin/clientes/${cliente.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                  <div><p className="text-sm font-medium">{cliente.nombre} {cliente.apellido}</p><p className="text-xs text-muted-foreground">CI: {cliente.cedula}</p></div>
                </Link>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Teléfono: </span>{cliente.telefono}</p>
                  {cliente.email && <p><span className="text-muted-foreground">Email: </span>{cliente.email}</p>}
                </div>
                <Button asChild className="w-full gap-2" size="sm">
                  <a href={buildWhatsAppUrl(cliente.telefono, whatsappMsg)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> Enviar WhatsApp</a>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resumen clínico</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-lg bg-accent/30"><p className="text-2xl font-bold text-sky-500">{citas.length}</p><p className="text-xs text-muted-foreground">Citas</p></div>
            <div className="p-3 rounded-lg bg-accent/30"><p className="text-2xl font-bold text-teal-500">{casos.length}</p><p className="text-xs text-muted-foreground">Casos</p></div>
            <div className="p-3 rounded-lg bg-accent/30"><p className="text-2xl font-bold text-emerald-500">{vacunas.length}</p><p className="text-xs text-muted-foreground">Vacunas</p></div>
            <div className="p-3 rounded-lg bg-accent/30"><p className="text-2xl font-bold text-red-500">{cirugias.length}</p><p className="text-xs text-muted-foreground">Cirugías</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {/* AI Summary */}
      {isClinical && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Asistente IA - Resumen clínico</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAISummary} disabled={aiLoading} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {aiLoading ? 'Generando...' : 'Generar resumen'}
            </Button>
          </CardHeader>
          {aiSummary && (
            <CardContent><div className="text-sm whitespace-pre-wrap text-muted-foreground bg-accent/20 rounded-lg p-4">{aiSummary}</div></CardContent>
          )}
        </Card>
      )}

      <Tabs defaultValue="timeline">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="timeline" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Línea de tiempo</TabsTrigger>
          <TabsTrigger value="vacunas" className="gap-1.5"><Syringe className="h-3.5 w-3.5" /> Carnet de vacunas</TabsTrigger>
          <TabsTrigger value="peso" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Gráfica de peso</TabsTrigger>
          {isClinical && <TabsTrigger value="tratamientos" className="gap-1.5"><Pill className="h-3.5 w-3.5" /> Tratamientos</TabsTrigger>}
          {isClinical && <TabsTrigger value="casos" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Casos</TabsTrigger>}
          {isClinical && <TabsTrigger value="auditoria" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Auditoría ({auditLogs.length})</TabsTrigger>}
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-4">
              {timeline.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sin registros</p>
              ) : (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                  {timeline.slice(0, 20).map((ev) => {
                    const Icon = ev.icon;
                    return (
                      <div key={`${ev.tipo}-${ev.id}`} className="relative">
                        <div className={`absolute -left-[18px] w-4 h-4 rounded-full bg-card border-2 border-current ${ev.color} flex items-center justify-center`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${ev.color} bg-current`} />
                        </div>
                        <div className="flex items-start gap-3">
                          <Icon className={`h-4 w-4 mt-0.5 ${ev.color} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{ev.titulo}</p>
                            <p className="text-xs text-muted-foreground">{ev.descripcion}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(ev.fecha)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vacunas - Carnet */}
        <TabsContent value="vacunas">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {vacunas.map((vac) => {
                  const diasParaProxima = Math.ceil((new Date(vac.proximaDosis).getTime() - new Date('2026-10-15').getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={vac.id} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"><Syringe className="h-5 w-5 text-emerald-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{vac.nombre}</p>
                        <p className="text-xs text-muted-foreground">Aplicada: {formatDate(vac.fechaAplicacion)} - Lote: {vac.lote}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Próxima dosis</p>
                        <p className="text-sm font-medium">{formatDate(vac.proximaDosis)}</p>
                        <Badge variant={diasParaProxima <= 30 ? 'destructive' : 'secondary'} className="text-[10px] mt-1">
                          {diasParaProxima <= 0 ? 'Vencida' : `${diasParaProxima} días`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {vacunas.length === 0 && <p className="text-center text-muted-foreground py-8">Sin vacunas registradas</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfica de peso */}
        <TabsContent value="peso">
          <Card>
            <CardHeader><CardTitle className="text-base">Evolución de peso (kg)</CardTitle></CardHeader>
            <CardContent>
              {pesoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pesoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sin registros de peso</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tratamientos */}
        {isClinical && (
        <TabsContent value="tratamientos">
          <Card>
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
                  </div>
                ))}
                {tratamientos.length === 0 && <p className="text-center text-muted-foreground py-8">Sin tratamientos</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Casos */}
        {isClinical && (
        <TabsContent value="casos">
          <div className="space-y-3">
            {casos.map((caso) => (
              <Link key={caso.id} href={`/admin/casos/${caso.id}`}>
                <Card className="hover:border-primary/40 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0"><ClipboardList className="h-5 w-5 text-teal-500" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{caso.motivo}</p>
                      <p className="text-xs text-muted-foreground truncate">{caso.diagnostico}</p>
                    </div>
                    <Badge className={`text-[10px] ${ESTADOS_CASO[caso.estado].color}`}>{ESTADOS_CASO[caso.estado].label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {casos.length === 0 && <p className="text-center text-muted-foreground py-8">Sin casos clínicos</p>}
          </div>
        </TabsContent>
        )}

        {/* Auditoría */}
        {isClinical && (
        <TabsContent value="auditoria">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="text-[10px] shrink-0">{log.accion}</Badge>
                    <span className="text-muted-foreground flex-1 min-w-0 truncate">{log.usuario} - {formatDateTime(log.fechaHora)}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{log.entidad}</span>
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-center text-muted-foreground py-8">Sin registros de auditoría</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
