'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Pill, Search, Plus, Settings2, Trash2, Edit2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { DesparasitacionRepository, MascotaRepository, VeterinarioRepository, CatalogoRepository } from '@/lib/repositories';
import { formatDate } from '@/lib/constants';
import { useAuth } from '@/components/auth-provider';
import type { Desparasitacion, Mascota, Veterinario, CatalogoDesparasitacion } from '@/lib/models';
import { AuditedActionDialog } from '@/components/admin/audited-action-dialog';

export default function DesparasitacionPage() {
  const { user } = useAuth();
  const canCreate = user && (user.rol === 'admin' || user.rol === 'veterinario');

  const [desparasitaciones, setDesparasitaciones] = useState<Desparasitacion[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoDesparasitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openCatalogDialog, setOpenCatalogDialog] = useState(false);

  // Form state
  const [form, setForm] = useState({
    mascotaId: '',
    productoId: '',
    dosis: '',
    fecha: '',
    veterinarioId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Catalog form state
  const [catalogForm, setCatalogForm] = useState<Omit<CatalogoDesparasitacion, 'id'>>({
    nombre: '',
    intervaloMeses: 3,
    via: 'Oral',
    activa: true,
  });
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [catalogFormErrors, setCatalogFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [d, m, vet, cat] = await Promise.all([
        DesparasitacionRepository.getAll(),
        MascotaRepository.getAll(),
        VeterinarioRepository.getAll(),
        CatalogoRepository.getAllDesparasitaciones(),
      ]);
      setDesparasitaciones(d.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setMascotas(m);
      setVeterinarios(vet);
      setCatalogos(cat);
      setLoading(false);
    })();
  }, []);

  const getMascota = (id: string) => mascotas.find(m => m.id === id);
  const hoy = new Date('2026-10-15');

  const diasParaProxima = (fecha: string) => Math.ceil((new Date(fecha).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  const calcularProximaDosis = (productoId: string, fecha: string): string => {
    const producto = catalogos.find(p => p.id === productoId);
    const meses = producto?.intervaloMeses || 3;
    const fechaCalc = new Date(fecha);
    fechaCalc.setMonth(fechaCalc.getMonth() + meses);
    return fechaCalc.toISOString().split('T')[0];
  };

  const getProductoNombre = (productoId: string) => catalogos.find(p => p.id === productoId)?.nombre || '';

  const getStatusInfo = (fechaProxima: string) => {
    const proxima = new Date(fechaProxima);
    proxima.setHours(0, 0, 0, 0);
    const diffMs = proxima.getTime() - hoy.getTime();
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (dias <= 0) return { label: 'Vencida', variant: 'destructive' as const, icon: XCircle, color: 'text-destructive', dias };
    if (dias <= 90) return { label: `Por vencer (${dias}d)`, variant: 'secondary' as const, icon: AlertTriangle, color: 'text-amber-500', dias };
    return { label: `Al día (${dias}d)`, variant: 'outline' as const, icon: CheckCircle2, color: 'text-emerald-500', dias };
  };

  const vencidasCount = desparasitaciones.filter(d => getStatusInfo(d.proximaDosis).dias <= 0).length;
  const porVencerCount = desparasitaciones.filter(d => { const info = getStatusInfo(d.proximaDosis); return info.dias > 0 && info.dias <= 90; }).length;
  const alDiaCount = desparasitaciones.filter(d => getStatusInfo(d.proximaDosis).dias > 90).length;

  const getProductoDosisTipica = (productoId: string) => {
    const producto = catalogos.find(p => p.id === productoId);
    if (!producto) return '';
    // Retornar dosis típica basada en el nombre del producto
    const nombre = producto.nombre.toLowerCase();
    if (nombre.includes('praziquantel')) return '1 tableta/10kg PO';
    if (nombre.includes('ivermectina')) return '0.2mg/kg SC';
    if (nombre.includes('milbemicina')) return '1 tableta PO';
    if (nombre.includes('emodepsida')) return '1 aplicación';
    if (nombre.includes('selamectina') || nombre.includes('revolution')) return '1 aplicación tópica en nuca';
    if (nombre.includes('morantel')) return '1 tableta/20kg PO';
    return '1 tableta PO';
  };

  const filtered = desparasitaciones.filter(d => {
    const mas = getMascota(d.mascotaId);
    const q = search.toLowerCase();
    const matchSearch = (mas?.nombre || '').toLowerCase().includes(q) || d.producto.toLowerCase().includes(q);
    const dias = diasParaProxima(d.proximaDosis);
    const matchFiltro = filtro === 'all' || (filtro === 'vencidas' && dias <= 0) || (filtro === 'por_vencer' && dias > 0 && dias <= 30) || (filtro === 'al_dia' && dias > 30);
    return matchSearch && matchFiltro;
  });

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-completar dosis cuando cambia el producto
      if (field === 'productoId') {
        updated.dosis = getProductoDosisTipica(value);
      }
      return updated;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.mascotaId) errors.mascotaId = 'Selecciona una mascota';
    if (!form.productoId) errors.productoId = 'Selecciona un producto';
    if (!form.dosis.trim()) errors.dosis = 'La dosis es obligatoria';
    if (!form.fecha) errors.fecha = 'La fecha es obligatoria';
    if (!form.veterinarioId) errors.veterinarioId = 'Selecciona un veterinario';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const proximaDosis = calcularProximaDosis(form.productoId, form.fecha);
      const productoNombre = getProductoNombre(form.productoId);
      const nuevaDesparasitacion = await DesparasitacionRepository.create({
        mascotaId: form.mascotaId,
        casoId: null,
        producto: productoNombre,
        dosis: form.dosis.trim(),
        fecha: form.fecha,
        proximaDosis,
        veterinarioId: form.veterinarioId,
      });

      setDesparasitaciones(prev => [nuevaDesparasitacion, ...prev]);
      setForm({ mascotaId: '', productoId: '', dosis: '', fecha: '', veterinarioId: '' });
      setFormErrors({});
      setOpenDialog(false);
    } catch (error) {
      console.error('Error al crear desparasitación:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Catalog handlers
  const handleCatalogFormChange = (field: string, value: string | number | boolean) => {
    setCatalogForm(prev => ({ ...prev, [field]: value }));
  };

  const validateCatalogForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!catalogForm.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (catalogForm.intervaloMeses < 1) errors.intervaloMeses = 'El intervalo debe ser mayor a 0';
    setCatalogFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCatalog = async () => {
    if (!validateCatalogForm()) return;

    try {
      if (editingCatalogId) {
        await CatalogoRepository.updateDesparasitacion(editingCatalogId, catalogForm);
      } else {
        await CatalogoRepository.createDesparasitacion(catalogForm);
      }
      const updated = await CatalogoRepository.getAllDesparasitaciones();
      setCatalogos(updated);
      resetCatalogForm();
      setOpenCatalogDialog(false);
    } catch (error) {
      console.error('Error al guardar catálogo:', error);
    }
  };

  const handleEditCatalog = (producto: CatalogoDesparasitacion) => {
    setCatalogForm({
      nombre: producto.nombre,
      intervaloMeses: producto.intervaloMeses,
      via: producto.via,
      activa: producto.activa,
    });
    setEditingCatalogId(producto.id);
    setOpenCatalogDialog(true);
  };

  const handleDeleteCatalog = async (id: string) => {
    const deleted = await CatalogoRepository.deleteDesparasitacion(id);
    if (deleted) setCatalogos(prev => prev.filter(p => p.id !== id));
  };

  const resetCatalogForm = () => {
    setCatalogForm({ nombre: '', intervaloMeses: 3, via: 'Oral', activa: true });
    setEditingCatalogId(null);
    setCatalogFormErrors({});
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Desparasitación</h1>
          <p className="text-sm text-muted-foreground mt-1">Historial de desparasitaciones y próximas dosis</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Dialog open={openCatalogDialog} onOpenChange={(open) => { if (!open) resetCatalogForm(); setOpenCatalogDialog(open); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Gestionar Catálogo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Catálogo de Desparasitantes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => { resetCatalogForm(); setOpenCatalogDialog(true); }} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nuevo Producto
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {catalogos.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground">Intervalo: {p.intervaloMeses} mes(es) | Vía: {p.via} | {p.activa ? '✅ Activo' : '❌ Inactivo'}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditCatalog(p)}><Edit2 className="h-4 w-4" /></Button>
                          <AuditedActionDialog
                            title="Eliminar producto"
                            description={`Se eliminará “${p.nombre}” del catálogo de desparasitación.`}
                            entity="CatalogoDesparasitacion"
                            entityId={p.id}
                            confirmLabel="Eliminar"
                            onConfirm={() => handleDeleteCatalog(p.id)}
                          >
                            <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                          </AuditedActionDialog>
                        </div>
                      </div>
                    ))}
                    {catalogos.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No hay productos en el catálogo</p>}
                  </div>

                  {/* Catalog Form */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">{editingCatalogId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <div className="space-y-2">
                      <Label htmlFor="catNombre">Nombre *</Label>
                      <Input
                        id="catNombre"
                        value={catalogForm.nombre}
                        onChange={(e) => handleCatalogFormChange('nombre', e.target.value)}
                        placeholder="Ej: Praziquantel + Febantel"
                      />
                      {catalogFormErrors.nombre && <p className="text-xs text-destructive">{catalogFormErrors.nombre}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="catIntervalo">Intervalo (meses) *</Label>
                        <Input
                          id="catIntervalo"
                          type="number"
                          value={catalogForm.intervaloMeses}
                          onChange={(e) => handleCatalogFormChange('intervaloMeses', parseInt(e.target.value) || 0)}
                          min={1}
                        />
                        {catalogFormErrors.intervaloMeses && <p className="text-xs text-destructive">{catalogFormErrors.intervaloMeses}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="catVia">Vía de Administración</Label>
                        <Select value={catalogForm.via} onValueChange={(v) => handleCatalogFormChange('via', v)}>
                          <SelectTrigger id="catVia">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Oral">Oral</SelectItem>
                            <SelectItem value="Subcutánea">Subcutánea</SelectItem>
                            <SelectItem value="Tópica">Tópica</SelectItem>
                            <SelectItem value="Inyectable">Inyectable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="catActiva"
                        checked={catalogForm.activa}
                        onChange={(e) => handleCatalogFormChange('activa', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="catActiva">Producto activo</Label>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { resetCatalogForm(); setOpenCatalogDialog(false); }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveCatalog}>
                        {editingCatalogId ? 'Guardar Cambios' : 'Guardar Producto'}
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {canCreate && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Desparasitación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Desparasitación</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mascotaId">Mascota *</Label>
                    <Select value={form.mascotaId} onValueChange={(v) => handleFormChange('mascotaId', v)}>
                      <SelectTrigger id="mascotaId">
                        <SelectValue placeholder="Selecciona una mascota" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...mascotas].sort((a, b) => a.nombre.localeCompare(b.nombre)).map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.especie})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.mascotaId && <p className="text-xs text-destructive">{formErrors.mascotaId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productoId">Producto *</Label>
                    <Select value={form.productoId} onValueChange={(v) => handleFormChange('productoId', v)}>
                      <SelectTrigger id="productoId">
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogos.filter(p => p.activa).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre} (cada {p.intervaloMeses} mes(es))</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.productoId && <p className="text-xs text-destructive">{formErrors.productoId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dosis">Dosis *</Label>
                    <Input
                      id="dosis"
                      value={form.dosis}
                      onChange={(e) => handleFormChange('dosis', e.target.value)}
                      placeholder="Ej: 1 tableta/10kg PO"
                    />
                    {formErrors.dosis && <p className="text-xs text-destructive">{formErrors.dosis}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha de Aplicación *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={form.fecha}
                      onChange={(e) => handleFormChange('fecha', e.target.value)}
                    />
                    {formErrors.fecha && <p className="text-xs text-destructive">{formErrors.fecha}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="veterinarioId">Veterinario *</Label>
                    <Select value={form.veterinarioId} onValueChange={(v) => handleFormChange('veterinarioId', v)}>
                      <SelectTrigger id="veterinarioId">
                        <SelectValue placeholder="Selecciona un veterinario" />
                      </SelectTrigger>
                      <SelectContent>
                        {veterinarios.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.nombre} - {v.especialidad}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.veterinarioId && <p className="text-xs text-destructive">{formErrors.veterinarioId}</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Registrando...' : 'Registrar Desparasitación'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Pill className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{desparasitaciones.length}</p>
              <p className="text-xs text-muted-foreground">Total Desparasitaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{vencidasCount}</p>
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{porVencerCount}</p>
              <p className="text-xs text-muted-foreground">Por vencer (90 días)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-500">{alDiaCount}</p>
              <p className="text-xs text-muted-foreground">Al día</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mascota o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las desparasitaciones</SelectItem>
            <SelectItem value="vencidas">Vencidas</SelectItem>
            <SelectItem value="por_vencer">Por vencer (90 días)</SelectItem>
            <SelectItem value="al_dia">Al día</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desparasitaciones Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const mas = getMascota(d.mascotaId);
            const status = getStatusInfo(d.proximaDosis);
            return (
              <Card key={d.id} className="hover:border-primary/40 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Pill className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{mas?.nombre || 'N/A'}</p>
                        <Badge variant={status.variant} className={`text-[10px] ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{d.producto}</p>
                      <p className="text-xs text-muted-foreground truncate">Dosis: {d.dosis}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Aplicada: {formatDate(d.fecha)} · Próxima: {formatDate(d.proximaDosis)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No se encontraron desparasitaciones</p>
            <p className="text-sm text-muted-foreground mt-1">Intenta cambiar los filtros o registra una nueva desparasitación</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
