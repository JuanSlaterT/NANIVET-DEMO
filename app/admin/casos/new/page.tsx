'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { CasoRepository, MascotaRepository, VeterinarioRepository } from '@/lib/repositories';
import { ESTADOS_CASO } from '@/lib/constants';
import type { Mascota, Veterinario } from '@/lib/models';

export default function NewCasoPage() {
  const router = useRouter();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [form, setForm] = useState({
    mascotaId: '', veterinarioId: '', motivo: '', diagnostico: '', estado: 'abierto',
    subjetivo: '', objetivo: '', analisis: '', plan: '', fecha: '2026-10-15',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [m, v] = await Promise.all([MascotaRepository.getAll(), VeterinarioRepository.getAll()]);
      setMascotas(m);
      setVets(v);
    })();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.mascotaId) e.mascotaId = 'La mascota es obligatoria';
    if (!form.veterinarioId) e.veterinarioId = 'El veterinario es obligatorio';
    if (!form.motivo.trim()) e.motivo = 'El motivo es obligatorio';
    if (!form.diagnostico.trim()) e.diagnostico = 'El diagnóstico es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const nuevo = await CasoRepository.create({
      mascotaId: form.mascotaId, veterinarioId: form.veterinarioId,
      motivo: form.motivo.trim(), diagnostico: form.diagnostico.trim(),
      estado: form.estado as keyof typeof ESTADOS_CASO,
      fecha: `${form.fecha}T09:00:00`,
      soap: { subjetivo: form.subjetivo, objetivo: form.objetivo, analisis: form.analisis, plan: form.plan },
    });
    router.push(`/admin/casos/${nuevo.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/casos')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Caso Clínico</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mascota <span className="text-destructive">*</span></Label>
              <Select value={form.mascotaId} onValueChange={(v) => setForm({ ...form, mascotaId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {mascotas.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre} - {m.especie}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.mascotaId && <p className="text-xs text-destructive">{errors.mascotaId}</p>}
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_CASO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Motivo <span className="text-destructive">*</span></Label>
            <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Chequeo anual" />
            {errors.motivo && <p className="text-xs text-destructive">{errors.motivo}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Diagnóstico <span className="text-destructive">*</span></Label>
            <Input value={form.diagnostico} onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} />
            {errors.diagnostico && <p className="text-xs text-destructive">{errors.diagnostico}</p>}
          </div>
          <div className="pt-2 border-t border-border/30">
            <p className="text-sm font-medium mb-3">Nota SOAP</p>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Subjetivo</Label><Textarea value={form.subjetivo} onChange={(e) => setForm({ ...form, subjetivo: e.target.value })} rows={2} /></div>
              <div className="space-y-1.5"><Label>Objetivo</Label><Textarea value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} rows={2} /></div>
              <div className="space-y-1.5"><Label>Análisis</Label><Textarea value={form.analisis} onChange={(e) => setForm({ ...form, analisis: e.target.value })} rows={2} /></div>
              <div className="space-y-1.5"><Label>Plan</Label><Textarea value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} rows={2} /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/casos')}>Cancelar</Button>
        <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Crear caso</Button>
      </div>
    </div>
  );
}
