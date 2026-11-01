'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertTriangle, ArrowLeft, PawPrint, Syringe, Pill, Scissors, FileText, Calendar, TrendingUp, MessageCircle, User, ClipboardList, Sparkles, Plus, Edit, Trash2, HeartPulse, Camera, ImagePlus, Loader2, ExternalLink, FileDown, ShieldCheck } from 'lucide-react';
import { MascotaRepository, ClienteRepository, CitaRepository, CasoRepository, VacunaRepository, TratamientoRepository, DesparasitacionRepository, CirugiaRepository, ExamenRepository, PesoRepository, AuditRepository, HospitalizacionRepository, MedicacionRepository, VeterinarioRepository, EvolucionRepository } from '@/lib/repositories';
import { formatDate, formatDateTime, buildWhatsAppUrl, ESTADOS_CITA, ESTADOS_CASO, TIPOS_SERVICIO, ESTADOS_HOSPITALIZACION } from '@/lib/constants';
import type { Mascota, Cliente, Cita, CasoClinico, Vacuna, Tratamiento, Desparasitacion, Cirugia, Examen, PesoRegistrado, AuditLog, Hospitalizacion, Medicacion, Veterinario } from '@/lib/models';
import { useAuth } from '@/components/auth-provider';
import { resumirHistoria } from '@/lib/ia-service';
import { AuditedActionDialog } from '@/components/admin/audited-action-dialog';
import { toast } from 'sonner';
import { ROLES_CLINICOS } from '@/lib/constants';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { generateReferralPdf } from '@/lib/referral-pdf';

const WeightChart = dynamic(
  () => import('@/components/admin/weight-chart').then((module) => module.WeightChart),
  { ssr: false, loading: () => <div className="h-[300px]" /> }
);

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
  const [profileUploading, setProfileUploading] = useState(false);
  const [radiographDialogOpen, setRadiographDialogOpen] = useState(false);
  const [radiographUploading, setRadiographUploading] = useState(false);
  const [radiographImage, setRadiographImage] = useState<File | null>(null);
  const [radiographPreview, setRadiographPreview] = useState<string | null>(null);
  const [radiographForm, setRadiographForm] = useState({
    titulo: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    casoId: '',
  });
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [referralForm, setReferralForm] = useState({
    motivo: '',
    especialidadDestino: '',
    solicitud: '',
    incluirRadiografias: true,
  });
  const { user } = useAuth();
  const isClinical = user ? ROLES_CLINICOS.includes(user.rol) : false;
  const radiographDirty = Boolean(
    radiographImage
    || radiographForm.titulo.trim()
    || radiographForm.descripcion.trim()
    || radiographForm.casoId
    || radiographForm.fecha !== new Date().toISOString().split('T')[0],
  );
  const {
    requestDiscard: requestRadiographDiscard,
    discardDialog: radiographDiscardDialog,
  } = useUnsavedChanges(radiographDialogOpen && radiographDirty && !radiographUploading);

  // Tratamiento CRUD state
  const [tratamientoDialogOpen, setTratamientoDialogOpen] = useState(false);
  const [editingTratamiento, setEditingTratamiento] = useState<Tratamiento | null>(null);
  const [tratamientoForm, setTratamientoForm] = useState({
    nombre: '', dosis: '', duracion: '', fecha: new Date().toISOString().split('T')[0], veterinarioId: 'vet_001', casoId: '',
  });

  // Hospitalización y Medicación state
  const [hospitalizaciones, setHospitalizaciones] = useState<Hospitalizacion[]>([]);
  const [medicaciones, setMedicaciones] = useState<Medicacion[]>([]);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [medicacionDialogOpen, setMedicacionDialogOpen] = useState(false);
  const [editingMedicacion, setEditingMedicacion] = useState<Medicacion | null>(null);
  const [medicacionForm, setMedicacionForm] = useState({
    medicamento: '', dosis: '', via: 'Oral', frecuencia: '', horasProgramadas: '', fechaInicio: new Date().toISOString().split('T')[0],
  });

  // Estado local para evitar re-renders infinitos por params/router
  const [mascotaId, setMascotaId] = useState<string | null>(null);

  useEffect(() => {
    const id = (params as { id: string }).id;
    if (id) setMascotaId(id);
  }, [params]);

  useEffect(() => {
    if (!mascotaId) return;

    let cancelled = false;

    (async () => {
      const mas = await MascotaRepository.getById(mascotaId);
      if (cancelled) return;
      
      if (!mas) {
        router.push('/admin/mascotas');
        return;
      }
      
      setMascota(mas);
      const [cli, c, cas, vac, tra, des, cir, exa, pes, hosps, meds, vets, auds] = await Promise.all([
        ClienteRepository.getById(mas.clienteId),
        CitaRepository.getByMascota(mascotaId),
        CasoRepository.getByMascota(mascotaId),
        VacunaRepository.getByMascota(mascotaId),
        TratamientoRepository.getByMascota(mascotaId),
        DesparasitacionRepository.getByMascota(mascotaId),
        CirugiaRepository.getByMascota(mascotaId),
        ExamenRepository.getByMascota(mascotaId),
        PesoRepository.getByMascota(mascotaId),
        HospitalizacionRepository.getByMascota(mascotaId),
        MedicacionRepository.getByMascota(mascotaId),
        VeterinarioRepository.getAll(),
        AuditRepository.getByMascota(mascotaId),
      ]);
      
      if (cancelled) return;
      
      setCliente(cli || null);
      setCitas([...c].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)));
      setCasos([...cas].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setVacunas([...vac].sort((a, b) => b.fechaAplicacion.localeCompare(a.fechaAplicacion)));
      setTratamientos([...tra].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setDesparasitaciones([...des].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setCirugias([...cir].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setExamenes([...exa].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setPesos(pes);
      setHospitalizaciones(hosps);
      setMedicaciones(meds);
      setVeterinarios(vets);
      setAuditLogs(auds);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [mascotaId, router]);

  useEffect(() => {
    if (!radiographImage) {
      setRadiographPreview(null);
      return;
    }
    const preview = URL.createObjectURL(radiographImage);
    setRadiographPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [radiographImage]);

  const validateImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo seleccionado debe ser una imagen');
      return false;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error('La imagen no puede superar 12 MB');
      return false;
    }
    return true;
  };

  const handleProfileUpload = async (file?: File) => {
    if (!file || !mascota || !validateImage(file)) return;
    setProfileUploading(true);
    try {
      const updated = await MascotaRepository.uploadProfile(mascota.id, file);
      setMascota(updated);
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible subir la foto');
    } finally {
      setProfileUploading(false);
    }
  };

  const resetRadiographForm = () => {
    setRadiographImage(null);
    setRadiographForm({
      titulo: '',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      casoId: '',
    });
  };

  const handleRadiographUpload = async () => {
    if (!mascota || !radiographImage) {
      toast.error('Selecciona la imagen de la radiografía');
      return;
    }
    if (!radiographForm.fecha || !radiographForm.descripcion.trim()) {
      toast.error('Completa la fecha y la descripción');
      return;
    }
    if (!validateImage(radiographImage)) return;

    setRadiographUploading(true);
    try {
      const created = await ExamenRepository.uploadRadiograph(mascota.id, {
        image: radiographImage,
        fecha: radiographForm.fecha,
        descripcion: radiographForm.descripcion.trim(),
        titulo: radiographForm.titulo.trim() || undefined,
        casoId: radiographForm.casoId || undefined,
      });
      setExamenes(previous => [...previous, created].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      resetRadiographForm();
      setRadiographDialogOpen(false);
      toast.success('Radiografía guardada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible guardar la radiografía');
    } finally {
      setRadiographUploading(false);
    }
  };

  const handleDeleteExamen = async (id: string) => {
    if (await ExamenRepository.delete(id)) {
      setExamenes(previous => previous.filter(exam => exam.id !== id));
    }
  };

  const handleGenerateReferralPdf = async () => {
    if (!mascota || !referralForm.motivo.trim() || pdfGenerating) return;
    setPdfGenerating(true);
    try {
      const evolutionGroups = await Promise.all(
        hospitalizaciones.map(hospitalization => EvolucionRepository.getByHospitalizacion(hospitalization.id)),
      );
      const clientFullName = cliente ? `${cliente.nombre} ${cliente.apellido}`.trim() : '';
      const protectedValues = [
        clientFullName,
        cliente?.cedula || '',
        cliente?.telefono || '',
        cliente?.email || '',
        cliente?.direccion || '',
        user?.nombre || '',
        user?.email || '',
        ...veterinarios.flatMap(vet => [vet.nombre, vet.telefono]),
      ].filter(Boolean);

      await generateReferralPdf({
        mascota,
        citas,
        casos,
        vacunas,
        tratamientos,
        desparasitaciones,
        cirugias,
        examenes,
        pesos,
        hospitalizaciones,
        medicaciones,
        evoluciones: evolutionGroups.flat(),
      }, {
        motivo: referralForm.motivo.trim(),
        especialidadDestino: referralForm.especialidadDestino.trim() || undefined,
        solicitud: referralForm.solicitud.trim() || undefined,
        incluirRadiografias: referralForm.incluirRadiografias,
        redactions: protectedValues,
      });

      await AuditRepository.registerReferralExport(mascota.id, {
        incluyeRadiografias: referralForm.incluirRadiografias,
      });

      setReferralDialogOpen(false);
      toast.success('PDF de referencia generado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible generar el PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  // ==================== TRATAMIENTO CRUD ====================
  const openNewTratamiento = () => {
    setEditingTratamiento(null);
    setTratamientoForm({ nombre: '', dosis: '', duracion: '', fecha: new Date().toISOString().split('T')[0], veterinarioId: 'vet_001', casoId: '' });
    setTratamientoDialogOpen(true);
  };

  const openEditTratamiento = (t: Tratamiento) => {
    setEditingTratamiento(t);
    setTratamientoForm({ nombre: t.nombre, dosis: t.dosis, duracion: t.duracion, fecha: t.fecha, veterinarioId: t.veterinarioId, casoId: t.casoId || '' });
    setTratamientoDialogOpen(true);
  };

  const handleSaveTratamiento = async () => {
    if (!tratamientoForm.nombre.trim() || !tratamientoForm.dosis.trim()) return;
    const data = {
      mascotaId: mascota!.id,
      nombre: tratamientoForm.nombre.trim(),
      dosis: tratamientoForm.dosis.trim(),
      duracion: tratamientoForm.duracion.trim(),
      fecha: tratamientoForm.fecha,
      veterinarioId: tratamientoForm.veterinarioId,
      casoId: tratamientoForm.casoId || null,
    };
    const saved = editingTratamiento
      ? await TratamientoRepository.update(editingTratamiento.id, data)
      : await TratamientoRepository.create(data);
    if (!saved) return;
    setTratamientos(prev => (editingTratamiento
      ? prev.map(t => t.id === saved.id ? saved : t)
      : [...prev, saved]
    ).sort((a, b) => b.fecha.localeCompare(a.fecha)));
    setTratamientoDialogOpen(false);
  };

  const handleDeleteTratamiento = async (id: string) => {
    const deleted = await TratamientoRepository.delete(id);
    if (deleted) setTratamientos(prev => prev.filter(t => t.id !== id));
  };

  // ==================== VACUNA DELETE ====================
  const handleDeleteVacuna = async (id: string) => {
    const deleted = await VacunaRepository.delete(id);
    if (deleted) setVacunas(prev => prev.filter(v => v.id !== id));
  };

  // ==================== DESPARASITACION DELETE ====================
  const handleDeleteDesparasitacion = async (id: string) => {
    const deleted = await DesparasitacionRepository.delete(id);
    if (deleted) setDesparasitaciones(prev => prev.filter(d => d.id !== id));
  };

  // ==================== MEDICACIÓN CRUD ====================
  const openNewMedicacion = () => {
    setEditingMedicacion(null);
    setMedicacionForm({ medicamento: '', dosis: '', via: 'Oral', frecuencia: '', horasProgramadas: '', fechaInicio: new Date().toISOString().split('T')[0] });
    setMedicacionDialogOpen(true);
  };

  const openEditMedicacion = (m: Medicacion) => {
    setEditingMedicacion(m);
    setMedicacionForm({ medicamento: m.medicamento, dosis: m.dosis, via: m.via, frecuencia: m.frecuencia, horasProgramadas: m.horasProgramadas.join(', '), fechaInicio: m.fechaInicio });
    setMedicacionDialogOpen(true);
  };

  const handleSaveMedicacion = async () => {
    if (!medicacionForm.medicamento.trim() || !medicacionForm.dosis.trim()) return;
    const horas = medicacionForm.horasProgramadas.split(',').map(h => h.trim()).filter(Boolean);
    // Find the first active hospitalization for this pet
    const activeHosp = hospitalizaciones.find(h => h.estado === 'hospitalizado');
    if (!activeHosp) {
      toast.error('No hay hospitalizaciones activas para agregar medicación');
      return;
    }
    const data = {
      hospitalizacionId: activeHosp.id,
      medicamento: medicacionForm.medicamento.trim(),
      dosis: medicacionForm.dosis.trim(),
      via: medicacionForm.via,
      frecuencia: medicacionForm.frecuencia,
      horasProgramadas: horas,
      fechaInicio: medicacionForm.fechaInicio,
      fechaFin: null,
      tomas: [],
    };
    let saved: Medicacion;
    if (editingMedicacion) {
      // Update: delete old and create new (since medicaciones are tied to hospitalization)
      const deleted = await MedicacionRepository.delete(editingMedicacion.id);
      if (!deleted) return;
      saved = await MedicacionRepository.create(data);
    } else {
      saved = await MedicacionRepository.create(data);
    }
    setMedicaciones(prev => editingMedicacion
      ? [...prev.filter(m => m.id !== editingMedicacion.id), saved]
      : [...prev, saved]);
    setMedicacionDialogOpen(false);
  };

  const handleDeleteMedicacion = async (id: string) => {
    const deleted = await MedicacionRepository.delete(id);
    if (deleted) setMedicaciones(prev => prev.filter(m => m.id !== id));
  };

  const handleAISummary = async () => {
    if (!mascota) return;
    setAiLoading(true);
    setAiSummary(null);
    const response = await resumirHistoria(mascota.id);
    setAiLoading(false);
    if (response.error) {
      setAiSummary(`Error al generar el resumen: ${response.error.message}`);
    } else if (response.data) {
      setAiSummary(response.data.resumen);
    }
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
  const radiografias = examenes.filter(exam => exam.tipo.toLocaleLowerCase('es').includes('radiograf'));

  const whatsappMsg = cliente
    ? `Hola ${cliente.nombre}, le recordamos que ${mascota.nombre} tiene registros en Clínica Veterinaria NANIVET.`
    : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link href="/admin/mascotas"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex min-w-0 flex-1 items-center gap-5 md:gap-7">
          <div className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-3xl border bg-muted shadow-md sm:h-40 sm:w-40 md:h-48 md:w-48">
            {/* URL firmada y temporal; Next/Image no puede optimizar un host dinámico con firma. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mascota.fotoUrl || '/default-pet-avatar.svg'}
              alt={`Foto de ${mascota.nombre}`}
              className="h-full w-full object-cover"
              onError={event => { event.currentTarget.src = '/default-pet-avatar.svg'; }}
            />
            <label
              htmlFor="pet-profile-image"
              className="absolute inset-x-0 bottom-0 flex min-h-11 cursor-pointer items-center justify-center gap-1.5 bg-black/65 px-2 text-xs font-medium text-white transition-colors hover:bg-black/75 focus-within:ring-2 focus-within:ring-primary"
            >
              {profileUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {profileUploading ? 'Subiendo' : 'Cambiar foto'}
              <input
                id="pet-profile-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
                className="sr-only"
                disabled={profileUploading}
                onChange={event => {
                  void handleProfileUpload(event.target.files?.[0]);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{mascota.nombre}</h1>
            <p className="text-sm text-muted-foreground">{mascota.especie} - {mascota.raza || 'Mestizo'} - {mascota.sexo} - {edadMascota(mascota.fechaNacimiento)}</p>
            {isClinical && (
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setReferralDialogOpen(true)}>
                <FileDown className="h-4 w-4" /> Exportar referencia PDF
              </Button>
            )}
          </div>
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
                  <div><p className="text-sm font-medium">{cliente.nombre} {cliente.apellido}</p><p className="text-xs text-muted-foreground">CI: {cliente.cedula || 'Sin registrar'}</p></div>
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
          {isClinical && <TabsTrigger value="tratamientos" className="gap-1.5"><Pill className="h-3.5 w-3.5" /> Tratamientos ({tratamientos.length})</TabsTrigger>}
          {isClinical && <TabsTrigger value="radiografias" className="gap-1.5"><ImagePlus className="h-3.5 w-3.5" /> Radiografías ({radiografias.length})</TabsTrigger>}
          <TabsTrigger value="desparasitaciones" className="gap-1.5"><Pill className="h-3.5 w-3.5" /> Desparasitaciones ({desparasitaciones.length})</TabsTrigger>
          {isClinical && <TabsTrigger value="hospitalizacion" className="gap-1.5"><HeartPulse className="h-3.5 w-3.5" /> Hospitalización ({hospitalizaciones.length})</TabsTrigger>}
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

        {/* Radiografías */}
        {isClinical && (
          <TabsContent value="radiografias">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Radiografías</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Imágenes diagnósticas almacenadas de forma privada.</p>
                </div>
                <Dialog
                  open={radiographDialogOpen}
                  onOpenChange={open => {
                    if (radiographUploading) return;
                    if (open) {
                      setRadiographDialogOpen(true);
                      return;
                    }
                    requestRadiographDiscard(() => {
                      resetRadiographForm();
                      setRadiographDialogOpen(false);
                    });
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="shrink-0 gap-2"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Agregar radiografía</span><span className="sm:hidden">Agregar</span></Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Agregar radiografía</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="radiograph-image">Imagen *</Label>
                        <label
                          htmlFor="radiograph-image"
                          className="flex min-h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/30 text-center transition-colors hover:border-primary/60"
                        >
                          {radiographPreview ? (
                            // Vista previa local creada con URL.createObjectURL.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={radiographPreview} alt="Vista previa de la radiografía" className="max-h-64 w-full object-contain" />
                          ) : (
                            <div className="p-6">
                              <ImagePlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                              <p className="text-sm font-medium">Toca para elegir o tomar una imagen</p>
                              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, HEIC o AVIF; máximo 12 MB</p>
                            </div>
                          )}
                          <input
                            id="radiograph-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
                            className="sr-only"
                            onChange={event => {
                              const file = event.target.files?.[0] || null;
                              setRadiographImage(file && validateImage(file) ? file : null);
                            }}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="radiograph-date">Fecha de toma *</Label>
                          <Input id="radiograph-date" type="date" value={radiographForm.fecha} onChange={event => setRadiographForm(previous => ({ ...previous, fecha: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="radiograph-title">Título</Label>
                          <Input id="radiograph-title" maxLength={200} placeholder="Ej. Tórax lateral" value={radiographForm.titulo} onChange={event => setRadiographForm(previous => ({ ...previous, titulo: event.target.value }))} />
                        </div>
                      </div>
                      {casos.length > 0 && (
                        <div className="space-y-2">
                          <Label>Caso clínico relacionado</Label>
                          <Select value={radiographForm.casoId || 'none'} onValueChange={value => setRadiographForm(previous => ({ ...previous, casoId: value === 'none' ? '' : value }))}>
                            <SelectTrigger><SelectValue placeholder="Sin caso relacionado" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin caso relacionado</SelectItem>
                              {casos.map(caso => <SelectItem key={caso.id} value={caso.id}>{formatDate(caso.fecha)} - {caso.motivo}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="radiograph-description">Descripción *</Label>
                        <Textarea id="radiograph-description" maxLength={2000} rows={4} placeholder="Vista, región anatómica y observaciones relevantes" value={radiographForm.descripcion} onChange={event => setRadiographForm(previous => ({ ...previous, descripcion: event.target.value }))} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => requestRadiographDiscard(() => { resetRadiographForm(); setRadiographDialogOpen(false); })} disabled={radiographUploading}>Cancelar</Button>
                      <Button onClick={handleRadiographUpload} disabled={radiographUploading || !radiographImage || !radiographForm.fecha || !radiographForm.descripcion.trim()} className="gap-2">
                        {radiographUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {radiographUploading ? 'Guardando...' : 'Guardar radiografía'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {radiografias.length === 0 ? (
                  <div className="rounded-xl border border-dashed py-12 text-center">
                    <ImagePlus className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
                    <p className="font-medium">Aún no hay radiografías</p>
                    <p className="mt-1 text-sm text-muted-foreground">Agrega la primera imagen diagnóstica de {mascota.nombre}.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {radiografias.map(radiograph => (
                      <article key={radiograph.id} className="overflow-hidden rounded-xl border bg-card">
                        <div className="relative aspect-[4/3] bg-black/90">
                          {radiograph.archivoUrl ? (
                            // URL firmada y temporal de un bucket privado.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={radiograph.archivoUrl} alt={radiograph.titulo || `Radiografía del ${formatDate(radiograph.fecha)}`} className="h-full w-full object-contain" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-white/70">Imagen no disponible</div>
                          )}
                        </div>
                        <div className="space-y-3 p-4">
                          <div>
                            <p className="font-medium">{radiograph.titulo || 'Radiografía'}</p>
                            <p className="text-xs text-muted-foreground">Tomada el {formatDate(radiograph.fecha)}</p>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{radiograph.descripcion}</p>
                          <div className="flex flex-wrap gap-2">
                            {radiograph.archivoUrl && (
                              <Button asChild variant="outline" size="sm" className="gap-1.5">
                                <a href={radiograph.archivoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Ver completa</a>
                              </Button>
                            )}
                            <AuditedActionDialog title="Eliminar radiografía" description="La imagen y su registro clínico se eliminarán de forma permanente." entity="Examen" entityId={radiograph.id} confirmLabel="Eliminar" onConfirm={() => handleDeleteExamen(radiograph.id)}>
                              <Button variant="destructive" size="sm" className="gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Eliminar</Button>
                            </AuditedActionDialog>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

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
                      {isClinical && (
                        <AuditedActionDialog title="Eliminar vacuna" description={`Se eliminará “${vac.nombre}” del historial clínico.`} entity="Vacuna" entityId={vac.id} confirmLabel="Eliminar" onConfirm={() => handleDeleteVacuna(vac.id)}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                        </AuditedActionDialog>
                      )}
                    </div>
                  );
                })}
                {vacunas.length === 0 && <p className="text-center text-muted-foreground py-8">Sin vacunas registradas</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Desparasitaciones */}
        <TabsContent value="desparasitaciones">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {desparasitaciones.map((d) => {
                  const diasParaProxima = Math.ceil((new Date(d.proximaDosis).getTime() - new Date('2026-10-15').getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={d.id} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0"><Pill className="h-5 w-5 text-amber-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{d.producto}</p>
                        <p className="text-xs text-muted-foreground">Dosis: {d.dosis}</p>
                        <p className="text-xs text-muted-foreground">Aplicada: {formatDate(d.fecha)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Próxima dosis</p>
                        <p className="text-sm font-medium">{formatDate(d.proximaDosis)}</p>
                        <Badge variant={diasParaProxima <= 30 ? 'destructive' : 'secondary'} className="text-[10px] mt-1">
                          {diasParaProxima <= 0 ? 'Vencida' : `${diasParaProxima} días`}
                        </Badge>
                      </div>
                      {isClinical && (
                        <AuditedActionDialog title="Eliminar desparasitación" description={`Se eliminará “${d.producto}” del historial clínico.`} entity="Desparasitacion" entityId={d.id} confirmLabel="Eliminar" onConfirm={() => handleDeleteDesparasitacion(d.id)}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                        </AuditedActionDialog>
                      )}
                    </div>
                  );
                })}
                {desparasitaciones.length === 0 && <p className="text-center text-muted-foreground py-8">Sin desparasitaciones registradas</p>}
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
                <WeightChart data={pesoData} />
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Veterinario</Label>
                        <Select value={tratamientoForm.veterinarioId} onValueChange={(v) => setTratamientoForm({ ...tratamientoForm, veterinarioId: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {veterinarios.map(vet => (
                              <SelectItem key={vet.id} value={vet.id}>{vet.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Vincular a Caso</Label>
                        <Select value={tratamientoForm.casoId || 'none'} onValueChange={(v) => setTratamientoForm({ ...tratamientoForm, casoId: v === 'none' ? '' : v })}>
                          <SelectTrigger><SelectValue placeholder="Sin caso" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin caso</SelectItem>
                            {casos.map(c => <SelectItem key={c.id} value={c.id}>{c.motivo}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
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
                      {t.casoId && <p className="text-[10px] text-muted-foreground mt-0.5">Caso: {casos.find(c => c.id === t.casoId)?.motivo || 'N/A'}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(t.fecha)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTratamiento(t)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <AuditedActionDialog title="Eliminar tratamiento" description={`Se eliminará “${t.nombre}” del historial clínico.`} entity="Tratamiento" entityId={t.id} confirmLabel="Eliminar" onConfirm={() => handleDeleteTratamiento(t.id)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </AuditedActionDialog>
                    </div>
                  </div>
                ))}
                {tratamientos.length === 0 && <p className="text-center text-muted-foreground py-8">Sin tratamientos</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Hospitalización / Medicación */}
        {isClinical && (
        <TabsContent value="hospitalizacion">
          <div className="space-y-4">
            {hospitalizaciones.map((hosp) => {
              const hospMeds = medicaciones.filter(m => m.hospitalizacionId === hosp.id);
              return (
                <Card key={hosp.id}>
                  <CardHeader className="flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <HeartPulse className="h-4 w-4 text-orange-500" />
                        {hosp.motivo}
                        <Badge className={`text-[10px] ${ESTADOS_HOSPITALIZACION[hosp.estado].color}`}>{ESTADOS_HOSPITALIZACION[hosp.estado].label}</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Jaula: {hosp.jaulaArea} - Ingreso: {formatDateTime(hosp.fechaIngreso)}</p>
                    </div>
                    {hosp.estado === 'hospitalizado' && (
                      <Dialog open={medicacionDialogOpen} onOpenChange={setMedicacionDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5" onClick={() => {
                            setEditingMedicacion(null);
                            setMedicacionForm({ medicamento: '', dosis: '', via: 'Oral', frecuencia: '', horasProgramadas: '', fechaInicio: new Date().toISOString().split('T')[0] });
                            setMedicacionDialogOpen(true);
                          }}>
                            <Plus className="h-3.5 w-3.5" /> Agregar medicación
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>{editingMedicacion ? 'Editar Medicación' : 'Nueva Medicación'}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label>Medicamento *</Label>
                                <Input value={medicacionForm.medicamento} onChange={(e) => setMedicacionForm({ ...medicacionForm, medicamento: e.target.value })} placeholder="Ej: Tramadol 50mg" />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Vía</Label>
                                <Select value={medicacionForm.via} onValueChange={(v) => setMedicacionForm({ ...medicacionForm, via: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Oral">Oral</SelectItem>
                                    <SelectItem value="IV">IV</SelectItem>
                                    <SelectItem value="SC">SC</SelectItem>
                                    <SelectItem value="IM">IM</SelectItem>
                                    <SelectItem value="Tópica">Tópica</SelectItem>
                                    <SelectItem value="Inhalatoria">Inhalatoria</SelectItem>
                                    <SelectItem value="Subcutánea">Subcutánea</SelectItem>
                                    <SelectItem value="Inyectable">Inyectable</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label>Dosis *</Label>
                              <Input value={medicacionForm.dosis} onChange={(e) => setMedicacionForm({ ...medicacionForm, dosis: e.target.value })} placeholder="Ej: 2mg/kg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Frecuencia</Label>
                              <Input value={medicacionForm.frecuencia} onChange={(e) => setMedicacionForm({ ...medicacionForm, frecuencia: e.target.value })} placeholder="Ej: Cada 8h, Cada 12h, Continuo" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Horas programadas (separadas por coma)</Label>
                              <Input value={medicacionForm.horasProgramadas} onChange={(e) => setMedicacionForm({ ...medicacionForm, horasProgramadas: e.target.value })} placeholder="Ej: 08:00, 16:00, 00:00" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Fecha inicio</Label>
                              <Input type="date" value={medicacionForm.fechaInicio} onChange={(e) => setMedicacionForm({ ...medicacionForm, fechaInicio: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setMedicacionDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveMedicacion} disabled={!medicacionForm.medicamento.trim() || !medicacionForm.dosis.trim()}>
                              {editingMedicacion ? 'Guardar cambios' : 'Crear medicación'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {hosp.estado === 'hospitalizado' && (
                      <div className="mb-3 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">Hospitalización activa - {hospMeds.length} medicación(es)</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {hospMeds.map((med) => (
                        <div key={med.id} className="p-3 rounded-lg bg-accent/20 border border-border/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-violet-500" />
                              <p className="font-medium text-sm">{med.medicamento}</p>
                              <Badge variant="outline" className="text-[10px]">{med.via}</Badge>
                            </div>
                            <div className="flex gap-1">
                              {hosp.estado === 'hospitalizado' && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMedicacion(med)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <AuditedActionDialog title="Eliminar medicación" description={`Se eliminará “${med.medicamento}” de la hospitalización.`} entity="Medicacion" entityId={med.id} confirmLabel="Eliminar" onConfirm={() => handleDeleteMedicacion(med.id)}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                  </AuditedActionDialog>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p><span className="font-medium">Dosis:</span> {med.dosis}</p>
                            <p><span className="font-medium">Frecuencia:</span> {med.frecuencia}</p>
                            <p><span className="font-medium">Horas:</span> {med.horasProgramadas.join(', ')}</p>
                            <p><span className="font-medium">Período:</span> {formatDate(med.fechaInicio)}{med.fechaFin ? ` - ${formatDate(med.fechaFin)}` : ' - En curso'}</p>
                            {med.tomas && med.tomas.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="font-medium mb-1">Tomas registradas ({med.tomas.filter(t => t.administrada).length}/{med.tomas.length})</p>
                                <div className="flex flex-wrap gap-1">
                                  {med.tomas.map((toma, idx) => (
                                    <Badge key={idx} variant={toma.administrada ? 'default' : 'outline'} className="text-[10px]">
                                      {toma.fecha} {toma.hora} {toma.administrada ? `(${toma.horaReal || 'N/A'})` : 'Pendiente'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {hospMeds.length === 0 && <p className="text-sm text-muted-foreground py-2">Sin medicaciones registradas</p>}
                    </div>
                    {hosp.estado === 'alta' && (
                      <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">Paciente dado de alta el {formatDateTime(hosp.fechaAlta || '')}</p>
                        {hosp.resumenAlta && <p className="text-xs text-muted-foreground mt-1">{hosp.resumenAlta}</p>}
                        {hosp.indicacionesAlta && <p className="text-xs text-muted-foreground mt-1">Indicaciones: {hosp.indicacionesAlta}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {hospitalizaciones.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <HeartPulse className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Sin hospitalizaciones registradas</p>
                </CardContent>
              </Card>
            )}
          </div>
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
            <CardHeader>
              <CardTitle className="text-base">Historial completo de {mascota.nombre}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Incluye cambios de la mascota, citas, casos clínicos, vacunas, tratamientos, desparasitaciones, cirugías, radiografías, peso, hospitalizaciones, medicaciones, tomas y evoluciones.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[36rem] divide-y divide-border/30 overflow-y-auto touch-scroll">
                {auditLogs.map((log) => (
                  <div key={log.id} className="space-y-2 p-4 text-sm hover:bg-accent/20">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="shrink-0 text-[10px] uppercase">{log.accion.replaceAll('_', ' ')}</Badge>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">{log.entidad}</Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">{log.entidadId}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(log.fechaHora)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Realizado por <span className="font-medium text-foreground">{log.usuario}</span> ({log.rol})
                    </p>
                    {log.diff && log.diff.length > 0 && (
                      <div className="space-y-1 rounded-lg bg-accent/30 p-2">
                        {log.diff.map((change, index) => (
                          <p key={`${change.campo}-${index}`} className="break-words text-xs">
                            <span className="font-medium">{change.campo}:</span>{' '}
                            <span className="text-red-600 line-through dark:text-red-400">{String(change.antes ?? 'Sin dato')}</span>{' → '}
                            <span className="text-emerald-700 dark:text-emerald-400">{String(change.despues ?? 'Sin dato')}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {(!log.diff || log.diff.length === 0) && log.valoresDespues && Object.keys(log.valoresDespues).length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-accent/30 p-2 text-xs">
                        {Object.entries(log.valoresDespues).map(([field, value]) => (
                          <span key={field} className="break-all"><span className="font-medium">{field}:</span> {String(value ?? 'Sin dato')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-center text-muted-foreground py-8">Sin registros de auditoría</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
      {radiographDiscardDialog}

      <Dialog open={referralDialogOpen} onOpenChange={open => { if (!pdfGenerating) setReferralDialogOpen(open); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileDown className="h-5 w-5 text-primary" /> Exportar referencia veterinaria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-teal-500/30 bg-teal-500/10 p-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
              <div>
                <p className="text-sm font-medium">Documento clínico anonimizado</p>
                <p className="mt-1 text-xs text-muted-foreground">El PDF excluye datos personales del propietario y de los profesionales. Tampoco incluye cédula, teléfono, correo, dirección, microchip ni identificadores internos.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-reason">Motivo de referencia o propósito del informe *</Label>
              <Textarea
                id="referral-reason"
                maxLength={1000}
                rows={3}
                placeholder="Ej. Evaluación por cardiología debido a soplo y baja tolerancia al ejercicio"
                value={referralForm.motivo}
                onChange={event => setReferralForm(previous => ({ ...previous, motivo: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-specialty">Especialidad o servicio de destino</Label>
              <Input
                id="referral-specialty"
                maxLength={150}
                placeholder="Ej. Cardiología veterinaria"
                value={referralForm.especialidadDestino}
                onChange={event => setReferralForm(previous => ({ ...previous, especialidadDestino: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-request">Solicitud clínica para el profesional receptor</Label>
              <Textarea
                id="referral-request"
                maxLength={1500}
                rows={3}
                placeholder="Preguntas clínicas, estudios solicitados o aspectos que deben evaluarse"
                value={referralForm.solicitud}
                onChange={event => setReferralForm(previous => ({ ...previous, solicitud: event.target.value }))}
              />
            </div>
            <label htmlFor="include-radiographs" className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                id="include-radiographs"
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded accent-primary"
                checked={referralForm.incluirRadiografias}
                onChange={event => setReferralForm(previous => ({ ...previous, incluirRadiografias: event.target.checked }))}
              />
              <span><span className="block text-sm font-medium">Incluir imágenes radiográficas</span><span className="mt-0.5 block text-xs text-muted-foreground">Puede aumentar el tamaño del archivo y el tiempo de generación.</span></span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={pdfGenerating} onClick={() => setReferralDialogOpen(false)}>Cancelar</Button>
            <Button className="gap-2" disabled={pdfGenerating || !referralForm.motivo.trim()} onClick={handleGenerateReferralPdf}>
              {pdfGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {pdfGenerating ? 'Preparando PDF...' : 'Generar y descargar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
