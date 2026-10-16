'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { EncuestaRepository, MascotaRepository, VeterinarioRepository } from '@/lib/repositories';
import { formatDate, formatDateTime } from '@/lib/constants';
import type { Encuesta, Mascota, Veterinario } from '@/lib/models';

export default function EncuestasPage() {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [promedio, setPromedio] = useState({ promedio: 0, total: 0, recomienda: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [encs, mas, vs, prom] = await Promise.all([
        EncuestaRepository.getAll(),
        MascotaRepository.getAll(),
        VeterinarioRepository.getAll(),
        EncuestaRepository.getPromedio(),
      ]);
      encs.sort((a, b) => (b.fechaRespuesta || '').localeCompare(a.fechaRespuesta || ''));
      setEncuestas(encs);
      setMascotas(mas);
      setVets(vs);
      setPromedio(prom);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  const respondidas = encuestas.filter(e => e.respondida);
  const pendientes = encuestas.filter(e => !e.respondida);
  const getMascota = (id: string) => mascotas.find(m => m.id === id);
  const getVet = (id: string) => vets.find(v => v.id === id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Encuestas de satisfacción</h1>
        <p className="text-sm text-muted-foreground mt-1">Resultados de encuestas post-cita</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground font-medium">Promedio</p>
              <p className="text-2xl font-bold mt-1 flex items-center gap-1">{promedio.promedio.toFixed(1)} <Star className="h-4 w-4 fill-amber-500 text-amber-500" /></p></div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Star className="h-5 w-5 text-amber-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground font-medium">Respondidas</p>
              <p className="text-2xl font-bold mt-1">{promedio.total}</p></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><MessageSquare className="h-5 w-5 text-emerald-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground font-medium">Recomiendan</p>
              <p className="text-2xl font-bold mt-1">{promedio.recomienda}/{promedio.total}</p></div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center"><ThumbsUp className="h-5 w-5 text-teal-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground font-medium">Pendientes</p>
              <p className="text-2xl font-bold mt-1">{pendientes.length}</p></div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center"><MessageSquare className="h-5 w-5 text-sky-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Respondidas */}
      <Card>
        <CardHeader><CardTitle className="text-base">Encuestas respondidas ({respondidas.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {respondidas.map((enc) => {
              const mas = getMascota(enc.mascotaId);
              const v = getVet(enc.veterinarioId);
              return (
                <div key={enc.id} className="p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= enc.calificacion ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{mas?.nombre || 'N/A'}</span>
                        {enc.recomienda && <Badge variant="secondary" className="text-[10px] gap-1"><ThumbsUp className="h-2.5 w-2.5" /> Recomienda</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{v?.nombre} - {enc.fechaRespuesta ? formatDateTime(enc.fechaRespuesta) : 'N/A'}</p>
                      {enc.comentario && <p className="text-xs mt-1 bg-accent/20 rounded p-2 italic">"{enc.comentario}"</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            {respondidas.length === 0 && <p className="text-center text-muted-foreground py-8">Sin encuestas respondidas</p>}
          </div>
        </CardContent>
      </Card>

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pendientes ({pendientes.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {pendientes.map((enc) => {
                const mas = getMascota(enc.mascotaId);
                const v = getVet(enc.veterinarioId);
                return (
                  <div key={enc.id} className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0"><Star className="h-4 w-4 text-muted-foreground/40" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{mas?.nombre || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{v?.nombre}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Pendiente</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
