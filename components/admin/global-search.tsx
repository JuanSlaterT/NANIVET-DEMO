'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { BusquedaRepository } from '@/lib/repositories';
import { formatDate } from '@/lib/constants';
import { Users, PawPrint, Clock, ClipboardList, LayoutDashboard, Calendar } from 'lucide-react';

interface SearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: SearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    clientes: Array<{ id: string; nombre: string; apellido: string; cedula: string }>;
    mascotas: Array<{ id: string; nombre: string; especie: string; raza?: string | null }>;
    citas: Array<{ id: string; motivo: string; fechaHora: string }>;
    casos: Array<{ id: string; motivo: string; diagnostico: string }>;
  }>({ clientes: [], mascotas: [], citas: [], casos: [] });

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ clientes: [], mascotas: [], citas: [], casos: [] });
      return;
    }
    let cancelled = false;
    BusquedaRepository.global(query).then((r) => {
      if (!cancelled) setResults(r);
    });
    return () => { cancelled = true; };
  }, [query]);

  const navigate = (href: string) => {
    onOpenChange(false);
    setQuery('');
    router.push(href);
  };

  const hasResults = results.clientes.length > 0 || results.mascotas.length > 0 || results.citas.length > 0 || results.casos.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar clientes, mascotas, citas, casos..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{query.length >= 2 ? 'Sin resultados' : 'Escribe al menos 2 caracteres'}</CommandEmpty>

        {hasResults && (
          <CommandGroup heading="Navegación">
            <CommandItem onSelect={() => navigate('/admin')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/calendario')}>
              <Calendar className="mr-2 h-4 w-4" />
              Calendario
            </CommandItem>
          </CommandGroup>
        )}

        {results.clientes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clientes">
              {results.clientes.slice(0, 5).map((c) => (
                <CommandItem key={c.id} onSelect={() => navigate(`/admin/clientes/${c.id}`)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{c.nombre} {c.apellido}</span>
                  <span className="ml-2 text-xs text-muted-foreground">CI: {c.cedula}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.mascotas.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Mascotas">
              {results.mascotas.slice(0, 5).map((m) => (
                <CommandItem key={m.id} onSelect={() => navigate(`/admin/mascotas/${m.id}`)}>
                  <PawPrint className="mr-2 h-4 w-4" />
                  <span>{m.nombre}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.especie} {m.raza ? `- ${m.raza}` : ''}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.citas.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Citas">
              {results.citas.slice(0, 5).map((c) => (
                <CommandItem key={c.id} onSelect={() => navigate('/admin/citas')}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{c.motivo}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{formatDate(c.fechaHora)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.casos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Casos Clínicos">
              {results.casos.slice(0, 5).map((c) => (
                <CommandItem key={c.id} onSelect={() => navigate(`/admin/casos/${c.id}`)}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>{c.motivo}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{c.diagnostico}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
