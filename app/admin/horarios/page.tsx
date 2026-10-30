'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, Ban, Plus, Trash2, Settings } from 'lucide-react';
import { VeterinarioRepository } from '@/lib/repositories';
import { formatDate } from '@/lib/constants';
import type { Veterinario, HorarioBloqueado } from '@/lib/models';

const DIAS_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function HorariosPage() {
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [bloqueos, setBloqueos] = useState<HorarioBloqueado[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVet, setSelectedVet] = useState<string>('');
  const [blockForm, setBlockForm] = useState({ fecha: '2026-10-16', motivo: '' });

  const loadData = async () => {
    const v = await VeterinarioRepository.getAll();
    setVets(v);

    // Fetch bloqueos for each veterinarian
    const allBloqueos: HorarioBloqueado[] = [];
    for (const vet of v) {
      const bloqueos = await VeterinarioRepository.getBloqueos(vet.id);
      allBloqueos.push(...bloqueos);
    }
    setBloqueos(allBloqueos);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const addBloqueo = async () => {
    if (!selectedVet || !blockForm.fecha || !blockForm.motivo.trim()) return;
    await VeterinarioRepository.addBloqueo(selectedVet, blockForm.fecha, blockForm.motivo.trim());
    setDialogOpen(false);
    setBlockForm({ fecha: '2026-10-16', motivo: '' });
    await loadData();
  };

  const removeBloqueo = async (id: string) => {
    await VeterinarioRepository.removeBloqueo(id);
    await loadData();
  };

  const getVet = (id: string) => vets.find(v => v.id === id);

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Horarios</h1>
          <p className="text-sm text-muted-foreground mt-1">Horarios de atención y bloqueos por veterinario</p>
        </div>
      </div>

      {/* Veterinarian schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vets.map((vet) => (
          <Card key={vet.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{vet.nombre}</CardTitle>
              <Badge variant="outline" className="text-xs">{vet.especialidad}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>{vet.horario_inicio?.substring(0, 5) || '08:00'} - {vet.horario_fin?.substring(0, 5) || '17:00'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(vet.dias_semana || []).map((d: number) => (
                  <span key={d} className="text-[10px] px-2 py-1 rounded-md bg-accent/40 font-medium">{DIAS_NOMBRES[d].slice(0, 3)}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Intervalo por cita: {vet.intervalo_minutos || 30} min</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blocked dates */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><Ban className="h-4 w-4" /> Fechas bloqueadas</CardTitle>
          <Button size="sm" className="gap-1" onClick={() => { setBlockForm({ fecha: '2026-10-16', motivo: '' }); setDialogOpen(true); }}>
            <Plus className="h-3 w-3" /> Bloquear fecha
          </Button>
        </CardHeader>
        <CardContent>
          {bloqueos.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No hay fechas bloqueadas</p>
          ) : (
            <div className="space-y-2">
              {bloqueos.map((b) => {
                const vet = getVet(b.veterinarioId);
                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40">
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><Ban className="h-4 w-4 text-red-500" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{vet?.nombre || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(b.fecha)} - {b.motivo}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBloqueo(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bloquear fecha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Veterinario</Label>
              <Select value={selectedVet} onValueChange={setSelectedVet}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {vets.map(v => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={blockForm.fecha} onChange={(e) => setBlockForm({ ...blockForm, fecha: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input value={blockForm.motivo} onChange={(e) => setBlockForm({ ...blockForm, motivo: e.target.value })} placeholder="Ej: Capacitación, permiso..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={addBloqueo}>Bloquear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
