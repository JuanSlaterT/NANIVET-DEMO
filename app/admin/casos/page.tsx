'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ClipboardList, Search, Plus } from 'lucide-react';
import { CasoRepository, MascotaRepository } from '@/lib/repositories';
import { ESTADOS_CASO, formatDate } from '@/lib/constants';
import type { CasoClinico, Mascota } from '@/lib/models';

export default function CasosPage() {
  const [casos, setCasos] = useState<CasoClinico[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');

  useEffect(() => {
    (async () => {
      const [c, m] = await Promise.all([CasoRepository.getAll(), MascotaRepository.getAll()]);
      setCasos(c.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setMascotas(m);
      setLoading(false);
    })();
  }, []);

  const getMascota = (id: string) => mascotas.find(m => m.id === id);
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
            <Link key={caso.id} href={`/admin/casos/${caso.id}`}>
              <Card className="hover:border-primary/40 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                      <ClipboardList className="h-5 w-5 text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{mas?.nombre || 'N/A'}</p>
                        <Badge className={`text-[10px] ${ESTADOS_CASO[caso.estado].color}`}>{ESTADOS_CASO[caso.estado].label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{caso.motivo}</p>
                      <p className="text-xs text-muted-foreground truncate">{caso.diagnostico}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDate(caso.fecha)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No se encontraron casos</div>}
      </div>
    </div>
  );
}
