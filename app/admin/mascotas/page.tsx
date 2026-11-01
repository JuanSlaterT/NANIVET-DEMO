'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PawPrint, Search, Plus, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { MascotaRepository, ClienteRepository } from '@/lib/repositories';
import { ESPECIES, SEXOS, formatDate } from '@/lib/constants';
import type { Mascota, Cliente } from '@/lib/models';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

const EMPTY_MASCOTA_FORM = {
  clienteId: '', nombre: '', especie: 'Perro', sexo: 'Macho',
  fechaNacimiento: '', raza: '', color: '', esterilizado: false,
  alergias: '', microchip: '', notas: '',
};

export default function MascotasPage() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Mascota | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mascota | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(EMPTY_MASCOTA_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_MASCOTA_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formDirty = dialogOpen && JSON.stringify(form) !== JSON.stringify(initialForm);
  const { requestDiscard, discardDialog } = useUnsavedChanges(formDirty);

  const loadData = async () => {
    const [mas, cli] = await Promise.all([MascotaRepository.getAll(), ClienteRepository.getAll()]);
    setMascotas(mas);
    setClientes(cli);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const clientesById = useMemo(() => new Map(clientes.map(c => [c.id, c])), [clientes]);
  const getCliente = (id: string) => clientesById.get(id);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mascotas.filter(m => {
      const matchSearch = m.nombre.toLowerCase().includes(q) || (m.raza || '').toLowerCase().includes(q) || m.especie.toLowerCase().includes(q);
      const matchEspecie = filtroEspecie === 'all' || m.especie === filtroEspecie;
      return matchSearch && matchEspecie;
    });
  }, [mascotas, search, filtroEspecie]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_MASCOTA_FORM);
    setInitialForm(EMPTY_MASCOTA_FORM);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (mas: Mascota) => {
    setEditing(mas);
    const values = {
      clienteId: mas.clienteId, nombre: mas.nombre, especie: mas.especie, sexo: mas.sexo,
      fechaNacimiento: mas.fechaNacimiento, raza: mas.raza || '', color: mas.color || '',
      esterilizado: mas.esterilizado || false, alergias: mas.alergias || '',
      microchip: mas.microchip || '', notas: mas.notas || '',
    };
    setForm(values);
    setInitialForm(values);
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.clienteId) e.clienteId = 'El cliente es obligatorio';
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.especie) e.especie = 'La especie es obligatoria';
    if (!form.sexo) e.sexo = 'El sexo es obligatorio';
    if (!form.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (saving || !validate()) return;
    setSaving(true);
    const data = {
      clienteId: form.clienteId,
      nombre: form.nombre.trim(),
      especie: form.especie,
      sexo: form.sexo,
      fechaNacimiento: form.fechaNacimiento,
      raza: form.raza.trim() || null,
      color: form.color.trim() || null,
      esterilizado: form.esterilizado,
      alergias: form.alergias.trim() || null,
      microchip: form.microchip.trim() || null,
      notas: form.notas.trim() || null,
    };
    try {
      const saved = editing
        ? await MascotaRepository.update(editing.id, data)
        : await MascotaRepository.create(data);
      if (!saved) return;
      setMascotas(prev => editing
        ? prev.map(mascota => mascota.id === saved.id ? saved : mascota)
        : [...prev, saved]);
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const targetId = deleteTarget.id;
      const ok = await MascotaRepository.delete(targetId);
      if (!ok) return;
      setMascotas(prev => prev.filter(mascota => mascota.id !== targetId));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const edadMascota = (fechaNac: string) => {
    const nac = new Date(fechaNac);
    const ahora = new Date('2026-10-15');
    const meses = (ahora.getFullYear() - nac.getFullYear()) * 12 + (ahora.getMonth() - nac.getMonth());
    if (meses < 12) return `${meses}m`;
    const años = Math.floor(meses / 12);
    const m = meses % 12;
    return m > 0 ? `${años}a ${m}m` : `${años}a`;
  };

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}</div></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mascotas</h1>
          <p className="text-sm text-muted-foreground mt-1">{mascotas.length} mascotas registradas</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nueva Mascota</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, raza..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroEspecie} onValueChange={setFiltroEspecie}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Especie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {ESPECIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((mas) => {
          const cli = getCliente(mas.clienteId);
          return (
            <Card key={mas.id} className="hover:border-primary/40 transition-all group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <PawPrint className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/mascotas/${mas.id}`} className="font-medium hover:text-primary transition-colors truncate">{mas.nombre}</Link>
                      {mas.alergias && (
                        <span title={`Alergias: ${mas.alergias}`}><AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" /></span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{mas.especie} - {mas.raza || 'Mestizo'}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{cli?.nombre} {cli?.apellido}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{mas.sexo}</Badge>
                      <Badge variant="outline" className="text-[10px]">{edadMascota(mas.fechaNacimiento)}</Badge>
                      {mas.esterilizado && <Badge variant="outline" className="text-[10px] text-teal-600">Esterilizado</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/mascotas/${mas.id}`}><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(mas)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(mas)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No se encontraron mascotas</div>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (open) setDialogOpen(true);
        else requestDiscard(() => setDialogOpen(false));
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Mascota' : 'Nueva Mascota'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cliente (dueño) <span className="text-destructive">*</span></Label>
              <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido}{c.cedula ? ` - ${c.cedula}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre <span className="text-destructive">*</span></Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Especie <span className="text-destructive">*</span></Label>
                <Select value={form.especie} onValueChange={(v) => setForm({ ...form, especie: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ESPECIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sexo <span className="text-destructive">*</span></Label>
                <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEXOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de nacimiento <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} />
                {errors.fechaNacimiento && <p className="text-xs text-destructive">{errors.fechaNacimiento}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Raza (opcional)</Label>
                <Input value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} placeholder="Ej: Labrador" />
              </div>
              <div className="space-y-1.5">
                <Label>Color (opcional)</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ej: Dorado" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Microchip (opcional)</Label>
                <Input value={form.microchip} onChange={(e) => setForm({ ...form, microchip: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Alergias (opcional)</Label>
                <Input value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} placeholder="Ej: Penicilina" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="esterilizado" checked={form.esterilizado} onChange={(e) => setForm({ ...form, esterilizado: e.target.checked })} className="rounded" />
              <Label htmlFor="esterilizado">Esterilizado</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => requestDiscard(() => setDialogOpen(false))}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {discardDialog}

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar mascota</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Eliminar a {deleteTarget?.nombre}? Se perderán todos sus registros clínicos.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminando...' : 'Eliminar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
