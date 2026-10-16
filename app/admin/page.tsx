'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Syringe, ClipboardList, PawPrint, Users, TrendingUp, AlertTriangle, ArrowRight, HeartPulse, Star } from 'lucide-react';
import { CitaRepository, VacunaRepository, CasoRepository, MascotaRepository, ClienteRepository, VeterinarioRepository, HospitalizacionRepository, EncuestaRepository } from '@/lib/repositories';
import { ESTADOS_CITA, ESTADOS_CASO, TIPOS_SERVICIO, formatDate, formatTime } from '@/lib/constants';
import type { Cita, Vacuna, CasoClinico, Mascota, Cliente, Veterinario } from '@/lib/models';

export default function DashboardPage() {
  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);
  const [vacunasVencer, setVacunasVencer] = useState<Vacuna[]>([]);
  const [casosAbiertos, setCasosAbiertos] = useState<CasoClinico[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [hospitalizados, setHospitalizados] = useState(0);
  const [encuestaProm, setEncuestaProm] = useState({ promedio: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const hoy = '2026-10-15';
      const [citas, vacunas, casos, mas, cli, veterinarios, hosps, encs] = await Promise.all([
        CitaRepository.getByFecha(hoy),
        VacunaRepository.getPorVencer(60),
        CasoRepository.getAll(),
        MascotaRepository.getAll(),
        ClienteRepository.getAll(),
        VeterinarioRepository.getAll(),
        HospitalizacionRepository.getActivas(),
        EncuestaRepository.getPromedio(),
      ]);
      setCitasHoy(citas.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)));
      setVacunasVencer(vacunas);
      setCasosAbiertos(casos.filter((c) => c.estado !== 'cerrado'));
      setMascotas(mas);
      setClientes(cli);
      setVets(veterinarios);
      setHospitalizados(hosps.length);
      setEncuestaProm({ promedio: encs.promedio, total: encs.total });
      setLoading(false);
    })();
  }, []);

  const getMascota = (id: string) => mascotas.find((m) => m.id === id);
  const getCliente = (mascotaId: string) => {
    const mas = getMascota(mascotaId);
    return mas ? clientes.find((c) => c.id === mas.clienteId) : undefined;
  };
  const getVet = (id: string) => vets.find((v) => v.id === id);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Citas de hoy', value: citasHoy.length, icon: Clock, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Hospitalizados', value: hospitalizados, icon: HeartPulse, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Casos abiertos', value: casosAbiertos.length, icon: ClipboardList, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { label: 'Satisfacción', value: encuestaProm.total > 0 ? `${encuestaProm.promedio.toFixed(1)}★` : 'N/A', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen general - {formatDate('2026-10-15')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl lg:text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Citas de hoy */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Citas de hoy</CardTitle>
            <Link href="/admin/citas">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {citasHoy.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay citas programadas para hoy</p>
            )}
            {citasHoy.map((cita) => {
              const mas = getMascota(cita.mascotaId);
              const cli = getCliente(cita.mascotaId);
              const vet = getVet(cita.veterinarioId);
              const servicio = TIPOS_SERVICIO[cita.tipoServicio];
              return (
                <Link
                  key={cita.id}
                  href="/admin/citas"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border/40"
                >
                  <div className={`w-2 h-10 rounded-full ${servicio.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{mas?.nombre || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">- {cli?.nombre} {cli?.apellido}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{cita.motivo} - {vet?.nombre}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-mono font-medium">{formatTime(cita.fechaHora)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ESTADOS_CITA[cita.estado].color}`}>
                      {ESTADOS_CITA[cita.estado].label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Vacunas por vencer */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Vacunas por vencer (60 días)</CardTitle>
            <Link href="/admin/vacunas">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {vacunasVencer.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay vacunas por vencer pronto</p>
            )}
            {vacunasVencer.slice(0, 6).map((vac) => {
              const mas = getMascota(vac.mascotaId);
              const dias = Math.ceil((new Date(vac.proximaDosis).getTime() - new Date('2026-10-15').getTime()) / (1000 * 60 * 60 * 24));
              return (
                <Link
                  key={vac.id}
                  href={`/admin/mascotas/${vac.mascotaId}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border/40"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Syringe className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{vac.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{mas?.nombre} - {formatDate(vac.proximaDosis)}</p>
                  </div>
                  <Badge variant={dias <= 7 ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                    {dias <= 0 ? 'Vencida' : `${dias}d`}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Casos abiertos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Casos abiertos / en seguimiento</CardTitle>
          <Link href="/admin/casos">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {casosAbiertos.map((caso) => {
              const mas = getMascota(caso.mascotaId);
              return (
                <Link
                  key={caso.id}
                  href={`/admin/casos/${caso.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border/40"
                >
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-4 w-4 text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{mas?.nombre}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ESTADOS_CASO[caso.estado].color}`}>
                        {ESTADOS_CASO[caso.estado].label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{caso.diagnostico}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
