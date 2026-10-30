'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle, PawPrint, Heart, MessageCircle } from 'lucide-react';
import { CitaRepository, PuntuacionRepository, MascotaRepository, VeterinarioRepository, ClienteRepository } from '@/lib/repositories';
import { ESTADOS_CITA, TIPOS_SERVICIO, formatDate, formatDateTime } from '@/lib/constants';
import type { Cita, Mascota, Veterinario, Cliente, PuntuacionCita } from '@/lib/models';

export default function PuntuarPage() {
  const params = useParams();
  const router = useRouter();
  const citaId = params.id as string;

  const [cita, setCita] = useState<Cita | null>(null);
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [veterinario, setVeterinario] = useState<Veterinario | null>(null);
  const [puntuacion, setPuntuacion] = useState<PuntuacionCita | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [calificacion, setCalificacion] = useState(0);
  const [hoverCalificacion, setHoverCalificacion] = useState(0);
  const [recomienda, setRecomienda] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Load cita
        const citaData = CitaRepository.getById(citaId);
        if (!citaData) {
          setError('Cita no encontrada');
          setLoading(false);
          return;
        }

        setCita(citaData);

        // Load related data
        const mascotaData = MascotaRepository.getById(citaData.mascotaId);
        setMascota(mascotaData || null);

        if (mascotaData) {
          const clienteData = ClienteRepository.getById(mascotaData.clienteId);
          setCliente(clienteData || null);
        }

        const vetData = VeterinarioRepository.getById(citaData.veterinarioId);
        setVeterinario(vetData || null);

        // Load or create puntuación
        let pnt = PuntuacionRepository.getByCita(citaId);
        if (!pnt) {
          pnt = await PuntuacionRepository.getByCitaIdOrCreate(citaId);
        }
        setPuntuacion(pnt);

        // If already responded, show the response
        if (pnt.respondida) {
          setCalificacion(pnt.calificacion);
          setRecomienda(pnt.recomienda);
          setComentario(pnt.comentario || '');
        }
      } catch (err) {
        setError('Error al cargar la información');
      }
      setLoading(false);
    })();
  }, [citaId]);

  const handleSubmit = async () => {
    if (calificacion === 0) return;

    setSubmitting(true);
    try {
      // Get the token for this puntuación
      let pnt = PuntuacionRepository.getByCita(citaId);
      if (!pnt) {
        pnt = await PuntuacionRepository.getByCitaIdOrCreate(citaId);
      }

      if (!pnt?.token) {
        setError('Error: token no disponible');
        setSubmitting(false);
        return;
      }

      const response = await PuntuacionRepository.responder(
        pnt.token,
        calificacion,
        recomienda ?? false,
        comentario.trim() || null
      );

      if (response) {
        setPuntuacion(response);
      } else {
        setError('Ya has puntuado esta cita anteriormente');
      }
    } catch (err) {
      setError('Error al enviar la puntuación');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950">
        <div className="animate-pulse text-primary">
          <PawPrint className="h-12 w-12" />
        </div>
      </div>
    );
  }

  if (error && !cita) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950">
        <Card className="bg-card/80 backdrop-blur-xl border-red-500/20 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-red-500">Error</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cita) return null;

  const mas = mascota;
  const cli = cliente;
  const vet = veterinario;

  // Show already responded state
  if (puntuacion?.respondida) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950 px-4">
        <Card className="bg-card/80 backdrop-blur-xl border-teal-500/20 max-w-lg w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">¡Gracias por tu opinión!</h2>
              <p className="text-sm text-muted-foreground">Tu puntuación ha sido registrada exitosamente.</p>
            </div>

            <div className="bg-accent/20 rounded-xl p-6 space-y-4">
              {/* Stars */}
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-8 w-8 ${star <= puntuacion.calificacion ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
                  />
                ))}
              </div>

              {/* Recommend */}
              <div className="flex justify-center gap-2">
                {puntuacion.recomienda ? (
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" /> Sí recomienda
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 gap-1">
                    <ThumbsDown className="h-3.5 w-3.5" /> No recomienda
                  </Badge>
                )}
              </div>

              {/* Comment */}
              {puntuacion.comentario && (
                <p className="text-sm italic text-muted-foreground">"{puntuacion.comentario}"</p>
              )}

              {/* Info */}
              <div className="text-xs text-muted-foreground pt-2 border-t border-border/40 space-y-1">
                <p><span className="font-medium">Mascota:</span> {mas?.nombre}</p>
                <p><span className="font-medium">Servicio:</span> {TIPOS_SERVICIO[cita.tipoServicio]?.label}</p>
                <p><span className="font-medium">Veterinario:</span> {vet?.nombre}</p>
                <p><span className="font-medium">Fecha:</span> {formatDateTime(cita.fechaHora)}</p>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show rating form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950 px-4">
      <Card className="bg-card/80 backdrop-blur-xl border-teal-500/20 max-w-lg w-full">
        <CardHeader className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-teal-400" />
          </div>
          <CardTitle className="text-2xl">Puntuar Atención</CardTitle>
          <CardDescription>
            Tu opinión nos ayuda a mejorar. ¿Cómo fue la experiencia de {mas?.nombre}?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info card */}
          <div className="bg-accent/20 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mascota:</span>
              <span className="font-medium">{mas?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dueño:</span>
              <span className="font-medium">{cli?.nombre} {cli?.apellido}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Servicio:</span>
              <span className="font-medium">{TIPOS_SERVICIO[cita.tipoServicio]?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Veterinario:</span>
              <span className="font-medium">{vet?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">{formatDateTime(cita.fechaHora)}</span>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-center block">
              ¿Cómo calificarías la atención?
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setCalificacion(star)}
                  onMouseEnter={() => setHoverCalificacion(star)}
                  onMouseLeave={() => setHoverCalificacion(0)}
                  className="transition-all hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoverCalificacion || calificacion)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted text-muted'
                    }`}
                  />
                </button>
              ))}
            </div>
            {calificacion > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calificacion]}
              </p>
            )}
          </div>

          {/* Recommend */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-center block">
              ¿Recomendarías NANIVET?
            </label>
            <div className="flex justify-center gap-4">
              <Button
                variant={recomienda === true ? 'default' : 'outline'}
                onClick={() => setRecomienda(true)}
                className={`gap-2 ${recomienda === true ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
              >
                <ThumbsUp className="h-4 w-4" /> Sí, definitely
              </Button>
              <Button
                variant={recomienda === false ? 'default' : 'outline'}
                onClick={() => setRecomienda(false)}
                className={`gap-2 ${recomienda === false ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                <ThumbsDown className="h-4 w-4" /> No
              </Button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comentario (opcional)
            </label>
            <Textarea
              placeholder="Cuéntanos sobre tu experiencia..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comentario.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={calificacion === 0 || submitting}
            className="w-full gap-2"
          >
            {submitting ? 'Enviando...' : 'Enviar Puntuación'}
          </Button>

          {/* Back link */}
          <div className="text-center">
            <Link href="/" className="text-xs text-muted-foreground hover:text-teal-400 transition-colors">
              Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
