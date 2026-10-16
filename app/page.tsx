'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PawPrint,
  Calendar,
  Stethoscope,
  Heart,
  Shield,
  Users,
  ArrowRight,
  Clock,
  MapPin,
  PhoneCall,
  Star,
  TrendingUp,
  CheckCircle2,
  Smile,
  Syringe,
  Scissors,
  Activity,
  Sparkles,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';


export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const stats = [
    { value: '+500', label: 'Mascotas atendidas', icon: PawPrint },
    { value: '3', label: 'Veterinarios expertos', icon: Stethoscope },
    { value: '98%', label: 'Clientes satisfechos', icon: Smile },
    { value: '5+', label: 'Años de experiencia', icon: TrendingUp },
  ];

  const services = [
    { icon: Stethoscope, title: 'Consulta médica', desc: 'Diagnóstico preciso y tratamiento personalizado con equipos modernos.', color: 'from-sky-500 to-blue-600' },
    { icon: Shield, title: 'Vacunación', desc: 'Esquemas completos certificados para perros, gatos y mascotas exóticas.', color: 'from-emerald-500 to-green-600' },
    { icon: Heart, title: 'Cirugía', desc: 'Cirugías generales y especializadas con los más altos protocolos de seguridad.', color: 'from-red-500 to-rose-600' },
    { icon: Syringe, title: 'Desparasitación', desc: 'Control integral de parásitos internos y externos adaptado a tu mascota.', color: 'from-amber-500 to-yellow-600' },
    { icon: Scissors, title: 'Estética animal', desc: 'Baño, corte, cepillado y cuidado estético para que luzca increíble.', color: 'from-pink-500 to-fuchsia-600' },
    { icon: Activity, title: 'Urgencias', desc: 'Atención de emergencias veterinarias en horario de atención. Contáctanos para urgencias fuera de horario.', color: 'from-orange-500 to-red-500' },
  ];

  const team = [
    { name: 'Dra. Nicole Pérez', specialty: 'Medicina Interna', avatar: 'NP', color: 'from-sky-400 to-blue-500' },
    { name: 'Dr. Andrés Torres', specialty: 'Cirugía Veterinaria', avatar: 'AT', color: 'from-emerald-400 to-green-500' },
    { name: 'Dra. Sofía Vera', specialty: 'Dermatología', avatar: 'SV', color: 'from-violet-400 to-purple-500' },
  ];

  const testimonials = [
    { name: 'María González', pet: 'Dueña de Max (Labrador)', text: 'Excelente atención. El Dr. Andrés salvó a mi Max cuando tuvo una emergencia. ¡Eternamente agradecida!', rating: 5 },
    { name: 'Juan Caicedo', pet: 'Dueño de Rocky (Bulldog)', text: 'El equipo de NANIVET es increíble. Siempre me explican todo con detalle y tratan a Rocky como si fuera suyo.', rating: 5 },
    { name: 'Lucía Mendoza', pet: 'Dueña de Mia y Coco', text: 'Tener dos mascotas tan distintas me preocupaba, pero aquí las atienden a ambas con el mismo cariño. ¡Los recomiendo 100%!', rating: 5 },
  ];

  const schedule = [
    { day: 'Lunes - Viernes', hours: '8:00 - 18:00' },
    { day: 'Sábados', hours: '8:00 - 14:00' },
    { day: 'Domingos', hours: 'Solo urgencias' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-primary/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">NANIVET</h1>
              <p className="text-[10px] text-primary/70 leading-tight font-medium">Clínica Veterinaria</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-xl"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Link href="/agendar" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-primary/90 hover:text-primary hover:bg-primary/10 rounded-xl">
                <Calendar className="h-4 w-4 mr-2" /> Agendar cita
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                Portal staff
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 lg:order-1">
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border-primary/20 gap-1.5">
                <Heart className="h-3 w-3 fill-current" /> Cuidamos a quienes más quieres
              </Badge>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                  Tu mascota merece{' '}
                  <span className="relative">
                    <span className="bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                      lo mejor
                    </span>
                    <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full" />
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Atención veterinaria profesional en Esmeraldas. Medicina interna, cirugía, vacunación y cuidado estético con un equipo que ama a los animales tanto como tú.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/agendar">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
                    <Calendar className="h-4 w-4" /> Agendar cita
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="tel:+593991234567">
                  <Button size="lg" variant="outline" className="border-border rounded-xl hover:bg-primary/5 hover:border-primary/30 gap-2">
                    <PhoneCall className="h-4 w-4" /> Llamar ahora
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" /> Lun-Vie 8:00-18:00 · Sáb 8:00-14:00
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> Esmeraldas, EC
                </span>
              </div>
            </div>

            <div className="relative lg:order-2">
              {/* Hero illustration - SVG inline, no external dependencies */}
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 aspect-[4/3] flex items-center justify-center p-8">
                <svg viewBox="0 0 400 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Background */}
                  <defs>
                    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.15 }} />
                      <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 0.1 }} />
                    </linearGradient>
                    <linearGradient id="pawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.6 }} />
                      <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 0.4 }} />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="300" fill="url(#bgGrad)" rx="16" />

                  {/* Decorative paws in background */}
                  <g opacity="0.15" fill="hsl(var(--primary))">
                    <g transform="translate(30, 40) scale(0.6)">
                      <ellipse cx="20" cy="25" rx="14" ry="11" />
                      <ellipse cx="8" cy="12" rx="6" ry="7" />
                      <ellipse cx="32" cy="12" rx="6" ry="7" />
                      <ellipse cx="0" cy="28" rx="5" ry="6" />
                      <ellipse cx="40" cy="28" rx="5" ry="6" />
                    </g>
                    <g transform="translate(280, 20) scale(0.5)">
                      <ellipse cx="20" cy="25" rx="14" ry="11" />
                      <ellipse cx="8" cy="12" rx="6" ry="7" />
                      <ellipse cx="32" cy="12" rx="6" ry="7" />
                      <ellipse cx="0" cy="28" rx="5" ry="6" />
                      <ellipse cx="40" cy="28" rx="5" ry="6" />
                    </g>
                    <g transform="translate(160, 240) scale(0.7)">
                      <ellipse cx="20" cy="25" rx="14" ry="11" />
                      <ellipse cx="8" cy="12" rx="6" ry="7" />
                      <ellipse cx="32" cy="12" rx="6" ry="7" />
                      <ellipse cx="0" cy="28" rx="5" ry="6" />
                      <ellipse cx="40" cy="28" rx="5" ry="6" />
                    </g>
                  </g>

                  {/* Medical cross */}
                  <g transform="translate(320, 200)">
                    <rect x="-3" y="-18" width="6" height="36" rx="1.5" fill="hsl(var(--destructive))" opacity="0.5" />
                    <rect x="-18" y="-3" width="36" height="6" rx="1.5" fill="hsl(var(--destructive))" opacity="0.5" />
                  </g>

                  {/* Heart */}
                  <g transform="translate(60, 230)">
                    <path d="M0,-8 C-8,-18 -20,-8 -12,2 L0,14 L12,2 C20,-8 8,-18 0,-8Z" fill="hsl(var(--destructive))" opacity="0.4" transform="scale(0.8)" />
                  </g>

                  {/* Main scene - dog silhouette */}
                  <g transform="translate(120, 80)">
                    {/* Body */}
                    <ellipse cx="80" cy="100" rx="55" ry="35" fill="hsl(var(--primary))" opacity="0.3" />
                    {/* Head */}
                    <circle cx="145" cy="75" r="28" fill="hsl(var(--primary))" opacity="0.3" />
                    {/* Ears */}
                    <ellipse cx="125" cy="55" rx="10" ry="18" fill="hsl(var(--primary))" opacity="0.25" transform="rotate(-15 125 55)" />
                    <ellipse cx="165" cy="55" rx="10" ry="18" fill="hsl(var(--primary))" opacity="0.25" transform="rotate(15 165 55)" />
                    {/* Eye */}
                    <circle cx="152" cy="72" r="3" fill="hsl(var(--background))" opacity="0.6" />
                    {/* Nose */}
                    <ellipse cx="168" cy="82" rx="4" ry="3" fill="hsl(var(--foreground))" opacity="0.4" />
                    {/* Legs */}
                    <rect x="45" y="125" width="10" height="30" rx="5" fill="hsl(var(--primary))" opacity="0.25" />
                    <rect x="65" y="128" width="10" height="28" rx="5" fill="hsl(var(--primary))" opacity="0.25" />
                    <rect x="90" y="128" width="10" height="28" rx="5" fill="hsl(var(--primary))" opacity="0.25" />
                    <rect x="110" y="125" width="10" height="30" rx="5" fill="hsl(var(--primary))" opacity="0.25" />
                    {/* Tail */}
                    <path d="M25,95 Q10,75 15,60" stroke="hsl(var(--primary))" strokeWidth="6" fill="none" opacity="0.3" strokeLinecap="round" />
                  </g>

                  {/* Cat silhouette */}
                  <g transform="translate(260, 130)">
                    {/* Body */}
                    <ellipse cx="35" cy="55" rx="30" ry="25" fill="hsl(var(--accent))" opacity="0.3" />
                    {/* Head */}
                    <circle cx="65" cy="40" r="18" fill="hsl(var(--accent))" opacity="0.3" />
                    {/* Ears (pointed for cat) */}
                    <polygon points="55,25 50,10 62,22" fill="hsl(var(--accent))" opacity="0.25" />
                    <polygon points="72,22 78,10 75,25" fill="hsl(var(--accent))" opacity="0.25" />
                    {/* Eyes */}
                    <ellipse cx="60" cy="38" rx="2.5" ry="3" fill="hsl(var(--background))" opacity="0.6" />
                    <ellipse cx="70" cy="38" rx="2.5" ry="3" fill="hsl(var(--background))" opacity="0.6" />
                    {/* Nose */}
                    <circle cx="65" cy="44" r="1.5" fill="hsl(var(--foreground))" opacity="0.4" />
                    {/* Whiskers */}
                    <line x1="55" y1="44" x2="45" y2="42" stroke="hsl(var(--foreground))" strokeWidth="0.5" opacity="0.3" />
                    <line x1="55" y1="46" x2="45" y2="47" stroke="hsl(var(--foreground))" strokeWidth="0.5" opacity="0.3" />
                    <line x1="75" y1="44" x2="85" y2="42" stroke="hsl(var(--foreground))" strokeWidth="0.5" opacity="0.3" />
                    <line x1="75" y1="46" x2="85" y2="47" stroke="hsl(var(--foreground))" strokeWidth="0.5" opacity="0.3" />
                    {/* Tail */}
                    <path d="M5,55 Q-10,40 -5,25 Q0,15 10,20" stroke="hsl(var(--accent))" strokeWidth="4" fill="none" opacity="0.3" strokeLinecap="round" />
                    {/* Legs */}
                    <rect x="18" y="72" width="7" height="20" rx="3.5" fill="hsl(var(--accent))" opacity="0.25" />
                    <rect x="50" y="72" width="7" height="20" rx="3.5" fill="hsl(var(--accent))" opacity="0.25" />
                  </g>

                  {/* Stethoscope */}
                  <g transform="translate(180, 140)">
                    <path d="M0,10 Q0,-5 15,-5 Q30,-5 30,10 L30,35" stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" opacity="0.35" strokeLinecap="round" />
                    <circle cx="30" cy="40" r="6" fill="hsl(var(--primary))" opacity="0.3" />
                    <circle cx="30" cy="40" r="3" fill="hsl(var(--primary))" opacity="0.2" />
                  </g>
                </svg>
              </div>

              {/* Floating stat cards - siblings to SVG, positioned over the illustration */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-4 left-4 pointer-events-auto">
                  <div className="bg-card/95 backdrop-blur-md rounded-xl p-3 border border-border shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-500 leading-tight">+500</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">mascotas felices</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 pointer-events-auto">
                  <div className="bg-card/95 backdrop-blur-md rounded-xl p-3 border border-border shadow-lg">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-[10px] font-medium mt-0.5">4.9/5 valoración</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">
            Servicios
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
            Todo lo que tu mascota necesita
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Ofrecemos atención integral con tecnología de vanguardia y un equipo apasionado por el bienestar animal.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="group border-border bg-card hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                <CardContent className="p-6 sm:p-8 text-center">
                  {/* Icon badge with gradient */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform bg-gradient-to-br ${s.color}`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Team Section */}
      <section className="border-t border-border/50 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">
              Equipo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
              Conoce a nuestros veterinarios
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Profesionales certificados y apasionados por el bienestar de tus mascotas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {team.map((member) => (
              <Card key={member.name} className="group border-border bg-card hover:border-primary/20 transition-all hover:shadow-xl text-center">
                <CardContent className="p-6 sm:p-8 pt-8 sm:pt-10">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-white font-bold text-xl">{member.avatar}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                  <p className="text-sm text-primary font-medium">{member.specialty}</p>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">
            Testimonios
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
            Lo que dicen nuestros clientes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border bg-card hover:border-primary/20 transition-all hover:shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.pet}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-8 sm:p-12 lg:p-16">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />

            <div className="relative text-center max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                ¿Tu mascota necesita atención?
              </h2>
              <p className="text-primary-foreground/80 text-base sm:text-lg max-w-lg mx-auto">
                Agenda una cita en línea en simples pasos. Sin esperas, sin complicaciones.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/agendar">
                  <Button size="lg" className="gap-2 bg-white text-primary hover:bg-primary-foreground/90 rounded-xl shadow-xl px-8">
                    Agendar ahora <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="tel:+593991234567">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl gap-2">
                    <PhoneCall className="h-4 w-4" /> +593 99 123 4567
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-sm text-primary-foreground/70">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Sin esperas</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Confirmación inmediata</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Recordatorios automáticos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <PawPrint className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">NANIVET</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Clínica Veterinaria en Esmeraldas, Ecuador. Cuidamos a tus mascotas como si fueran nuestras.
              </p>
            </div>

            {/* Horarios */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Horarios
              </h4>
              <div className="space-y-2">
                {schedule.map((s) => (
                  <div key={s.day} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.day}</span>
                    <span className="font-medium">{s.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-primary" /> Contacto
              </h4>
              <div className="space-y-2">
                <Link href="tel:+593991234567" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  +593 99 123 4567
                </Link>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Esmeraldas, Ecuador
                </span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Enlaces</h4>
              <div className="space-y-2">
                <Link href="/agendar" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Calendar className="h-3.5 w-3.5" /> Agendar cita
                </Link>
                <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Users className="h-3.5 w-3.5" /> Portal del staff
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 NANIVET - Clínica Veterinaria. Todos los derechos reservados.</p>
            <p>Hecho con <Heart className="h-3 w-3 text-red-500 inline fill-red-500" /> para tus mascotas</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
