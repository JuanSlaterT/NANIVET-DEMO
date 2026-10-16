'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Plus, Edit, Trash2, Search, MessageCircle, Calendar as CalIcon, HeartPulse } from 'lucide-react';
import { CitaRepository, MascotaRepository, VeterinarioRepository, ClienteRepository, HospitalizacionRepository } from '@/lib/repositories';
import { ESTADOS_CITA, TIPOS_SERVICIO, formatDateTime, formatDate, formatTime, buildWhatsAppUrl } from '@/lib/constants';
import type { Cita, Mascota, Veterinario, Cliente, Hospitalizacion } from '@/lib/models';

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [hospitalizaciones, setHospitalizaciones] = useState<Hospitalizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cita | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cita | null>(null);
  const [whatsappTarget, setWhatsappTarget] = useState<Cita | null>(null);

  const [form, setForm] = useState({
    mascotaId: '', veterinarioId: '', tipoServicio: 'consulta',
    fecha: '', hora: '', estado: 'pendiente', motivo: '', notas: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    const [c, mas, v, cli, hosps] = await Promise.all([
      CitaRepository.getAll(), MascotaRepository.getAll(),
      VeterinarioRepository.getAll(), ClienteRepository.getAll(),
      HospitalizacionRepository.getAll(),
    ]);
    setCitas(c.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)));
    setMascotas(mas);
    setVets(v);
    setClientes(cli);
    setHospitalizaciones(hosps);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getMascota = (id: string) => mascotas.find(m => m.id === id);
  const getCliente = (mascotaId: string) => {
    const mas = getMascota(mascotaId);
    return mas ? clientes.find(c => c.id === mas.clienteId) : undefined;
  };
  const getVet = (id: string) => vets.find(v => v.id === id);
  const getCitaHospitalizada = (citaId: string) => hospitalizaciones.find(h => h.citaId === citaId && h.estado === 'hospitalizado');

  const filtered = citas.filter(c => {
    const mas = getMascota(c.mascotaId);
    const cli = getCliente(c.mascotaId);
    const q = search.toLowerCase();
    const matchSearch = (mas?.nombre || '').toLowerCase().includes(q) || (cli?.nombre || '').toLowerCase().includes(q) || c.motivo.toLowerCase().includes(q);
    const matchEstado = filtroEstado === 'all' || c.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const openNew = () => {
    setEditing(null);
    setForm({ mascotaId: '', veterinarioId: '', tipoServicio: 'consulta', fecha: '2026-10-15', hora: '09:00', estado: 'pendiente', motivo: '', notas: '' });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (cita: Cita) => {
    const d = new Date(cita.fechaHora);
    setEditing(cita);
    setForm({
      mascotaId: cita.mascotaId, veterinarioId: cita.veterinarioId, tipoServicio: cita.tipoServicio,
      fecha: cita.fechaHora.slice(0, 10), hora: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      estado: cita.estado, motivo: cita.motivo, notas: cita.notas,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.mascotaId) e.mascotaId = 'La mascota es obligatoria';
    if (!form.veterinarioId) e.veterinarioId = 'El veterinario es obligatorio';
    if (!form.fecha) e.fecha = 'La fecha es obligatoria';
    if (!form.hora) e.hora = 'La hora es obligatoria';
    if (!form.motivo.trim()) e.motivo = 'El motivo es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const fechaHora = `${form.fecha}T${form.hora}:00`;
    const data = {
      mascotaId: form.mascotaId, veterinarioId: form.veterinarioId,
      tipoServicio: form.tipoServicio as keyof typeof TIPOS_SERVICIO,
      fechaHora, estado: form.estado as keyof typeof ESTADOS_CITA,
      motivo: form.motivo.trim(), notas: form.notas.trim(),
    };
    if (editing) {
      await CitaRepository.update(editing.id, data);
    } else {
      await CitaRepository.create(data);
    }
    setDialogOpen(false);
    await loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await CitaRepository.delete(deleteTarget.id);
    setDeleteTarget(null);
    await loadData();
  };

  const buildMsg = (cita: Cita) => {
    const mas = getMascota(cita.mascotaId);
    const cli = getCliente(cita.mascotaId);
    const vet = getVet(cita.veterinarioId);
    return `Estimado/a ${cli?.nombre || ''}, le recordamos su cita en Clínica Veterinaria NANIVET:\n\n*Mascota:* ${mas?.nombre || ''}\n*Servicio:* ${TIPOS_SERVICIO[cita.tipoServicio].label}\n*Veterinario:* ${vet?.nombre || ''}\n*Fecha:* ${formatDateTime(cita.fechaHora)}\n*Motivo:* ${cita.motivo}\n\nGracias por su preferencia.`;
  };

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citas</h1>
          <p className="text-sm text-muted-foreground mt-1">{citas.length} citas registradas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nueva Cita</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por mascota, cliente, motivo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(ESTADOS_CITA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Veterinario</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Hospitalización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cita) => {
                  const mas = getMascota(cita.mascotaId);
                  const cli = getCliente(cita.mascotaId);
                  const vet = getVet(cita.veterinarioId);
                  return (
                    <TableRow key={cita.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{formatDateTime(cita.fechaHora)}</TableCell>
                      <TableCell className="font-medium">{mas?.nombre || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{cli?.nombre} {cli?.apellido}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{vet?.nombre}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`w-2 h-2 rounded-full ${TIPOS_SERVICIO[cita.tipoServicio].color}`} />
                          {TIPOS_SERVICIO[cita.tipoServicio].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADOS_CITA[cita.estado].color}`}>{ESTADOS_CITA[cita.estado].label}</span>
                      </TableCell>
                      {cita.tipoServicio === 'cirugia' && (ESTADOS_CITA[cita.estado].label === 'Confirmada' || ESTADOS_CITA[cita.estado].label === 'Atendida') && (
                        <TableCell>
                          {getCitaHospitalizada(cita.id) ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/20 text-red-700 dark:text-red-400 flex items-center gap-1 justify-end">
                              <HeartPulse className="h-3 w-3" /> Hospitalizado
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <HeartPulse className="h-3 w-3" /> Sin hospitalizar
                            </span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={() => setWhatsappTarget(cita)} title="Enviar WhatsApp"><MessageCircle className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cita)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(cita)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No se encontraron citas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mascota <span className="text-destructive">*</span></Label>
              <Select value={form.mascotaId} onValueChange={(v) => setForm({ ...form, mascotaId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar mascota..." /></SelectTrigger>
                <SelectContent>
                  {mascotas.map(m => {
                    const cli = clientes.find(c => c.id === m.clienteId);
                    return <SelectItem key={m.id} value={m.id}>{m.nombre} - {cli?.nombre} {cli?.apellido}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              {errors.mascotaId && <p className="text-xs text-destructive">{errors.mascotaId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Veterinario <span className="text-destructive">*</span></Label>
                <Select value={form.veterinarioId} onValueChange={(v) => setForm({ ...form, veterinarioId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {vets.map(v => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.veterinarioId && <p className="text-xs text-destructive">{errors.veterinarioId}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Servicio <span className="text-destructive">*</span></Label>
                <Select value={form.tipoServicio} onValueChange={(v) => setForm({ ...form, tipoServicio: v as keyof typeof TIPOS_SERVICIO })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_SERVICIO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                {errors.fecha && <p className="text-xs text-destructive">{errors.fecha}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Hora <span className="text-destructive">*</span></Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
                {errors.hora && <p className="text-xs text-destructive">{errors.hora}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v as keyof typeof ESTADOS_CITA })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_CITA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo <span className="text-destructive">*</span></Label>
              <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Vacunación anual" />
              {errors.motivo && <p className="text-xs text-destructive">{errors.motivo}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar cita</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Eliminar la cita de {getMascota(deleteTarget?.mascotaId || '')?.nombre}?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp dialog */}
      <Dialog open={!!whatsappTarget} onOpenChange={(open) => { if (!open) setWhatsappTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enviar WhatsApp</DialogTitle></DialogHeader>
          {whatsappTarget && (() => {
            const cli = getCliente(whatsappTarget.mascotaId);
            if (!cli) return <p className="text-sm text-muted-foreground">No hay cliente asociado</p>;
            const msg = buildMsg(whatsappTarget);
            return (
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Para: {cli.nombre} {cli.apellido} - {cli.telefono}</p>
                  <Textarea value={msg} readOnly rows={8} className="text-xs" />
                </div>
                <Button asChild className="w-full gap-2">
                  <a href={buildWhatsAppUrl(cli.telefono, msg)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> Abrir WhatsApp</a>
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
