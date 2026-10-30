'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Star, ThumbsUp, ThumbsDown, ExternalLink, Clock, Users, TrendingUp } from 'lucide-react';
import { PuntuacionRepository, CitaRepository, MascotaRepository, VeterinarioRepository, ClienteRepository } from '@/lib/repositories';
import { ESTADOS_CITA, TIPOS_SERVICIO, formatDate, formatDateTime } from '@/lib/constants';
import type { PuntuacionCita, Cita, Mascota, Veterinario, Cliente } from '@/lib/models';

export default function PuntuacionesPage() {
  const [puntuaciones, setPuntuaciones] = useState<PuntuacionCita[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selected, setSelected] = useState<PuntuacionCita | null>(null);
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'respondida'>('all');

  useEffect(() => {
    (async () => {
      const [p, c, m, v, cli] = await Promise.all([
        PuntuacionRepository.getAll(),
        CitaRepository.getAll(),
        MascotaRepository.getAll(),
        VeterinarioRepository.getAll(),
        ClienteRepository.getAll(),
      ]);
      const s = await PuntuacionRepository.getStats();
      setPuntuaciones(p);
      setCitas(c);
      setMascotas(m);
      setVets(v);
      setClientes(cli);
      setStats(s);
      setLoading(false);
    })();
  }, []);

  const getMascota = (id: string) => mascotas.find(m => m.id === id);
  const getCita = (id: string) => citas.find(c => c.id === id);
  const getVet = (id: string) => vets.find(v => v.id === id);
  const getCliente = (mascotaId: string) => {
    const mas = getMascota(mascotaId);
    return mas ? clientes.find(c => c.id === mas.clienteId) : undefined;
  };

  const filtered = puntuaciones.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'pendiente') return !p.respondida;
    if (filter === 'respondida') return p.respondida;
    return true;
  });

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Puntuaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Calificaciones y recomendaciones de clientes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Promedio</p>
              <p className="text-2xl font-bold">{stats.promedio.toFixed(1)} <span className="text-sm text-muted-foreground">/ 5</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ThumbsUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recomiendan</p>
              <p className="text-2xl font-bold">{stats.recomienda} <span className="text-sm text-muted-foreground">/ {stats.respondidas}</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Respondidas</p>
              <p className="text-2xl font-bold">{stats.respondidas}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold">{stats.pendientes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Star Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Distribución por Estrellas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = stats.porEstrella[stars] || 0;
              const percentage = stats.respondidas > 0 ? (count / stats.respondidas) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{stars}</span>
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">Todas ({puntuaciones.length})</TabsTrigger>
            <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
            <TabsTrigger value="respondida">Respondidas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Veterinario</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead>Recomienda</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((pnt) => {
                  const cita = getCita(pnt.citaId);
                  const mas = getMascota(pnt.mascotaId);
                  const cli = getCliente(pnt.mascotaId);
                  const vet = getVet(pnt.veterinarioId);

                  return (
                    <TableRow key={pnt.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {cita ? formatDate(cita.fechaHora) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">{mas?.nombre || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {cli ? `${cli.nombre} ${cli.apellido}` : 'N/A'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{vet?.nombre || 'N/A'}</TableCell>
                      <TableCell>
                        {cita && (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className={`w-2 h-2 rounded-full ${TIPOS_SERVICIO[cita.tipoServicio]?.color || 'bg-gray-500'}`} />
                            {TIPOS_SERVICIO[cita.tipoServicio]?.label || 'N/A'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pnt.respondida && pnt.calificacion > 0 ? (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= pnt.calificacion ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pnt.respondida ? (
                          pnt.recomienda ? (
                            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 gap-1">
                              <ThumbsUp className="h-3 w-3" /> Sí
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 gap-1">
                              <ThumbsDown className="h-3 w-3" /> No
                            </Badge>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={pnt.respondida ? 'bg-sky-500/20 text-sky-700 dark:text-sky-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'}>
                          {pnt.respondida ? 'Respondida' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {pnt.respondida ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelected(pnt)}
                              className="h-8 px-2"
                            >
                              Ver Detalle
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              disabled
                            >
                              Pendiente
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Puntuación</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const cita = getCita(selected.citaId);
            const mas = getMascota(selected.mascotaId);
            const cli = getCliente(selected.mascotaId);
            const vet = getVet(selected.veterinarioId);

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-8 w-8 ${star <= selected.calificacion ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-accent/20 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mascota:</span>
                    <span className="font-medium">{mas?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dueño:</span>
                    <span className="font-medium">{cli ? `${cli.nombre} ${cli.apellido}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Veterinario:</span>
                    <span className="font-medium">{vet?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha cita:</span>
                    <span className="font-medium">{cita ? formatDateTime(cita.fechaHora) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Respondida:</span>
                    <span className="font-medium">
                      {selected.fechaRespuesta ? formatDate(selected.fechaRespuesta) : 'N/A'}
                    </span>
                  </div>
                </div>

                {selected.recomienda !== null && (
                  <div className="flex items-center justify-center gap-2">
                    {selected.recomienda ? (
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 gap-1 px-3 py-1">
                        <ThumbsUp className="h-4 w-4" /> Sí recomienda
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 gap-1 px-3 py-1">
                        <ThumbsDown className="h-4 w-4" /> No recomienda
                      </Badge>
                    )}
                  </div>
                )}

                {selected.comentario && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm italic text-muted-foreground">"{selected.comentario}"</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
