'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Syringe, Search, Plus, Settings2, Trash2, Edit2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { VacunaRepository, MascotaRepository, VeterinarioRepository, CatalogoRepository } from '@/lib/repositories';
import { formatDate } from '@/lib/constants';
import { useAuth } from '@/components/auth-provider';
import type { Vacuna, Mascota, Veterinario, CatalogoVacuna } from '@/lib/models';
import { toast } from 'sonner';

export default function VacunasPage() {
  const { user } = useAuth();
  const canCreate = user && (user.rol === 'admin' || user.rol === 'veterinario');

  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoVacuna[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('all');
  
  // Dialog states
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
  const [openCatalogDialog, setOpenCatalogDialog] = useState(false);

  // Form state
  const [form, setForm] = useState({
    mascotaId: '',
    vacunaId: '',
    lote: '',
    fechaAplicacion: '',
    veterinarioId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Catalog form state
  const [catalogForm, setCatalogForm] = useState<Omit<CatalogoVacuna, 'id'>>({
    nombre: '',
    intervaloDias: 365,
    especie: 'all',
    activa: true,
  });
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [catalogFormErrors, setCatalogFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [v, m, vet, cat] = await Promise.all([
        VacunaRepository.getAll(),
        MascotaRepository.getAll(),
        VeterinarioRepository.getAll(),
        CatalogoRepository.getAllVacunas(),
      ]);
      setVacunas(v.sort((a, b) => b.fechaAplicacion.localeCompare(a.fechaAplicacion)));
      setMascotas(m);
      setVeterinarios(vet);
      setCatalogos(cat);
      setLoading(false);
    })();
  }, []);

  const getMascota = (id: string) => mascotas.find(m => m.id === id);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const calcularProximaDosis = (vacunaId: string, fechaAplicacion: string): string => {
    const vacuna = catalogos.find(v => v.id === vacunaId);
    const dias = vacuna?.intervaloDias || 365;
    const fecha = new Date(fechaAplicacion);
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
  };

  const getVacunaNombre = (vacunaId: string) => catalogos.find(v => v.id === vacunaId)?.nombre || '';

  const getStatusInfo = (fechaProxima: string) => {
    const proxima = new Date(fechaProxima);
    proxima.setHours(0, 0, 0, 0);
    const diffMs = proxima.getTime() - hoy.getTime();
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (dias <= 0) return { label: 'Vencida', variant: 'destructive' as const, icon: XCircle, color: 'text-destructive', dias };
    if (dias <= 30) return { label: `Por vencer (${dias}d)`, variant: 'secondary' as const, icon: AlertTriangle, color: 'text-amber-500', dias };
    return { label: `Al día (${dias}d)`, variant: 'outline' as const, icon: CheckCircle2, color: 'text-emerald-500', dias };
  };

  const filtered = vacunas.filter(v => {
    const mas = getMascota(v.mascotaId);
    const q = search.toLowerCase();
    const matchSearch = (mas?.nombre || '').toLowerCase().includes(q) || v.nombre.toLowerCase().includes(q);
    const status = getStatusInfo(v.proximaDosis);
    const matchFiltro = filtro === 'all' || 
      (filtro === 'vencidas' && status.dias <= 0) || 
      (filtro === 'por_vencer' && status.dias > 0 && status.dias <= 30) || 
      (filtro === 'al_dia' && status.dias > 30);
    return matchSearch && matchFiltro;
  });

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.mascotaId) errors.mascotaId = 'Selecciona una mascota';
    if (!form.vacunaId) errors.vacunaId = 'Selecciona una vacuna';
    if (!form.lote.trim()) errors.lote = 'El lote es obligatorio';
    if (!form.fechaAplicacion) errors.fechaAplicacion = 'La fecha es obligatoria';
    if (!form.veterinarioId) errors.veterinarioId = 'Selecciona un veterinario';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const proximaDosis = calcularProximaDosis(form.vacunaId, form.fechaAplicacion);
      const vacunaNombre = getVacunaNombre(form.vacunaId);
      const nuevaVacuna = await VacunaRepository.create({
        mascotaId: form.mascotaId,
        casoId: null,
        nombre: vacunaNombre,
        lote: form.lote.trim(),
        fechaAplicacion: form.fechaAplicacion,
        proximaDosis,
        veterinarioId: form.veterinarioId,
      });

      setVacunas(prev => [nuevaVacuna, ...prev]);
      setForm({ mascotaId: '', vacunaId: '', lote: '', fechaAplicacion: '', veterinarioId: '' });
      setFormErrors({});
      setOpenRegisterDialog(false);
      toast.success('Vacuna registrada exitosamente');
    } catch (error) {
      console.error('Error al crear vacuna:', error);
      toast.error('Error al registrar la vacuna');
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
    if (catalogForm.intervaloDias < 1) errors.intervaloDias = 'El intervalo debe ser mayor a 0';
    setCatalogFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCatalog = async () => {
    if (!validateCatalogForm()) return;

    try {
      if (editingCatalogId) {
        await CatalogoRepository.updateVacuna(editingCatalogId, catalogForm);
        toast.success('Vacuna actualizada exitosamente');
      } else {
        await CatalogoRepository.createVacuna(catalogForm);
        toast.success('Vacuna creada exitosamente');
      }
      const updated = await CatalogoRepository.getAllVacunas();
      setCatalogos(updated);
      resetCatalogForm();
      setOpenCatalogDialog(false);
    } catch (error) {
      console.error('Error al guardar catálogo:', error);
      toast.error('Error al guardar el catálogo');
    }
  };

  const handleEditCatalog = (vacuna: CatalogoVacuna) => {
    setCatalogForm({
      nombre: vacuna.nombre,
      intervaloDias: vacuna.intervaloDias,
      especie: vacuna.especie,
      activa: vacuna.activa,
    });
    setEditingCatalogId(vacuna.id);
    setOpenCatalogDialog(true);
  };

  const handleDeleteCatalog = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este tipo de vacuna?')) {
      await CatalogoRepository.deleteVacuna(id);
      setCatalogos(prev => prev.filter(v => v.id !== id));
      toast.success('Tipo de vacuna eliminado');
    }
  };

  const resetCatalogForm = () => {
    setCatalogForm({ nombre: '', intervaloDias: 365, especie: 'all', activa: true });
    setEditingCatalogId(null);
    setCatalogFormErrors({});
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const vencidasCount = vacunas.filter(v => getStatusInfo(v.proximaDosis).dias <= 0).length;
  const porVencerCount = vacunas.filter(v => { const d = getStatusInfo(v.proximaDosis).dias; return d > 0 && d <= 30; }).length;
  const alDiaCount = vacunas.filter(v => getStatusInfo(v.proximaDosis).dias > 30).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vacunas</h1>
          <p className="text-sm text-muted-foreground mt-1">Control de vacunación y próximas dosis</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canCreate && (
            <Dialog open={openCatalogDialog} onOpenChange={(open) => { if (!open) resetCatalogForm(); setOpenCatalogDialog(open); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Catálogo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Catálogo de Vacunas</DialogTitle>
                  <DialogDescription>Gestiona los tipos de vacunas disponibles para registrar</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => { resetCatalogForm(); setOpenCatalogDialog(true); }} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nueva Vacuna
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {catalogos.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{v.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            Intervalo: {v.intervaloDias} días • Especie: {v.especie === 'all' ? 'Todas' : v.especie}
                          </p>
                          <Badge variant={v.activa ? 'outline' : 'secondary'} className="text-[10px] mt-1">
                            {v.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditCatalog(v)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteCatalog(v.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {catalogos.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No hay vacunas en el catálogo</p>
                    )}
                  </div>

                  {/* Catalog Form */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">{editingCatalogId ? 'Editar Vacuna' : 'Nueva Vacuna'}</h3>
                    <div className="space-y-2">
                      <Label htmlFor="catNombre">Nombre *</Label>
                      <Input
                        id="catNombre"
                        value={catalogForm.nombre}
                        onChange={(e) => handleCatalogFormChange('nombre', e.target.value)}
                        placeholder="Ej: Antirrábica"
                      />
                      {catalogFormErrors.nombre && <p className="text-xs text-destructive">{catalogFormErrors.nombre}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="catIntervalo">Intervalo (días) *</Label>
                        <Input
                          id="catIntervalo"
                          type="number"
                          value={catalogForm.intervaloDias}
                          onChange={(e) => handleCatalogFormChange('intervaloDias', parseInt(e.target.value) || 0)}
                          min={1}
                        />
                        {catalogFormErrors.intervaloDias && <p className="text-xs text-destructive">{catalogFormErrors.intervaloDias}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="catEspecie">Especie</Label>
                        <Select value={catalogForm.especie} onValueChange={(v) => handleCatalogFormChange('especie', v)}>
                          <SelectTrigger id="catEspecie">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="Perro">Perro</SelectItem>
                            <SelectItem value="Gato">Gato</SelectItem>
                            <SelectItem value="Conejo">Conejo</SelectItem>
                            <SelectItem value="Ave">Ave</SelectItem>
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
                        className="h-4 w-4 rounded"
                      />
                      <Label htmlFor="catActiva">Vacuna activa</Label>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { resetCatalogForm(); setOpenCatalogDialog(false); }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveCatalog}>
                        {editingCatalogId ? 'Guardar Cambios' : 'Guardar Vacuna'}
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {canCreate && (
            <Dialog open={openRegisterDialog} onOpenChange={setOpenRegisterDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Vacuna
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Vacuna</DialogTitle>
                  <DialogDescription>Completa los datos para registrar una aplicación de vacuna</DialogDescription>
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
                    <Label htmlFor="vacunaId">Vacuna *</Label>
                    <Select value={form.vacunaId} onValueChange={(v) => handleFormChange('vacunaId', v)}>
                      <SelectTrigger id="vacunaId">
                        <SelectValue placeholder="Selecciona una vacuna" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogos.filter(v => v.activa).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.nombre} ({v.intervaloDias} días)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.vacunaId && <p className="text-xs text-destructive">{formErrors.vacunaId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lote">Lote *</Label>
                    <Input
                      id="lote"
                      value={form.lote}
                      onChange={(e) => handleFormChange('lote', e.target.value)}
                      placeholder="Ej: AR-2026-001"
                    />
                    {formErrors.lote && <p className="text-xs text-destructive">{formErrors.lote}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaAplicacion">Fecha de Aplicación *</Label>
                    <Input
                      id="fechaAplicacion"
                      type="date"
                      value={form.fechaAplicacion}
                      onChange={(e) => handleFormChange('fechaAplicacion', e.target.value)}
                    />
                    {formErrors.fechaAplicacion && <p className="text-xs text-destructive">{formErrors.fechaAplicacion}</p>}
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

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpenRegisterDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Registrando...' : 'Registrar Vacuna'}
                    </Button>
                  </DialogFooter>
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
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Syringe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{vacunas.length}</p>
              <p className="text-xs text-muted-foreground">Total Vacunas</p>
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
              <p className="text-xs text-muted-foreground">Por vencer</p>
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
            placeholder="Buscar por mascota o vacuna..." 
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
            <SelectItem value="all">Todas las vacunas</SelectItem>
            <SelectItem value="vencidas">Vencidas</SelectItem>
            <SelectItem value="por_vencer">Por vencer (30 días)</SelectItem>
            <SelectItem value="al_dia">Al día</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vaccines Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vac) => {
            const mas = getMascota(vac.mascotaId);
            const status = getStatusInfo(vac.proximaDosis);
            const Vet = veterinarios.find(v => v.id === vac.veterinarioId);
            
            return (
              <Card key={vac.id} className="hover:border-primary/40 transition-all hover:shadow-md">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Syringe className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <Link href={`/admin/mascotas/${vac.mascotaId}`} className="font-semibold text-base hover:text-primary transition-colors">
                          {mas?.nombre || 'N/A'}
                        </Link>
                        <p className="text-xs text-muted-foreground">{mas?.especie} • {vac.nombre}</p>
                      </div>
                    </div>
                    <Badge variant={status.variant} className="gap-1">
                      <status.icon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lote:</span>
                      <span className="font-medium">{vac.lote}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Aplicada:</span>
                      <span className="font-medium">{formatDate(vac.fechaAplicacion)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Próxima:</span>
                      <span className={`font-medium ${status.color}`}>{formatDate(vac.proximaDosis)}</span>
                    </div>
                    {Vet && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Veterinario:</span>
                        <span className="font-medium text-xs">{Vet.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Syringe className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No se encontraron vacunas</p>
            <p className="text-sm text-muted-foreground mt-1">Intenta cambiar los filtros o registra una nueva vacuna</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
