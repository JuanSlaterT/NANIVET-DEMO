'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Check, Calendar, Clock, User, Stethoscope, ChevronRight, ChevronLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { VeterinarioRepository, CitaRepository, MascotaRepository, ClienteRepository } from '@/lib/repositories';
import { TIPOS_SERVICIO, formatDate, formatTime } from '@/lib/constants';
import { VERSION_AVISO_PRIVACIDAD } from '@/lib/models';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Veterinario } from '@/lib/models';

const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AgendarPage() {
  const [step, setStep] = useState(1);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    servicio: '', veterinarioId: '', fecha: '', hora: '',
    // cliente
    nombre: '', apellido: '', telefono: '', cedula: '', email: '', direccion: '',
    // mascota
    mascotaNombre: '', especie: 'Perro', sexo: 'Macho', raza: '',
    // consent
    consentDatos: false, consentComunicaciones: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    VeterinarioRepository.getAll().then(v => { setVets(v); setLoading(false); });
  }, []);

  // Generate available slots when vet + date changes
  useEffect(() => {
    if (!form.veterinarioId || !form.fecha) { setAvailableSlots([]); return; }
    (async () => {
      const vet = vets.find(v => v.id === form.veterinarioId);
      if (!vet) { setAvailableSlots([]); return; }
      const ocupados = await CitaRepository.getSlotsOcupados(form.veterinarioId, form.fecha);
      const inicio = parseInt(vet.horario.inicio.split(':')[0]);
      const fin = parseInt(vet.horario.fin.split(':')[0]);
      const intervalo = vet.horario.intervalo;
      const slots: string[] = [];
      for (let h = inicio; h < fin; h++) {
        for (let m = 0; m < 60; m += intervalo) {
          const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          if (!ocupados.includes(slot)) slots.push(slot);
        }
      }
      // Check if date is in vet's working days
      const dia = new Date(form.fecha + 'T00:00:00').getDay();
      if (!vet.horario.dias.includes(dia)) { setAvailableSlots([]); return; }
      setAvailableSlots(slots);
    })();
  }, [form.veterinarioId, form.fecha, vets]);

  // Generate next 14 days for date picker
  const fechasDisponibles = Array.from({ length: 14 }, (_, i) => {
    const d = new Date('2026-10-15');
    d.setDate(d.getDate() + i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: formatDate(d),
      diaSemana: DIAS_NOMBRES[d.getDay()],
      day: d.getDate(),
    };
  });

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1 && !form.servicio) e.servicio = 'Selecciona un servicio';
    if (s === 2) {
      if (!form.veterinarioId) e.veterinarioId = 'Selecciona un veterinario';
      if (!form.fecha) e.fecha = 'Selecciona una fecha';
      if (!form.hora) e.hora = 'Selecciona una hora';
    }
    if (s === 3) {
      if (!form.nombre.trim()) e.nombre = 'Nombre obligatorio';
      if (!form.apellido.trim()) e.apellido = 'Apellido obligatorio';
      if (!form.telefono.trim()) e.telefono = 'Teléfono obligatorio';
      if (!form.cedula.trim()) e.cedula = 'Cédula obligatoria';
      if (!form.mascotaNombre.trim()) e.mascotaNombre = 'Nombre de mascota obligatorio';
      if (!form.consentDatos) e.consentDatos = 'Debe aceptar el aviso de privacidad';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(step + 1); };
  const back = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    // Create or find cliente
    let cliente = await ClienteRepository.create({
      nombre: form.nombre.trim(), apellido: form.apellido.trim(),
      telefono: form.telefono.trim(), cedula: form.cedula.trim(),
      email: form.email.trim() || null, direccion: form.direccion.trim() || null,
      consentimientoDatos: { aceptado: form.consentDatos, fechaHora: new Date().toISOString(), versionAviso: VERSION_AVISO_PRIVACIDAD },
      consentimientoComunicaciones: { aceptado: form.consentComunicaciones, fechaHora: form.consentComunicaciones ? new Date().toISOString() : null },
      fechaRevocacion: null,
    });
    // Create mascota
    let mascota = await MascotaRepository.create({
      clienteId: cliente.id, nombre: form.mascotaNombre.trim(),
      especie: form.especie, sexo: form.sexo, fechaNacimiento: '2023-01-01',
      raza: form.raza.trim() || null,
    });
    // Create cita
    await CitaRepository.create({
      mascotaId: mascota.id, veterinarioId: form.veterinarioId,
      tipoServicio: form.servicio as keyof typeof TIPOS_SERVICIO,
      fechaHora: `${form.fecha}T${form.hora}:00`,
      estado: 'pendiente', motivo: TIPOS_SERVICIO[form.servicio as keyof typeof TIPOS_SERVICIO].label,
      notas: 'Cita agendada desde la página pública',
    });
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950">
        <div className="animate-pulse text-primary"><PawPrint className="h-12 w-12" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">NANIVET</h1>
              <p className="text-[10px] text-teal-300/60 leading-tight">Clínica Veterinaria</p>
            </div>
          </div>
          <a href="/" className="text-xs text-teal-300/60 hover:text-teal-300 transition-colors">Volver al inicio</a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {submitted ? (
          <Card className="bg-card/80 backdrop-blur-xl border-teal-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">¡Cita solicitada con éxito!</h2>
              <p className="text-sm text-muted-foreground mb-1">Tu cita ha sido registrada como pendiente.</p>
              <p className="text-sm text-muted-foreground mb-4">Nos pondremos en contacto por WhatsApp para confirmarla.</p>
              <div className="bg-accent/20 rounded-lg p-4 text-left space-y-1 text-sm">
                <p><span className="text-muted-foreground">Servicio:</span> {TIPOS_SERVICIO[form.servicio as keyof typeof TIPOS_SERVICIO]?.label}</p>
                <p><span className="text-muted-foreground">Fecha:</span> {formatDate(form.fecha)} a las {form.hora}</p>
                <p><span className="text-muted-foreground">Mascota:</span> {form.mascotaNombre}</p>
              </div>
              <Button asChild className="mt-6 w-full">
                <a href="/">Volver al inicio</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/40'}`}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && <div className={`h-0.5 flex-1 mx-2 transition-colors ${step > s ? 'bg-teal-500' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Servicio */}
            {step === 1 && (
              <Card className="bg-card/80 backdrop-blur-xl border-teal-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" /> Selecciona el servicio</CardTitle>
                  <CardDescription>¿Qué necesita tu mascota?</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {Object.entries(TIPOS_SERVICIO).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setForm({ ...form, servicio: k })}
                      className={`p-4 rounded-xl border text-left transition-all ${form.servicio === k ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${v.color} mb-2`} />
                      <p className="text-sm font-medium">{v.label}</p>
                    </button>
                  ))}
                </CardContent>
                <div className="p-6 pt-0 flex justify-end">
                  <Button onClick={next} disabled={!form.servicio} className="gap-2">Siguiente <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </Card>
            )}

            {/* Step 2: Vet + fecha + hora */}
            {step === 2 && (
              <Card className="bg-card/80 backdrop-blur-xl border-teal-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Fecha y hora</CardTitle>
                  <CardDescription>Elige veterinario, día y horario disponible</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Veterinario</Label>
                    <Select value={form.veterinarioId} onValueChange={(v) => setForm({ ...form, veterinarioId: v, hora: '' })}>
                      <SelectTrigger><SelectValue placeholder="Cualquier veterinario disponible" /></SelectTrigger>
                      <SelectContent>
                        {vets.map(v => <SelectItem key={v.id} value={v.id}>{v.nombre} - {v.especialidad}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.veterinarioId && <p className="text-xs text-destructive">{errors.veterinarioId}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {fechasDisponibles.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setForm({ ...form, fecha: f.value, hora: '' })}
                          className={`p-2 rounded-lg border text-center transition-all ${form.fecha === f.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                        >
                          <p className="text-[10px] text-muted-foreground">{f.diaSemana}</p>
                          <p className="text-sm font-bold">{f.day}</p>
                        </button>
                      ))}
                    </div>
                    {errors.fecha && <p className="text-xs text-destructive">{errors.fecha}</p>}
                  </div>
                  {form.fecha && form.veterinarioId && (
                    <div className="space-y-1.5">
                      <Label>Horario disponible</Label>
                      {availableSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center bg-muted/20 rounded-lg">No hay horarios disponibles para este día</p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {availableSlots.map(slot => (
                            <button
                              key={slot}
                              onClick={() => setForm({ ...form, hora: slot })}
                              className={`p-2 rounded-lg border text-sm font-mono transition-all ${form.hora === slot ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.hora && <p className="text-xs text-destructive">{errors.hora}</p>}
                    </div>
                  )}
                </CardContent>
                <div className="p-6 pt-0 flex justify-between">
                  <Button variant="outline" onClick={back} className="gap-2"><ChevronLeft className="h-4 w-4" /> Atrás</Button>
                  <Button onClick={next} disabled={!form.hora} className="gap-2">Siguiente <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </Card>
            )}

            {/* Step 3: Datos del cliente */}
            {step === 3 && (
              <Card className="bg-card/80 backdrop-blur-xl border-teal-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Tus datos</CardTitle>
                  <CardDescription>Información de contacto y de tu mascota</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nombre <span className="text-destructive">*</span></Label>
                      <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                      {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Apellido <span className="text-destructive">*</span></Label>
                      <Input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
                      {errors.apellido && <p className="text-xs text-destructive">{errors.apellido}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Teléfono WhatsApp <span className="text-destructive">*</span></Label>
                      <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="0991234567" />
                      {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cédula <span className="text-destructive">*</span></Label>
                      <Input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} placeholder="0901234567" />
                      {errors.cedula && <p className="text-xs text-destructive">{errors.cedula}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Email (opcional)</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Dirección (opcional)</Label>
                      <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-sm font-medium mb-3">Datos de tu mascota</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Nombre de mascota <span className="text-destructive">*</span></Label>
                        <Input value={form.mascotaNombre} onChange={(e) => setForm({ ...form, mascotaNombre: e.target.value })} />
                        {errors.mascotaNombre && <p className="text-xs text-destructive">{errors.mascotaNombre}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Especie</Label>
                        <Select value={form.especie} onValueChange={(v) => setForm({ ...form, especie: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Perro">Perro</SelectItem>
                            <SelectItem value="Gato">Gato</SelectItem>
                            <SelectItem value="Conejo">Conejo</SelectItem>
                            <SelectItem value="Ave">Ave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1.5">
                        <Label>Sexo</Label>
                        <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Macho">Macho</SelectItem>
                            <SelectItem value="Hembra">Hembra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Raza (opcional)</Label>
                        <Input value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Privacy notice */}
                  <div className="pt-2 border-t border-border/30 space-y-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Aviso de privacidad (v{VERSION_AVISO_PRIVACIDAD})</p>
                        <p className="mt-1">NANIVET recopila y trata sus datos personales (nombre, cédula, teléfono, email) con la finalidad de prestar servicios veterinarios a su mascota. Sus datos se almacenarán de forma segura y no serán compartidos con terceros. Usted tiene derecho a acceder, rectificar o revocar el consentimiento en cualquier momento, conforme a la Ley de Protección de Datos Personales del Ecuador.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="consentDatos" checked={form.consentDatos} onCheckedChange={(v) => setForm({ ...form, consentDatos: v === true })} />
                      <label htmlFor="consentDatos" className="text-xs cursor-pointer leading-relaxed">
                        He leído y acepto el aviso de privacidad y el tratamiento de mis datos personales <span className="text-destructive">*</span>
                      </label>
                    </div>
                    {errors.consentDatos && <p className="text-xs text-destructive">{errors.consentDatos}</p>}
                    <div className="flex items-start gap-2">
                      <Checkbox id="consentComunicaciones" checked={form.consentComunicaciones} onCheckedChange={(v) => setForm({ ...form, consentComunicaciones: v === true })} />
                      <label htmlFor="consentComunicaciones" className="text-xs cursor-pointer leading-relaxed">
                        Acepto recibir recordatorios y comunicaciones por WhatsApp (opcional)
                      </label>
                    </div>
                  </div>
                </CardContent>
                <div className="p-6 pt-0 flex justify-between">
                  <Button variant="outline" onClick={back} className="gap-2"><ChevronLeft className="h-4 w-4" /> Atrás</Button>
                  <Button onClick={handleSubmit} className="gap-2">Solicitar cita <Check className="h-4 w-4" /></Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
