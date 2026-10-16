'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PawPrint, Star, CheckCircle2, ArrowLeft } from 'lucide-react';
import { EncuestaRepository, MascotaRepository, VeterinarioRepository } from '@/lib/repositories';
import { formatDate } from '@/lib/constants';
import type { Encuesta, Mascota, Veterinario } from '@/lib/models';

export default function EncuestaPage() {
  const params = useParams();
  const token = params.token as string;

  const [encuesta, setEncuesta] = useState<Encuesta | null>(null);
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [vet, setVet] = useState<Veterinario | null>(null);
  const [loading, setLoading] = useState(true);
  const [calificacion, setCalificacion] = useState(0);
  const [recomienda, setRecomienda] = useState(false);
  const [comentario, setComentario] = useState('');
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const enc = EncuestaRepository.getByToken(token);
      if (!enc) { setLoading(false); return; }
      setEncuesta(enc);
      const mas = MascotaRepository.getById(enc.mascotaId);
      setMascota(mas || null);
      const v = VeterinarioRepository.getById(enc.veterinarioId);
      setVet(v || null);
      if (enc.respondida) setDone(true);
      setLoading(false);
    })();
  }, [token]);

  const submit = async () => {
    if (calificacion === 0) return;
    setSubmitting(true);
    const result = await EncuestaRepository.responder(token, calificacion, recomienda, comentario || null);
    setSubmitting(false);
    if (result) setDone(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <div className="h-12 w-12 bg-primary/20 rounded-xl animate-pulse mx-auto" />
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!encuesta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <h1 className="text-xl font-bold">Encuesta no encontrada</h1>
            <p className="text-sm text-muted-foreground">El enlace no corresponde a una encuesta válida.</p>
            <Link href="/agendar"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Volver</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold">¡Gracias por su respuesta!</h1>
            <p className="text-sm text-muted-foreground">Su opinión nos ayuda a mejorar nuestro servicio.</p>
            <div className="flex items-center justify-center gap-1 pt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-6 w-6 ${s <= encuesta.calificacion ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <PawPrint className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">NANIVET</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Clínica Veterinaria</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Encuesta de satisfacción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-accent/30 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Mascota:</span> {mascota?.nombre}</p>
              <p><span className="text-muted-foreground">Veterinario:</span> {vet?.nombre}</p>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <Label>¿Cómo califica su experiencia?</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCalificacion(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`h-8 w-8 ${star <= (hover || calificacion) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium">
                  {calificacion === 5 ? 'Excelente' : calificacion === 4 ? 'Muy bueno' : calificacion === 3 ? 'Regular' : calificacion === 2 ? 'Malo' : calificacion === 1 ? 'Muy malo' : ''}
                </span>
              </div>
            </div>

            {/* Recomendación */}
            <div className="space-y-3">
              <Label>¿Recomendaría nuestros servicios?</Label>
              <div className="flex items-center gap-3">
                <Checkbox id="recomienda" checked={recomienda} onCheckedChange={(v) => setRecomienda(v === true)} />
                <label htmlFor="recomienda" className="text-sm cursor-pointer">Sí, recomendaría NANIVET</label>
              </div>
            </div>

            {/* Comentario */}
            <div className="space-y-2">
              <Label>Comentarios adicionales (opcional)</Label>
              <Textarea placeholder="Cuéntenos sobre su experiencia..." value={comentario} onChange={(e) => setComentario(e.target.value)} rows={4} />
            </div>

            <Button className="w-full" onClick={submit} disabled={calificacion === 0 || submitting}>
              {submitting ? 'Enviando...' : 'Enviar encuesta'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
