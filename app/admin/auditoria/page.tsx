'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollText, Search, Filter } from 'lucide-react';
import { AuditRepository } from '@/lib/repositories';
import { formatDateTime } from '@/lib/constants';
import type { AuditLog } from '@/lib/models';

const ACCIONES = ['crear', 'editar', 'eliminar', 'consultar', 'revocar', 'confirmar', 'cancelar', 'reprogramar', 'enviar_campaña', 'alta_hospitalizacion'];
const ENTIDADES = ['Cliente', 'Mascota', 'Cita', 'CasoClinico', 'Vacuna', 'Cirugia', 'Hospitalizacion', 'Campana', 'Veterinario'];

const ACCION_COLORS: Record<string, string> = {
  crear: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  editar: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
  eliminar: 'bg-red-500/20 text-red-700 dark:text-red-400',
  confirmar: 'bg-teal-500/20 text-teal-700 dark:text-teal-400',
  cancelar: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
  reprogramar: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  revocar: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  enviar_campaña: 'bg-pink-500/20 text-pink-700 dark:text-pink-400',
  alta_hospitalizacion: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400',
  consultar: 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400',
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [accionFiltro, setAccionFiltro] = useState('all');
  const [entidadFiltro, setEntidadFiltro] = useState('all');

  useEffect(() => {
    (async () => {
      const data = await AuditRepository.getAll();
      setLogs(data);
      setLoading(false);
    })();
  }, []);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchSearch = !q || log.usuario.toLowerCase().includes(q) || log.entidadId.toLowerCase().includes(q) || log.entidad.toLowerCase().includes(q);
    const matchAccion = accionFiltro === 'all' || log.accion === accionFiltro;
    const matchEntidad = entidadFiltro === 'all' || log.entidad === entidadFiltro;
    return matchSearch && matchAccion && matchEntidad;
  });

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground mt-1">Historial de cambios en el sistema</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por usuario o ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={accionFiltro} onValueChange={setAccionFiltro}>
          <SelectTrigger className="w-full sm:w-48"><Filter className="h-3 w-3 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            {ACCIONES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entidadFiltro} onValueChange={setEntidadFiltro}>
          <SelectTrigger className="w-full sm:w-48"><Filter className="h-3 w-3 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            {ENTIDADES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ScrollText className="h-4 w-4 text-muted-foreground" /> {filtered.length} registros</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
            {filtered.map((log) => (
              <div key={log.id} className="p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ACCION_COLORS[log.accion] || 'bg-zinc-500/20'}`}>
                      <ScrollText className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-[10px] ${ACCION_COLORS[log.accion] || ''}`}>{log.accion}</Badge>
                      <span className="text-sm font-medium">{log.entidad}</span>
                      <span className="text-xs text-muted-foreground font-mono">{log.entidadId}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">{log.usuario}</span> ({log.rol}) - {formatDateTime(log.fechaHora)}
                    </p>
                    {log.diff && log.diff.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {log.diff.map((d, i) => (
                          <div key={i} className="text-xs bg-accent/30 rounded px-2 py-1 font-mono">
                            <span className="text-muted-foreground">{d.campo}:</span>{' '}
                            <span className="line-through text-red-500/70">{d.antes}</span>{' → '}
                            <span className="text-emerald-500">{d.despues}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {log.valoresDespues && Object.keys(log.valoresDespues).length > 0 && (
                      <div className="mt-2 text-xs bg-accent/30 rounded px-2 py-1 font-mono">
                        {Object.entries(log.valoresDespues).map(([k, v]) => (
                          <span key={k} className="mr-3"><span className="text-muted-foreground">{k}:</span> {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No se encontraron registros</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
