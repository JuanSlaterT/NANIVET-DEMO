'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Search, Plus, Phone, Mail, Eye, Edit, Trash2, PawPrint, AlertCircle } from 'lucide-react';
import { ClienteRepository, MascotaRepository } from '@/lib/repositories';
import { formatDate } from '@/lib/constants';
import { VERSION_AVISO_PRIVACIDAD } from '@/lib/models';
import type { Cliente, Mascota } from '@/lib/models';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', cedula: '', email: '', direccion: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const loadData = async () => {
    const [cli, mas] = await Promise.all([
      ClienteRepository.getAll(),
      MascotaRepository.getAll(),
    ]);
    setClientes(cli);
    setMascotas(mas);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase();
    return c.nombre.toLowerCase().includes(q) || c.apellido.toLowerCase().includes(q) || c.cedula.includes(q) || c.telefono.includes(q);
  });

  const getMascotasCount = (cliId: string) => mascotas.filter(m => m.clienteId === cliId).length;

  const openNew = () => {
    setEditing(null);
    setForm({ nombre: '', apellido: '', telefono: '', cedula: '', email: '', direccion: '' });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (cli: Cliente) => {
    setEditing(cli);
    setForm({
      nombre: cli.nombre, apellido: cli.apellido, telefono: cli.telefono, cedula: cli.cedula,
      email: cli.email || '', direccion: cli.direccion || '',
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio';
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio';
    if (!form.cedula.trim()) e.cedula = 'La cédula es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const data = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono.trim(),
      cedula: form.cedula.trim(),
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
    };
    if (editing) {
      await ClienteRepository.update(editing.id, data);
    } else {
      await ClienteRepository.create({
        ...data,
        consentimientoDatos: { aceptado: true, fechaHora: new Date().toISOString(), versionAviso: VERSION_AVISO_PRIVACIDAD },
        consentimientoComunicaciones: { aceptado: false, fechaHora: null },
        fechaRevocacion: null,
      });
    }
    setDialogOpen(false);
    await loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await ClienteRepository.delete(deleteTarget.id);
    if (!ok) {
      setDeleteError('No se puede eliminar: el cliente tiene mascotas registradas');
      return;
    }
    setDeleteTarget(null);
    setDeleteError('');
    await loadData();
  };

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{clientes.length} clientes registrados</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, cédula, teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Cédula</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="text-center">Mascotas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cli) => (
                <TableRow key={cli.id}>
                  <TableCell>
                    <Link href={`/admin/clientes/${cli.id}`} className="hover:text-primary transition-colors">
                      <div className="font-medium">{cli.nombre} {cli.apellido}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{cli.telefono}</div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">{cli.cedula}</TableCell>
                  <TableCell className="hidden md:table-cell">{cli.telefono}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{cli.email || '-'}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <PawPrint className="h-3.5 w-3.5 text-primary" />
                      {getMascotasCount(cli.id)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/clientes/${cli.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cli)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeleteTarget(cli); setDeleteError(''); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No se encontraron clientes</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre <span className="text-destructive">*</span></Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Apellido <span className="text-destructive">*</span></Label>
                <Input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
                {errors.apellido && <p className="text-xs text-destructive">{errors.apellido}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Teléfono WhatsApp <span className="text-destructive">*</span></Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="0991234567" />
                {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Cédula <span className="text-destructive">*</span></Label>
                <Input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} placeholder="0901234567" />
                {errors.cedula && <p className="text-xs text-destructive">{errors.cedula}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email (opcional)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección (opcional)</Label>
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Av. Principal 123, Esmeraldas" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
          </DialogHeader>
          {deleteError ? (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {deleteError}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">¿Estás seguro de eliminar a {deleteTarget?.nombre} {deleteTarget?.apellido}? Esta acción no se puede deshacer.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!deleteError}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
