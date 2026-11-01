'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Check, Calendar, User, Stethoscope, ChevronRight, ChevronLeft, CheckCircle2, ShieldCheck, Weight, DollarSign, CreditCard, Banknote } from 'lucide-react';
import { VeterinarioRepository, CitaRepository } from '@/lib/repositories';
import { TIPOS_SERVICIO, formatDate } from '@/lib/constants';
import { VERSION_AVISO_PRIVACIDAD } from '@/lib/models';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Veterinario } from '@/lib/models';
import { toast } from 'sonner';

// Días en formato JS nativo: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
// Días laborales: lunes a viernes (1,2,3,4,5)
const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Encabezado del calendario grid (Lunes primero), NO confundir con DIAS_NOMBRES
const DIAS_CALENDARIO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Get day of week in JS format (0=Dom, 1=Lun, ..., 6=Sáb) using UTC to avoid timezone issues
function getDayJS(date: Date): number {
  return date.getUTCDay();
}

// Format date string using UTC methods
function formatDateEcuadorUTC(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

// Get current date in Ecuador timezone (UTC-5) as a UTC date
function getEcuadorNow(): Date {
  const now = new Date();
  // Convert local time to UTC, then subtract 5 hours for Ecuador
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const ecuador = new Date(utc - (5 * 3600000));
  // Return as UTC date (strip local timezone)
  return new Date(Date.UTC(ecuador.getFullYear(), ecuador.getMonth(), ecuador.getDate(), ecuador.getHours(), ecuador.getMinutes(), ecuador.getSeconds()));
}

function formatDateEcuador(date: Date): string {
  // Usar métodos UTC para consistencia con zona horaria Ecuador (UTC-5)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

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
    mascotaNombre: '', especie: 'Perro', sexo: 'Macho', raza: '', peso: '',
    // consent
    consentDatos: false, consentComunicaciones: false,
    // payment
    metodoPago: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  useEffect(() => {
    VeterinarioRepository.getAll().then(v => { setVets(v); setLoading(false); });
  }, []);
  
  // Calendar navigation state
  const [calMonth, setCalMonth] = useState<number>(() => getEcuadorNow().getUTCMonth());
  const [calYear, setCalYear] = useState<number>(() => getEcuadorNow().getUTCFullYear());
  
  // Get Ecuador timezone now
  const ecuadorNow = getEcuadorNow();
  
  // Bloqueos por veterinario (cargados dinámicamente)
  const [bloqueosByVet, setBloqueosByVet] = useState<Record<string, string[]>>({});
  
  // Cargar bloqueos cuando se selecciona un veterinario
  useEffect(() => {
    if (!form.veterinarioId || bloqueosByVet[form.veterinarioId]) return;

    let cancelled = false;
    (async () => {
      const bloqueos = await VeterinarioRepository.getBloqueos(form.veterinarioId);
      if (cancelled) return;
      const fechasBloqueo = bloqueos.map(b => b.fecha);
      setBloqueosByVet(prev => ({ ...prev, [form.veterinarioId]: fechasBloqueo }));
    })();

    return () => { cancelled = true; };
  }, [form.veterinarioId, bloqueosByVet]);
  
  // Generate available slots when vet + date changes
  useEffect(() => {
    if (!form.veterinarioId || !form.fecha) { setAvailableSlots([]); return; }

    const fechasBloqueadas = bloqueosByVet[form.veterinarioId];
    if (!fechasBloqueadas) { setAvailableSlots([]); return; }

    let cancelled = false;
    (async () => {
      const vet = vets.find(v => v.id === form.veterinarioId);
      if (!vet) { setAvailableSlots([]); return; }
      
      // El repository ya normalizó los datos: vet.horario.inicio, vet.horario.dias (formato JS: 0=Dom, 1=Lun, ..., 6=Sáb)
      const diasArray = Array.isArray(vet.horario?.dias) ? vet.horario.dias : [];
      // Convertir fecha a día de la semana en formato JS (0=Dom, 1=Lun, ..., 6=Sáb) usando UTC para consistencia con Ecuador
      const fechaParts = form.fecha.split('-');
      const fechaDate = new Date(Date.UTC(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2])));
      const diaJS = fechaDate.getUTCDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
      
      // Check if date is in vet's working days (formato JS: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie)
      if (!diasArray.includes(diaJS)) { setAvailableSlots([]); return; }
      
      // Check if date is blocked for this veterinarian
      const estaBloqueado = fechasBloqueadas.includes(form.fecha);
      if (estaBloqueado) { setAvailableSlots([]); return; }
      
      // El endpoint de slots devuelve solo la disponibilidad del día seleccionado.
      const ocupados = new Set(await CitaRepository.getSlotsOcupados(form.veterinarioId, form.fecha));
      if (cancelled) return;
      
      // Usar el horario normalizado por el repository
      const inicio = vet.horario?.inicio ? parseInt(vet.horario.inicio.split(':')[0]) : 8;
      const fin = vet.horario?.fin ? parseInt(vet.horario.fin.split(':')[0]) : 17;
      const intervalo = vet.horario?.intervalo || 30;
      
      // Generate all possible slots based on intervalo_minutos
      const slots: string[] = [];
      for (let h = inicio; h < fin; h++) {
        for (let m = 0; m < 60; m += intervalo) {
          const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          if (!ocupados.has(slot)) slots.push(slot);
        }
      }
      
      // Filter out slots within 3 hours for today (usar UTC para consistencia con Ecuador)
      const filteredSlots = slots.filter(slot => {
        const [slotHour, slotMin] = slot.split(':').map(Number);
        const now = getEcuadorNow();
        const todayStr = formatDateEcuadorUTC(now);
        
        if (form.fecha === todayStr) {
          // Usar getUTCHours/getUTCMinutes para consistencia con zona horaria Ecuador
          const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
          const slotMinutes = slotHour * 60 + slotMin;
          return slotMinutes > nowMinutes + 180; // Minimum 3 hours ahead
        }
        return true;
      });
      
      if (!cancelled) setAvailableSlots(filteredSlots);
    })();

    return () => { cancelled = true; };
  }, [form.veterinarioId, form.fecha, vets, bloqueosByVet]);

  // Generate next 14 days for date picker with calendar navigation
  // Create dates in UTC to avoid timezone issues
  const ecuadorToday = getEcuadorNow();
  const ecuadorTodayUTC = new Date(Date.UTC(ecuadorToday.getUTCFullYear(), ecuadorToday.getUTCMonth(), ecuadorToday.getUTCDate()));
  const maxDate = new Date(ecuadorTodayUTC);
  maxDate.setUTCDate(maxDate.getUTCDate() + 14);
  
  // Calendar grid for current displayed month (Lunes primero)
  // Create dates in UTC to avoid timezone issues
  const calendarDays = (() => {
    const year = calYear ?? ecuadorToday.getUTCFullYear();
    const month = calMonth ?? ecuadorToday.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    // Calcular padding para que Lunes sea columna 0
    // JS: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    // Para Lunes primero: padding = (jsDay + 6) % 7 → Lun=0, Mar=1, ..., Dom=6
    const diaJS = firstDay.getUTCDay();
    const startPad = (diaJS + 6) % 7;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getUTCDate(); d++) days.push(new Date(Date.UTC(year, month, d)));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  })();

  const prevMonth = () => {
    const m = (calMonth ?? 0) - 1;
    if (m < 0) { setCalMonth(11); setCalYear((calYear ?? 0) - 1); }
    else { setCalMonth(m); }
  };
  
  const nextMonth = () => {
    const m = (calMonth ?? 0) + 1;
    if (m > 11) { setCalMonth(0); setCalYear((calYear ?? 0) + 1); }
    else { setCalMonth(m); }
  };
  
  const isDateDisabled = (d: Date | null): boolean => {
    if (!d) return true;
    const today = getEcuadorNow();
    const maxDate = new Date(today);
    maxDate.setUTCDate(maxDate.getUTCDate() + 14);
    const dStr = formatDateEcuadorUTC(d);
    const todayStr = formatDateEcuadorUTC(today);
    const maxStr = formatDateEcuadorUTC(maxDate);
    return dStr < todayStr || dStr > maxStr;
  };
  
  const isDateSelectable = (d: Date | null): boolean => {
    if (!d) return false;
    return !isDateDisabled(d);
  };

  // Service pricing
  const SERVICE_PRICES: Record<string, number> = {
    consulta: 20,
    vacunacion: 30,
    desparasitacion: 10,
  };

  const hasPricing = form.servicio && form.servicio in SERVICE_PRICES;
  const servicePrice = hasPricing ? SERVICE_PRICES[form.servicio as string] : null;
  const serviceLabel = form.servicio ? TIPOS_SERVICIO[form.servicio as keyof typeof TIPOS_SERVICIO]?.label : '';

  // Get selected vet name
  const selectedVet = vets.find(v => v.id === form.veterinarioId);

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
      if (!form.mascotaNombre.trim()) e.mascotaNombre = 'Nombre de mascota obligatorio';
      if (!form.consentDatos) e.consentDatos = 'Debe aceptar el aviso de privacidad';
    }
    if (s === 4 && hasPricing) {
      if (!form.metodoPago) e.metodoPago = 'Selecciona un método de pago';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(step + 1); };
  const back = () => setStep(step - 1);

  // Generate WhatsApp message
  const generateWhatsAppMessage = (): string => {
    const vet = vets.find(v => v.id === form.veterinarioId);
    let message = `¡Hola Dra. ${vet?.nombre?.split(' ')[1] || 'NANIVET'}! 👋\n\n`;
    message += `Soy *${form.nombre} ${form.apellido}* y deseo agendar una cita para mi mascota *${form.mascotaNombre}*\n\n`;
    message += `📋 *Detalles de la cita:*\n`;
    message += `• Servicio: ${serviceLabel}\n`;
    message += `• Fecha: ${formatDate(form.fecha)} a las ${form.hora}\n`;
    message += `• Mascota: ${form.mascotaNombre} (${form.especie})\n`;
    
    if (hasPricing && form.metodoPago) {
      message += `\n💰 *Método de pago:* ${form.metodoPago}\n`;
      message += `• Valor: $${servicePrice}`;
    } else {
      message += `\n💰 *Método de pago:* ${form.metodoPago || 'Por definir'}\n`;
      message += `• Valor: A convenir (servicio especializado)`;
    }
    
    message += `\n\n📞 Mi teléfono: ${form.telefono}\n`;
    if (form.email) message += `📧 Mi email: ${form.email}\n`;
    message += `\n¡Gracias! 😊`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppRedirect = () => {
    if (!validateStep(hasPricing ? 4 : 3)) return;
    
    const vet = vets.find(v => v.id === form.veterinarioId);
    if (!vet || !vet.telefono) {
      toast.error('No se encontró el teléfono del veterinario seleccionado');
      return;
    }
    
    // Format phone number for WhatsApp (remove non-digits, ensure Ecuador format)
    let phone = vet.telefono.replace(/\D/g, '');
    if (phone.startsWith('09')) {
      phone = '593' + phone.substring(1);
    } else if (phone.startsWith('593')) {
      // Already has country code
    } else {
      phone = '593' + phone;
    }
    
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950">
        <div className="animate-pulse text-primary"><PawPrint className="h-12 w-12" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950 safe-area-bottom">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="NANIVET Logo" className="h-10 w-auto" />
          </div>
          <a href="/" className="text-xs text-teal-300/60 hover:text-teal-300 transition-colors">Volver al inicio</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 py-5 sm:px-5 sm:py-8">
        {submitted ? (
          <Card className="bg-card/80 backdrop-blur-xl border-teal-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">¡Redirigiendo a WhatsApp!</h2>
              <p className="text-sm text-muted-foreground mb-1">Se abrirá WhatsApp para que confirmes tu cita con el veterinario.</p>
              <p className="text-sm text-muted-foreground mb-4">Si no se abrió automáticamente, haz clic en el botón de abajo.</p>
              <div className="bg-accent/20 rounded-lg p-4 text-left space-y-1 text-sm">
                <p><span className="text-muted-foreground">Servicio:</span> {serviceLabel}</p>
                <p><span className="text-muted-foreground">Fecha:</span> {formatDate(form.fecha)} a las {form.hora}</p>
                <p><span className="text-muted-foreground">Mascota:</span> {form.mascotaNombre}</p>
                <p><span className="text-muted-foreground">Veterinario:</span> {selectedVet?.nombre}</p>
                {hasPricing && (
                  <>
                    <p><span className="text-muted-foreground">Método de pago:</span> {form.metodoPago}</p>
                    <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-primary">${servicePrice}</span></p>
                  </>
                )}
              </div>
              <Button asChild className="mt-6 w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <a href={`https://wa.me/593${selectedVet?.telefono?.replace(/\D/g, '').startsWith('593') ? selectedVet?.telefono?.replace(/\D/g, '')?.substring(3) : selectedVet?.telefono?.replace(/\D/g, '')}?text=${generateWhatsAppMessage()}`} target="_blank">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Abrir WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="mt-3 w-full">
                <a href="/">Volver al inicio</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/40'}`}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 4 && <div className={`h-0.5 flex-1 mx-2 transition-colors ${step > s ? 'bg-teal-500' : 'bg-white/10'}`} />}
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
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div className="flex justify-end p-4 pt-0 sm:p-6 sm:pt-0">
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
                    {/* Calendar view */}
                    <div className="border border-border/30 rounded-lg p-3 bg-card/50">
                      {/* Calendar header */}
                      <div className="flex items-center justify-between mb-3">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={prevMonth}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold">
                          {MESES[calMonth ?? 0]} {(calYear ?? ecuadorToday.getUTCFullYear())}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={nextMonth}
                          disabled={(() => {
                            // Usar UTC para consistencia con zona horaria Ecuador
                            const maxDate = new Date(ecuadorToday);
                            maxDate.setUTCDate(maxDate.getUTCDate() + 14);
                            const currentM = calMonth ?? ecuadorToday.getUTCMonth();
                            const currentY = calYear ?? ecuadorToday.getUTCFullYear();
                            const nextM = (currentM + 1) % 12;
                            const nextY = currentM === 11 ? currentY + 1 : currentY;
                            // Disable only if next month is completely beyond the 14-day range
                            return nextY > maxDate.getUTCFullYear() || 
                                   (nextY === maxDate.getUTCFullYear() && nextM > maxDate.getUTCMonth());
                          })()}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {DIAS_CALENDARIO.map(d => (
                          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((d, i) => {
                          const disabled = isDateDisabled(d);
                          const selectable = isDateSelectable(d);
                          const ds = d ? formatDateEcuador(d) : '';
                          const isSelected = form.fecha === ds;
                          // Usar formatDateEcuadorUTC para consistencia con zona horaria Ecuador
                          const isTodayDate = d ? formatDateEcuadorUTC(d) === formatDateEcuadorUTC(ecuadorToday) : false;
                          
                          // Check if date is within vet's working days (if vet is selected)
                          const diaJS = d ? getDayJS(d) : 0;
                          const isWorkingDay = form.veterinarioId 
                            ? (() => {
                                const vet = vets.find(v => v.id === form.veterinarioId);
                                if (!vet) return true;
                                const diasArray = Array.isArray(vet.horario?.dias) ? vet.horario.dias : [];
                                return diasArray.includes(diaJS);
                              })()
                            : true;
                          
                          // Check if date is blocked using bloqueosByVet state
                          const isBlocked = form.veterinarioId ? (() => {
                            if (!d || !ds) return false;
                            const vetBloqueos = bloqueosByVet[form.veterinarioId] || [];
                            return vetBloqueos.includes(ds);
                          })() : false;
                          
                          const isNotWorkingDay = !isWorkingDay && selectable;
                          const isNotSelectable = !selectable || isBlocked;
                          
                          if (!d) {
                            return <div key={i} className="h-9" />;
                          }
                          
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                if (selectable && !isBlocked) {
                                  setForm({ ...form, fecha: ds, hora: '' });
                                }
                              }}
                              disabled={!selectable || isBlocked}
                              className={`h-9 rounded-lg border text-sm font-medium transition-all flex items-center justify-center ${
                                isSelected 
                                  ? 'border-primary bg-primary/10 text-primary' 
                                  : isTodayDate
                                    ? 'border-sky-400 bg-sky-100 text-sky-700'
                                  : isBlocked
                                    ? 'border-red-300/30 bg-red-500/10 text-red-400/60 cursor-not-allowed line-through'
                                  : isNotWorkingDay
                                    ? 'border-amber-300/30 bg-amber-500/10 text-amber-400/60 cursor-not-allowed opacity-60'
                                    : disabled
                                      ? 'border-border/20 bg-muted/20 text-muted-foreground/40 cursor-not-allowed'
                                      : 'border-border/30 hover:border-primary/40 hover:bg-primary/5'
                              }`}
                            >
                              {/* Usar getUTCDate para consistencia con zona horaria Ecuador */}
                              {d.getUTCDate()}
                            </button>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-border/20 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-100 border border-sky-400" /> Hoy
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-primary/10 border border-primary" /> Seleccionada
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-red-500/10 border border-red-300/30" /> Bloqueado
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-amber-500/10 border border-amber-300/30" /> No laborable
                        </span>
                      </div>
                    </div>
                    {errors.fecha && <p className="text-xs text-destructive">{errors.fecha}</p>}
                  </div>
                  {form.fecha && form.veterinarioId && (
                    <div className="space-y-1.5">
                      <Label>Horario disponible</Label>
                      {availableSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center bg-muted/20 rounded-lg">No hay horarios disponibles para este día</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                <div className="flex justify-between gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Teléfono WhatsApp <span className="text-destructive">*</span></Label>
                      <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="0991234567" />
                      {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cédula (opcional)</Label>
                      <Input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} placeholder="Puedes registrarla después" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1">
                          <Weight className="h-3 w-3" />
                          Peso actual (kg, opcional)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={form.peso}
                          onChange={(e) => setForm({ ...form, peso: e.target.value })}
                          placeholder="Ej: 12.5"
                        />
                        <p className="text-[10px] text-muted-foreground">Se registrará en la línea de tiempo de peso</p>
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
                <div className="flex justify-between gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
                  <Button variant="outline" onClick={back} className="gap-2"><ChevronLeft className="h-4 w-4" /> Atrás</Button>
                  <Button onClick={next} className="gap-2">Siguiente <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </Card>
            )}

            {/* Step 4: Resumen y método de pago */}
            {step === 4 && (
              <Card className="bg-card/80 backdrop-blur-xl border-teal-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Resumen y confirmación</CardTitle>
                  <CardDescription>Verifica los datos y selecciona tu método de pago</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="bg-accent/20 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-sm">📋 Detalles de la cita</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Servicio:</span>
                        <span className="font-medium">{serviceLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Veterinario:</span>
                        <span className="font-medium">{selectedVet?.nombre || 'No seleccionado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="font-medium">{formatDate(form.fecha)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hora:</span>
                        <span className="font-medium">{form.hora}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mascota:</span>
                        <span className="font-medium">{form.mascotaNombre} ({form.especie})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dueño:</span>
                        <span className="font-medium">{form.nombre} {form.apellido}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Teléfono:</span>
                        <span className="font-medium">{form.telefono}</span>
                      </div>
                      {form.email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{form.email}</span>
                        </div>
                      )}
                    </div>
                    
                    {hasPricing && (
                      <div className="pt-3 border-t border-border/30 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">💰 Valor del servicio:</span>
                          <span className="text-2xl font-bold text-primary">${servicePrice}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment method */}
                  {hasPricing && (
                    <div className="space-y-3">
                      <Label className="text-base">Método de pago</Label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          onClick={() => setForm({ ...form, metodoPago: 'Pago Presencial' })}
                          className={`p-4 rounded-xl border text-left transition-all ${form.metodoPago === 'Pago Presencial' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                        >
                          <Banknote className="h-6 w-6 text-emerald-500 mb-2" />
                          <p className="text-sm font-medium">Pago Presencial</p>
                          <p className="text-xs text-muted-foreground mt-1">Efectivo en clínica</p>
                        </button>
                        <button
                          onClick={() => setForm({ ...form, metodoPago: 'Transferencia Bancaria (Pichincha)' })}
                          className={`p-4 rounded-xl border text-left transition-all ${form.metodoPago === 'Transferencia Bancaria (Pichincha)' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                        >
                          <CreditCard className="h-6 w-6 text-blue-500 mb-2" />
                          <p className="text-sm font-medium">Transferencia Bancaria</p>
                          <p className="text-xs text-muted-foreground mt-1">Banco Pichincha</p>
                        </button>
                      </div>
                      {errors.metodoPago && <p className="text-xs text-destructive">{errors.metodoPago}</p>}
                    </div>
                  )}

                  {!hasPricing && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        <DollarSign className="h-4 w-4 float-left mr-2" />
                        Para servicios especializados como cirugía, urgencia o estética, el valor se cotiza directamente con el veterinario.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* WhatsApp button */}
                  <div className="pt-4 border-t border-border/30">
                    <Button 
                      onClick={handleWhatsAppRedirect} 
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Agendar cita por WhatsApp
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Serás redirigido a WhatsApp para confirmar tu cita con el veterinario
                    </p>
                  </div>
                </CardContent>
                <div className="flex justify-between gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
                  <Button variant="outline" onClick={back} className="gap-2"><ChevronLeft className="h-4 w-4" /> Atrás</Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
