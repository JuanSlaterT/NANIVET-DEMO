'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Mail, MapPin, User, PawPrint, MessageCircle, Edit, Plus } from 'lucide-react';
import { ClienteRepository, MascotaRepository } from '@/lib/repositories';
import { buildWhatsAppUrl, formatDate } from '@/lib/constants';
import type { Cliente, Mascota } from '@/lib/models';

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const id = params.id as string;
      const cli = ClienteRepository.getById(id);
      if (!cli) { router.push('/admin/clientes'); return; }
      setCliente(cli);
      const mas = await MascotaRepository.getByCliente(id);
      setMascotas(mas);
      setLoading(false);
    })();
  }, [params, router]);

  if (loading || !cliente) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /></div>;
  }

  const whatsappMsg = `Hola ${cliente.nombre}, le contactamos desde Clínica Veterinaria NANIVET.`;
  const edadMascota = (fechaNac: string) => {
    const nac = new Date(fechaNac);
    const ahora = new Date('2026-10-15');
    const meses = (ahora.getFullYear() - nac.getFullYear()) * 12 + (ahora.getMonth() - nac.getMonth());
    if (meses < 12) return `${meses} meses`;
    const años = Math.floor(meses / 12);
    const m = meses % 12;
    return m > 0 ? `${años} año(s) ${m} mes(es)` : `${años} año(s)`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/admin/clientes"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold tracking-tight">{cliente.nombre} {cliente.apellido}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info cliente */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Información del cliente</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/admin/clientes?edit=${cliente.id}`}><Edit className="h-4 w-4" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm font-medium">{cliente.nombre} {cliente.apellido}</p>
                <p className="text-xs text-muted-foreground">CI: {cliente.cedula}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.telefono}</span>
              </div>
              {cliente.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{cliente.email}</span>
                </div>
              )}
              {cliente.direccion && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{cliente.direccion}</span>
                </div>
              )}
            </div>
            <Button asChild className="w-full gap-2 mt-3">
              <a href={buildWhatsAppUrl(cliente.telefono, whatsappMsg)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Mascotas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Mascotas ({mascotas.length})</CardTitle>
              <Link href={`/admin/mascotas/new?clienteId=${cliente.id}`}>
                <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3 w-3" /> Agregar</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {mascotas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Este cliente no tiene mascotas registradas</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mascotas.map((mas) => (
                  <Link
                    key={mas.id}
                    href={`/admin/mascotas/${mas.id}`}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-accent/30 transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <PawPrint className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{mas.nombre}</p>
                      <p className="text-xs text-muted-foreground">{mas.especie} - {mas.raza || 'Mestizo'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-[10px]">{mas.sexo}</Badge>
                        <span className="text-[10px] text-muted-foreground">{edadMascota(mas.fechaNacimiento)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
