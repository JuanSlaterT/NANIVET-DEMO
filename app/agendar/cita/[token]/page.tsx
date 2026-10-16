'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PawPrint, Calendar, Clock, Stethoscope, CheckCircle2, XCircle, CalendarClock, ArrowLeft, AlertTriangle } from 'lucide-react';
import { CitaRepository, MascotaRepository, ClienteRepository, VeterinarioRepository } from '@/lib/repositories';
import { ESTADOS_CITA, TIPOS_SERVICIO, formatDate, formatTime, LIMITE_HORAS_CANCELAR } from '@/lib/constants';
import type { Cita, Mascota, Cliente, Veterinario } from '@/lib/models';

type ViewState = 'loading' | 'found' | 'notfound' | 'confirmed' | 'cancelled' | 'rescheduled' | 'error';

export default function PublicCitaPage() {
  const params = useParams();
  const token = params.token as string;

  const [cita, setCita] = useState<Cita | null>(null);
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vet, setVet] = useState<Veterinario | null>(null);
  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [motivoCancel, setMotivoCancel] = useState('');
  const [action, setAction] = useState<'confirm' | 'cancel' | 'reschedule' | null>(null);

  useEffect(() => {
    (async () => {
      const c = CitaRepository.getByToken(token);
      if (!c) { setView('notfound'); return; }
      setCita(c);
      const mas = MascotaRepository.getById(c.mascotaId);
      setMascota(mas || null);
      if (mas) {
        const cli = ClienteRepository.getById(mas.clienteId);
        setCliente(cli || null);
      }
      const v = VeterinarioRepository.getById(c.veterinarioId);
      setVet(v || null);
      const dt = new Date(c.fechaHora);
      setNuevaFecha(dt.toISOString().split('T')[0]);
      setNuevaHora(`${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`);
      setView('found');
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!cita) return;
    setAction('confirm');
    const result = await CitaRepository.confirmarPorToken(token);
    setAction(null);
    if (result) { setCita(result); setView('confirmed'); }
    else { setErrorMsg('No se pudo confirmar la cita'); setView('error'); }
  };

  const handleCancel = async () => {
    if (!cita) return;
    setAction('cancel');
    const result = await CitaRepository.cancelarPorToken(token, motivoCancel || 'Cancelado por el cliente');
    setAction(null);
    if (result.ok) { setCita(result.cita); setView('cancelled'); }
    else { setErrorMsg(result.error || 'Error al cancelar'); setView('error'); }
  };

  const handleReschedule = async () => {
    if (!cita || !nuevaFecha || !nuevaHora) return;
    setAction('reschedule');
    const nuevaFechaHora = `${nuevaFecha}T${nuevaHora}:00`;
    const result = await CitaRepository.reprogramarPorToken(token, nuevaFechaHora);
    setAction(null);
    if (result.ok) { setCita(result.cita); setView('rescheduled'); }
    else { setErrorMsg(result.error || 'Error al reprogramar'); setView('error'); }
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <div className="h-12 w-12 bg-primary/20 rounded-xl animate-pulse mx-auto" />
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (view === 'notfound') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold">Enlace no válido</h1>
            <p className="text-sm text-muted-foreground">El enlace que intentó acceder no corresponde a ninguna cita. Verifique que el enlace sea correcto.</p>
            <Link href="/agendar"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Ir a agendamiento</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'confirmed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold">Cita confirmada</h1>
            <p className="text-sm text-muted-foreground">Su cita ha sido confirmada exitosamente. Le esperamos.</p>
            <div className="bg-accent/30 rounded-lg p-4 text-left space-y-1">
              <p className="text-sm font-medium">{mascota?.nombre} - {cita?.motivo}</p>
              <p className="text-xs text-muted-foreground">{formatDate(cita!.fechaHora)} a las {formatTime(cita!.fechaHora)}</p>
              <p className="text-xs text-muted-foreground">Veterinario: {vet?.nombre}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold">Cita cancelada</h1>
            <p className="text-sm text-muted-foreground">Su cita ha sido cancelada. Si desea agendar una nueva, puede hacerlo a través de nuestra página.</p>
            <Link href="/agendar"><Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Agendar nueva cita</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'rescheduled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <CalendarClock className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold">Cita reprogramada</h1>
            <p className="text-sm text-muted-foreground">Su cita ha sido reprogramada exitosamente.</p>
            <div className="bg-accent/30 rounded-lg p-4 text-left space-y-1">
              <p className="text-sm font-medium">{mascota?.nombre} - {cita?.motivo}</p>
              <p className="text-xs text-muted-foreground">Nueva fecha: {formatDate(cita!.fechaHora)} a las {formatTime(cita!.fechaHora)}</p>
              <p className="text-xs text-muted-foreground">Veterinario: {vet?.nombre}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-xl font-bold">No se pudo completar</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Button variant="outline" onClick={() => { setView('found'); setErrorMsg(''); }}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // view === 'found'
  const canModify = cita && (cita.estado === 'pendiente' || cita.estado === 'confirmada');
  const horasDiff = cita ? (new Date(cita.fechaHora).getTime() - new Date('2026-10-15').getTime()) / (1000 * 60 * 60) : 0;
  const withinLimit = horasDiff >= LIMITE_HORAS_CANCELAR;
  const servicio = cita ? TIPOS_SERVICIO[cita.tipoServicio] : null;

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
            <CardTitle className="text-base">Gestión de su cita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cita details */}
            <div className="bg-accent/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{mascota?.nombre}</span>
                <span className="text-xs text-muted-foreground">- {mascota?.especie} {mascota?.raza || ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span>{cita?.motivo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(cita!.fechaHora)}</span>
                <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                <span>{formatTime(cita!.fechaHora)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground">Veterinario:</span>
                <span className="text-sm">{vet?.nombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tipo de servicio:</span>
                <Badge variant="secondary" className="text-[10px]">{servicio?.label}</Badge>
                <Badge className={`text-[10px] ${ESTADOS_CITA[cita!.estado].color}`}>{ESTADOS_CITA[cita!.estado].label}</Badge>
              </div>
            </div>

            {/* Actions */}
            {canModify ? (
              <>
                {cita!.estado === 'pendiente' && (
                  <Button className="w-full gap-2" onClick={handleConfirm} disabled={action !== null}>
                    <CheckCircle2 className="h-4 w-4" /> Confirmar cita
                  </Button>
                )}

                {withinLimit ? (
                  <>
                    {/* Reschedule */}
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <Label className="text-sm">Reprogramar cita</Label>
                      <div className="flex gap-2">
                        <Input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} className="flex-1" />
                        <Input type="time" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)} className="w-32" />
                      </div>
                      <Button variant="outline" className="w-full gap-2" onClick={handleReschedule} disabled={action !== null || !nuevaFecha || !nuevaHora}>
                        <CalendarClock className="h-4 w-4" /> Reprogramar
                      </Button>
                    </div>

                    {/* Cancel */}
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <Label className="text-sm">Cancelar cita</Label>
                      <Textarea placeholder="Motivo de cancelación (opcional)" value={motivoCancel} onChange={(e) => setMotivoCancel(e.target.value)} rows={2} />
                      <Button variant="destructive" className="w-full gap-2" onClick={handleCancel} disabled={action !== null}>
                        <XCircle className="h-4 w-4" /> Cancelar cita
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      La cita es en menos de {LIMITE_HORAS_CANCELAR} horas, por lo que no se puede cancelar ni reprogramar en línea. Contáctenos directamente.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  Esta cita {cita!.estado === 'cancelada' ? 'ya fue cancelada' : cita!.estado === 'atendida' ? 'ya fue atendida' : 'no se puede modificar'}. 
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center pt-2">
              <Link href="/agendar" className="text-xs text-muted-foreground hover:text-primary">Agendar una nueva cita</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
