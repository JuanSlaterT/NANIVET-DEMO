'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ClipboardList, Search, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { CasoRepository, MascotaRepository } from '@/lib/repositories';
import { ESTADOS_CASO, formatDate } from '@/lib/constants';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import type { CasoClinico, Mascota } from '@/lib/models';

export default function CasosPage() {
  const { user } = useAuth();
  const canDelete = user && (user.rol === 'admin' || user.rol === 'veterinario');

  const [casos, setCasos] = useState<CasoClinico[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<CasoClinico | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, m] = await Promise.all([CasoRepository.getAll(), MascotaRepository.getAll()]);
      setCasos(c.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')));
      setMascotas(m);
      setLoading(false);
    })();
  }, []);

  const getMascota = (id: string) => mascotas.find(m => m.id === id);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await CasoRepository.delete(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      setCasos(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast.success('Caso clínico eliminado');
    } else {
      toast.error('No se pudo eliminar el caso');
    }
    setDeleteTarget(null);
  };
  const filtered = casos.filter(c => {
    const mas = getMascota(c.mascotaId);
    const q = search.toLowerCase();
    const matchSearch = (mas?.nombre || '').toLowerCase().includes(q) || c.motivo.toLowerCase().includes(q) || c.diagnostico.toLowerCase().includes(q);
    const matchEstado = filtroEstado === 'all' || c.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Casos Clínicos</h1>
          <p className="text-sm text-muted-foreground mt-1">{casos.length} casos registrados</p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/admin/casos/new"><Plus className="h-4 w-4" /> Nuevo Caso</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por mascota, motivo, diagnóstico..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(ESTADOS_CASO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((caso) => {
          const mas = getMascota(caso.mascotaId);
          return (
            <Card key={caso.id} className="hover:border-primary/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-5 w-5 text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{mas?.nombre || 'N/A'}</p>
                      <Badge className={`text-[10px] ${ESTADOS_CASO[caso.estado].color}`}>{ESTADOS_CASO[caso.estado].label}</Badge>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive/60 hover:text-destructive shrink-0"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(caso); }}
                          title="Eliminar caso"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <Link href={`/admin/casos/${caso.id}`} className="block">
                      <p className="text-xs text-muted-foreground truncate mt-0.5 cursor-pointer hover:text-primary">{caso.motivo}</p>
                      <p className="text-xs text-muted-foreground truncate cursor-pointer hover:text-primary">{caso.diagnostico}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 cursor-pointer hover:text-primary">{formatDate(caso.fecha)}</p>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No se encontraron casos</div>}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar Caso Clínico
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            ¿Estás seguro de eliminar el caso clínico de <strong>{getMascota(deleteTarget?.mascotaId || '')?.nombre}</strong>?
            <br />
            <span className="text-destructive">Esta acción no se puede deshacer.</span>
          </DialogDescription>
          <DialogFooter className="flex sm:justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
