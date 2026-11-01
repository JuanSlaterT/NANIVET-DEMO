'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Users, Search, Plus, Mail, Phone, Key, Eye, Edit, Trash2, Shield,
  UserCheck, UserCog, AlertCircle, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { StaffRepository } from '@/lib/repositories';
import { ROLES, formatDate } from '@/lib/constants';
import type { Rol } from '@/lib/constants';
import type { Staff } from '@/lib/models';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'veterinario' as Rol,
    telefono: '',
    especialidad: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    const data = await StaffRepository.getAll();
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter(s => (
      s.nombre.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.rol.toLowerCase().includes(q) ||
      (s.especialidad && s.especialidad.toLowerCase().includes(q))
    ));
  }, [staff, search]);

  const openNew = () => {
    setEditing(null);
    setForm({
      nombre: '',
      email: '',
      password: '',
      rol: 'veterinario',
      telefono: '',
      especialidad: '',
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      nombre: s.nombre,
      email: s.email,
      password: '',
      rol: s.rol,
      telefono: s.telefono || '',
      especialidad: s.especialidad || '',
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!form.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email inválido';
    } else {
      const emailExists = staff.some(
        (s) => s.email.toLowerCase() === form.email.toLowerCase() && s.id !== editing?.id
      );
      if (emailExists) newErrors.email = 'Este email ya está registrado';
    }

    if (!editing && !form.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria al crear un usuario';
    } else if (!editing && form.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (!form.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';

    if (form.rol === 'veterinario' && !form.especialidad.trim()) {
      newErrors.especialidad = 'La especialidad es obligatoria para veterinarios';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (saving || !validate()) return;
    setSaving(true);

    try {
      let saved: Staff | null;
      if (editing) {
        const updateData: Partial<Staff> = {
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          especialidad: form.rol === 'veterinario' ? form.especialidad : null,
        };
        if (form.password) updateData.password = form.password;

        saved = await StaffRepository.update(editing.id, updateData);
      } else {
        saved = await StaffRepository.create({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol: form.rol,
          telefono: form.telefono,
          especialidad: form.rol === 'veterinario' ? form.especialidad : null,
        });
      }

      if (!saved) throw new Error('No se pudo guardar el usuario');
      setStaff(prev => editing
        ? prev.map(member => member.id === saved!.id ? saved! : member)
        : [...prev, saved!]);
      setDialogOpen(false);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Error al guardar el usuario' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const targetId = deleteTarget.id;
      await StaffRepository.delete(targetId);
      setStaff(prev => prev.filter(member => member.id !== targetId));
      setDeleteTarget(null);
      setConfirmOpen(false);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Error al eliminar el usuario' });
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (rol: Rol) => {
    const config: Record<Rol, { label: string; className: string }> = {
      admin: { label: 'Administrador', className: 'bg-purple-500/20 text-purple-700 dark:text-purple-400' },
      veterinario: { label: 'Veterinario', className: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
      recepcionista: { label: 'Recepcionista', className: 'bg-sky-500/20 text-sky-700 dark:text-sky-400' },
    };
    const c = config[rol];
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getRoleIcon = (rol: Rol) => {
    switch (rol) {
      case 'admin': return Shield;
      case 'veterinario': return UserCog;
      case 'recepcionista': return UserCheck;
    }
  };

  const stats = useMemo(() => ({
    total: staff.length,
    veterinarios: staff.filter(s => s.rol === 'veterinario').length,
    recepcionistas: staff.filter(s => s.rol === 'recepcionista').length,
    activos: staff.filter(s => s.activo).length,
  }), [staff]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Staff
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de usuarios del sistema — veterinarios y recepcionistas
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total usuarios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserCog className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.veterinarios}</p>
              <p className="text-sm text-muted-foreground">Veterinarios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.recepcionistas}</p>
              <p className="text-sm text-muted-foreground">Recepcionistas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Key className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activos}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email, rol o especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Alta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => {
                const RoleIcon = getRoleIcon(s.rol);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          s.rol === 'admin' ? 'bg-purple-500' :
                          s.rol === 'veterinario' ? 'bg-emerald-500' :
                          'bg-sky-500'
                        }`}>
                          {s.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium">{s.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.telefono}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(s.rol)}</TableCell>
                    <TableCell className="text-muted-foreground">{s.especialidad || '—'}</TableCell>
                    <TableCell>
                      {s.activo ? (
                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-700 dark:text-red-400">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.fechaAlta ? formatDate(s.fechaAlta) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(s)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {s.rol !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget(s);
                              setConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rol selector */}
            <div>
              <Label>Rol de Usuario *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['veterinario', 'recepcionista'] as Rol[]).map((rol) => {
                  const RoleIcon = getRoleIcon(rol);
                  return (
                    <Button
                      key={rol}
                      type="button"
                      variant={form.rol === rol ? 'default' : 'outline'}
                      className={`flex flex-col h-auto py-3 ${
                        form.rol === rol ? '' : 'hover:bg-accent'
                      }`}
                      onClick={() => setForm(prev => ({ ...prev, rol }))}
                    >
                      <RoleIcon className="h-5 w-5 mb-1" />
                      <span className="text-xs">{ROLES[rol]}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                className={errors.nombre ? 'border-destructive' : ''}
              />
              {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">
                {editing ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPasswords.password ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                  placeholder={editing ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="0991234567"
                className={errors.telefono ? 'border-destructive' : ''}
              />
              {errors.telefono && <p className="text-xs text-destructive mt-1">{errors.telefono}</p>}
            </div>

            {form.rol === 'veterinario' && (
              <div>
                <Label htmlFor="especialidad">Especialidad *</Label>
                <Input
                  id="especialidad"
                  value={form.especialidad}
                  onChange={(e) => setForm(prev => ({ ...prev, especialidad: e.target.value }))}
                  placeholder="Medicina interna, Cirugía, etc."
                  className={errors.especialidad ? 'border-destructive' : ''}
                />
                {errors.especialidad && <p className="text-xs text-destructive mt-1">{errors.especialidad}</p>}
              </div>
            )}
          </div>

          {errors.submit && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-2">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Eliminar Usuario
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            ¿Está seguro que desea eliminar al usuario{' '}
            <strong>{deleteTarget?.nombre}</strong>?
          </p>
          <p className="text-xs text-muted-foreground">
            Esta acción no se puede deshacer. El usuario perderá acceso al sistema.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmOpen(false); setDeleteTarget(null); }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
