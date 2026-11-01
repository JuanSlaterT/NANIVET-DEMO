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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

const casoSchema = z.object({
  mascotaId: z.string().min(1, 'La mascota es obligatoria'),
  veterinarioId: z.string().min(1, 'El veterinario es obligatorio'),
  motivo: z.string().trim().min(1, 'El motivo es obligatorio').max(500),
  diagnostico: z.string().trim().min(1, 'El diagnóstico es obligatorio').max(1000),
  estado: z.enum(['abierto', 'seguimiento', 'cerrado']),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  subjetivo: z.string().max(5000),
  objetivo: z.string().max(5000),
  analisis: z.string().max(5000),
  plan: z.string().max(5000),
});

type CasoFormValues = z.infer<typeof casoSchema>;

export default function NewCasoPage() {
  const router = useRouter();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const { register, control, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm<CasoFormValues>({
    resolver: zodResolver(casoSchema),
    defaultValues: {
      mascotaId: '', veterinarioId: '', motivo: '', diagnostico: '', estado: 'abierto',
      subjetivo: '', objetivo: '', analisis: '', plan: '', fecha: new Date().toISOString().split('T')[0],
    },
  });
  const { requestDiscard, discardDialog } = useUnsavedChanges(isDirty && !isSubmitting);

  useEffect(() => {
    (async () => {
      const [m, v] = await Promise.all([MascotaRepository.getAll(), VeterinarioRepository.getAll()]);
      setMascotas(m);
      setVets(v);
    })();
  }, []);

  const handleSave = async (form: CasoFormValues) => {
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
    <form onSubmit={handleSubmit(handleSave)} className="space-y-6 animate-fade-in max-w-2xl" noValidate>
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => requestDiscard(() => router.push('/admin/casos'))}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Caso Clínico</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mascota <span className="text-destructive">*</span></Label>
              <Controller control={control} name="mascotaId" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{mascotas.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre} - {m.especie}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.mascotaId && <p className="text-xs text-destructive">{errors.mascotaId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Veterinario <span className="text-destructive">*</span></Label>
              <Controller control={control} name="veterinarioId" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{vets.map(v => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.veterinarioId && <p className="text-xs text-destructive">{errors.veterinarioId.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" {...register('fecha')} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Controller control={control} name="estado" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ESTADOS_CASO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Motivo <span className="text-destructive">*</span></Label>
            <Input {...register('motivo')} placeholder="Ej: Chequeo anual" />
            {errors.motivo && <p className="text-xs text-destructive">{errors.motivo.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Diagnóstico <span className="text-destructive">*</span></Label>
            <Input {...register('diagnostico')} />
            {errors.diagnostico && <p className="text-xs text-destructive">{errors.diagnostico.message}</p>}
          </div>
          <div className="pt-2 border-t border-border/30">
            <p className="text-sm font-medium mb-3">Nota SOAP</p>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Subjetivo</Label><Textarea {...register('subjetivo')} rows={2} /></div>
              <div className="space-y-1.5"><Label>Objetivo</Label><Textarea {...register('objetivo')} rows={2} /></div>
              <div className="space-y-1.5"><Label>Análisis</Label><Textarea {...register('analisis')} rows={2} /></div>
              <div className="space-y-1.5"><Label>Plan</Label><Textarea {...register('plan')} rows={2} /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => requestDiscard(() => router.push('/admin/casos'))}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2"><Save className="h-4 w-4" /> {isSubmitting ? 'Creando...' : 'Crear caso'}</Button>
      </div>
      {discardDialog}
    </form>
  );
}
