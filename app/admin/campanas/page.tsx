'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Megaphone, Syringe, Pill, Users, Cake, Send, MessageCircle, Check } from 'lucide-react';
import { CampanaRepository, ClienteRepository, MascotaRepository } from '@/lib/repositories';
import { SEGMENTOS_CAMPANA, PLANTILLAS_CAMPANA, buildWhatsAppUrl, formatDate, type SegmentoCampana } from '@/lib/constants';
import type { Cliente, Mascota, CampanaEnvio } from '@/lib/models';

const SEGMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vacunas_vencidas: Syringe,
  desparasitacion_pendiente: Pill,
  clientes_inactivos: Users,
  cumpleanos_mascotas: Cake,
};

export default function CampanasPage() {
  const [segmentoActivo, setSegmentoActivo] = useState<SegmentoCampana>('vacunas_vencidas');
  const [destinatarios, setDestinatarios] = useState<{ clienteId: string; mascotaId: string | null; motivo: string }[]>([]);
  const [envios, setEnvios] = useState<CampanaEnvio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [plantilla, setPlantilla] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      const [clis, mass, envs] = await Promise.all([
        ClienteRepository.getAll(),
        MascotaRepository.getAll(),
        CampanaRepository.getAll(),
      ]);
      setClientes(clis);
      setMascotas(mass);
      setEnvios(envs);
      setPlantilla(PLANTILLAS_CAMPANA['vacunas_vencidas']);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setPlantilla(PLANTILLAS_CAMPANA[segmentoActivo]);
    (async () => {
      setCalculando(true);
      const dests = await CampanaRepository.calcularSegmento(segmentoActivo);
      setDestinatarios(dests);
      setCalculando(false);
    })();
  }, [segmentoActivo]);

  const getCliente = (id: string) => clientes.find(c => c.id === id);
  const getMascota = (id: string | null) => id ? mascotas.find(m => m.id === id) : null;

  const renderMensaje = (dest: { clienteId: string; mascotaId: string | null; motivo: string }) => {
    const cli = getCliente(dest.clienteId);
    const mas = getMascota(dest.mascotaId);
    let msg = plantilla;
    msg = msg.replace(/\{\{dueno\}\}/g, cli ? `${cli.nombre} ${cli.apellido}` : '');
    msg = msg.replace(/\{\{mascota\}\}/g, mas?.nombre || '');
    msg = msg.replace(/\{\{fecha\}\}/g, formatDate('2026-10-15'));
    msg = msg.replace(/\{\{motivo\}\}/g, dest.motivo);
    return msg;
  };

  const handleEnviarTodos = async () => {
    setEnviando(true);
    const enviosData = destinatarios.map(d => ({
      clienteId: d.clienteId,
      mascotaId: d.mascotaId,
      motivo: d.motivo,
      fechaEnviado: null,
      enviadoPor: null,
    }));
    const nuevos = await CampanaRepository.enviar(segmentoActivo, enviosData, 'Admin NANIVET');
    setEnvios([...nuevos, ...envios]);
    setEnviando(false);
  };

  const enviosSegmento = envios.filter(e => e.segmento === segmentoActivo);

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campañas</h1>
        <p className="text-sm text-muted-foreground mt-1">Segmentación y envío de mensajes por WhatsApp</p>
      </div>

      {/* Segment selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(SEGMENTOS_CAMPANA) as [SegmentoCampana, { label: string; icon: string }][]).map(([key, seg]) => {
          const Icon = SEGMENT_ICONS[seg.icon] || Megaphone;
          const active = segmentoActivo === key;
          return (
            <button
              key={key}
              onClick={() => setSegmentoActivo(key)}
              className={`text-left p-4 rounded-xl border transition-all ${active ? 'border-primary bg-primary/10' : 'border-border/40 hover:border-primary/30 hover:bg-accent/30'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${active ? 'bg-primary/20' : 'bg-accent/50'}`}>
                <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <p className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>{seg.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plantilla */}
        <Card>
          <CardHeader><CardTitle className="text-base">Plantilla de mensaje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Label className="text-xs text-muted-foreground">Variables disponibles: {'{{dueno}}'}, {'{{mascota}}'}, {'{{fecha}}'}, {'{{motivo}}'}</Label>
            <Textarea value={plantilla} onChange={(e) => setPlantilla(e.target.value)} rows={5} />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{calculando ? 'Calculando...' : `${destinatarios.length} destinatarios`}</p>
              <Button onClick={handleEnviarTodos} disabled={destinatarios.length === 0 || enviando} className="gap-2">
                {enviando ? 'Enviando...' : <><Send className="h-4 w-4" /> Enviar a todos</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Envíos previos */}
        <Card>
          <CardHeader><CardTitle className="text-base">Envíos realizados ({enviosSegmento.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30 max-h-80 overflow-y-auto">
              {enviosSegmento.map((env) => {
                const cli = getCliente(env.clienteId);
                const mas = getMascota(env.mascotaId);
                return (
                  <div key={env.id} className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><Check className="h-4 w-4 text-emerald-500" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cli?.nombre} {cli?.apellido}</p>
                      <p className="text-xs text-muted-foreground truncate">{mas?.nombre || ''} - {env.motivo}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{env.fechaEnviado ? formatDate(env.fechaEnviado) : ''}</span>
                  </div>
                );
              })}
              {enviosSegmento.length === 0 && <p className="text-center text-muted-foreground py-6">Sin envíos para este segmento</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destinatarios preview */}
      <Card>
        <CardHeader><CardTitle className="text-base">Destinatarios ({destinatarios.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
            {destinatarios.map((dest, i) => {
              const cli = getCliente(dest.clienteId);
              const mas = getMascota(dest.mascotaId);
              const msg = renderMensaje(dest);
              if (!cli) return null;
              return (
                <div key={i} className="p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{cli.nombre} {cli.apellido}</p>
                        {mas && <Badge variant="outline" className="text-[10px]">{mas.nombre}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{dest.motivo}</p>
                      <div className="mt-2 bg-accent/30 rounded-lg p-2 text-xs italic text-muted-foreground">"{msg}"</div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 shrink-0">
                      <a href={buildWhatsAppUrl(cli.telefono, msg)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
            {destinatarios.length === 0 && !calculando && (
              <p className="text-center text-muted-foreground py-8">No hay destinatarios para este segmento</p>
            )}
            {calculando && <p className="text-center text-muted-foreground py-8">Calculando destinatarios...</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
