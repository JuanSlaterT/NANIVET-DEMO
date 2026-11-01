'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ROLES } from '@/lib/constants';
import type { Rol } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard, Calendar, Users, PawPrint, ClipboardList,
  Stethoscope, Syringe, Settings, LogOut, Menu,
  ChevronDown, Clock, Search, Megaphone, HeartPulse, Star, ScrollText, Pill, UserCog,
} from 'lucide-react';

const loadGlobalSearch = () => import('@/components/admin/global-search');
const GlobalSearch = dynamic(
  () => loadGlobalSearch().then((module) => module.GlobalSearch),
  { ssr: false }
);

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Rol[];
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/calendario', label: 'Calendario', icon: Calendar },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/staff', label: 'Staff', icon: UserCog, roles: ['admin'] },
  { href: '/admin/citas', label: 'Citas', icon: Clock },
  { href: '/admin/mascotas', label: 'Mascotas', icon: PawPrint },
  { href: '/admin/casos', label: 'Casos Clínicos', icon: ClipboardList, roles: ['admin', 'veterinario'] },
  { href: '/admin/vacunas', label: 'Vacunas', icon: Syringe },
  { href: '/admin/desparasitacion', label: 'Desparasitación', icon: Pill },
  { href: '/admin/hospitalizacion', label: 'Hospitalización', icon: HeartPulse, roles: ['admin', 'veterinario'] },
  { href: '/admin/campanas', label: 'Campañas', icon: Megaphone },
  { href: '/admin/puntuaciones', label: 'Puntuaciones', icon: Star, roles: ['admin', 'veterinario', 'recepcionista'] },
  { href: '/admin/horarios', label: 'Horarios', icon: Settings, roles: ['admin', 'veterinario'] },
  { href: '/admin/auditoria', label: 'Auditoría', icon: ScrollText, roles: ['admin'] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const userInitials = user?.nombre.split(' ').map(s => s[0]).slice(0, 2).join('') || '?';

  const filteredNav = navItems.filter(item => !item.roles || (user && item.roles.includes(user.rol)));

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/40">
        <img src="/logo.svg" alt="NANIVET Logo" className="h-10 w-auto" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredNav.map((item) => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onPointerEnter={() => router.prefetch(item.href)}
              onFocus={() => router.prefetch(item.href)}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border/40">
        <Link
          href="/agendar"
          prefetch={false}
          onPointerEnter={() => router.prefetch('/agendar')}
          onFocus={() => router.prefetch('/agendar')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
        >
          <Stethoscope className="h-4.5 w-4.5 shrink-0" />
          <span>Página de agendamiento</span>
        </Link>
      </div>
    </div>
  );

  const tabletRail = (
    <div className="flex h-full w-full flex-col items-center safe-area-top safe-area-bottom">
      <Link href="/admin" className="flex h-16 w-full shrink-0 items-center justify-center border-b border-border/40" aria-label="Ir al dashboard">
        <PawPrint className="h-7 w-7 text-primary" />
      </Link>
      <nav className="touch-scroll flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-2 py-3">
        {filteredNav.map((item) => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {active && <span className="absolute -right-1 h-5 w-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>
      <Link href="/agendar" title="Página de agendamiento" aria-label="Página de agendamiento" className="flex h-14 w-full shrink-0 items-center justify-center border-t border-border/40 text-muted-foreground hover:text-primary">
        <Stethoscope className="h-5 w-5" />
      </Link>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden xl:flex w-64 shrink-0 border-r border-border/40 bg-card/30 backdrop-blur-sm">
        {sidebar}
      </aside>

      {/* Navegación compacta: iPad vertical y horizontal */}
      <aside className="hidden md:flex xl:hidden w-20 shrink-0 border-r border-border/40 bg-card/40 backdrop-blur-sm">
        {tabletRail}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 border-r border-border/40">
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="safe-area-top min-h-16 shrink-0 border-b border-border/40 bg-card/30 backdrop-blur-sm flex items-center justify-between px-3 py-2 sm:px-4 md:px-5 xl:px-6 gap-3">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir navegación">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              onPointerEnter={() => { void loadGlobalSearch(); }}
              onFocus={() => { void loadGlobalSearch(); }}
              className="gap-2 w-11 px-0 sm:w-64 sm:px-3 justify-center sm:justify-start text-muted-foreground"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar...</span>
              <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 rounded border border-border px-1.5 text-[10px] text-muted-foreground">
                Ctrl+K
              </kbd>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium">{user?.nombre}</span>
                  <span className="text-[10px] text-muted-foreground">{user ? ROLES[user.rol] : ''}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="ipad-content mx-auto max-w-7xl p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 md:p-5 xl:p-6">
            {children}
          </div>
        </main>
      </div>

      {searchOpen && <GlobalSearch open onOpenChange={setSearchOpen} />}
    </div>
  );
}
