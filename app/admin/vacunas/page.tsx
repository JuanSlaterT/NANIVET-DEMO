'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Syringe, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { VacunaRepository, MascotaRepository } from '@/lib/repositories';
import { formatDate } from '@/lib/constants';
import type { Vacuna, Mascota } from '@/lib/models';

export default function VacunasPage() {
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('all');

  useEffect(() => {
    (async () => {
      const [v, m] = await Promise.all([VacunaRepository.getAll(), MascotaRepository.getAll()]);
      setVacunas(v.sort((a, b) => b.proximaDosis.localeCompare(a.proximaDosis)));
      setMascotas(m);
      setLoading(false);
    })();
  }, []);

  const getMascota = (id: string) => mascotas.find(m => m.id === id);
  const hoy = new Date('2026-10-15');

  const diasParaProxima = (fecha: string) => Math.ceil((new Date(fecha).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  const filtered = vacunas.filter(v => {
    const mas = getMascota(v.mascotaId);
    const q = search.toLowerCase();
    const matchSearch = (mas?.nombre || '').toLowerCase().includes(q) || v.nombre.toLowerCase().includes(q);
    const dias = diasParaProxima(v.proximaDosis);
    const matchFiltro = filtro === 'all' || (filtro === 'vencidas' && dias <= 0) || (filtro === 'por_vencer' && dias > 0 && dias <= 30) || (filtro === 'al_dia' && dias > 30);
    return matchSearch && matchFiltro;
  });

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vacunas</h1>
        <p className="text-sm text-muted-foreground mt-1">Control de vacunación y próximas dosis</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por mascota o vacuna..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="vencidas">Vencidas</SelectItem>
            <SelectItem value="por_vencer">Por vencer (30d)</SelectItem>
            <SelectItem value="al_dia">Al día</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((vac) => {
          const mas = getMascota(vac.mascotaId);
          const dias = diasParaProxima(vac.proximaDosis);
          return (
            <Card key={vac.id} className="hover:border-primary/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Syringe className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/mascotas/${vac.mascotaId}`} className="font-medium text-sm hover:text-primary transition-colors">{mas?.nombre || 'N/A'}</Link>
                    <p className="text-xs text-muted-foreground">{vac.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Lote: {vac.lote}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">Aplicada: {formatDate(vac.fechaAplicacion)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                      <span className="text-[10px] text-muted-foreground">Próxima: {formatDate(vac.proximaDosis)}</span>
                      <Badge variant={dias <= 0 ? 'destructive' : dias <= 30 ? 'secondary' : 'outline'} className="text-[10px]">
                        {dias <= 0 ? 'Vencida' : `${dias}d`}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No se encontraron vacunas</div>}
      </div>
    </div>
  );
}
