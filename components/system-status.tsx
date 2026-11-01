'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ApiProblem = { message: string; context: string } | null;

export function SystemStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [problem, setProblem] = useState<ApiProblem>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const authenticatedRef = useRef(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleSuccess = () => {
      setApiAvailable(true);
      setProblem(null);
    };
    const handleError = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setApiAvailable(detail?.error?.code !== 'NETWORK_ERROR');
      setProblem({
        message: detail?.error?.message || 'No fue posible completar la solicitud.',
        context: detail?.context || 'cargar la información',
      });
    };
    const handleAuthState = (event: Event) => {
      authenticatedRef.current = Boolean((event as CustomEvent).detail?.authenticated);
      if (!authenticatedRef.current) setSessionExpired(false);
    };
    const handleExpired = () => {
      // Un 401 al comprobar si existe una sesión inicial es normal y no debe
      // convertir la pantalla de login en un bucle de "sesión expirada".
      if (authenticatedRef.current) setSessionExpired(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('nanivet:api-success', handleSuccess);
    window.addEventListener('nanivet:api-error', handleError);
    window.addEventListener('nanivet:session-expired', handleExpired);
    window.addEventListener('nanivet:auth-state', handleAuthState);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('nanivet:api-success', handleSuccess);
      window.removeEventListener('nanivet:api-error', handleError);
      window.removeEventListener('nanivet:session-expired', handleExpired);
      window.removeEventListener('nanivet:auth-state', handleAuthState);
    };
  }, []);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    let controller: AbortController | null = null;

    const checkServer = async () => {
      if (!navigator.onLine) {
        setApiAvailable(false);
        return;
      }
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`${apiBase}/health`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        setApiAvailable(response.ok);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setApiAvailable(false);
        }
      }
    };

    void checkServer();
    const interval = window.setInterval(checkServer, 30_000);
    window.addEventListener('online', checkServer);
    return () => {
      controller?.abort();
      window.clearInterval(interval);
      window.removeEventListener('online', checkServer);
    };
  }, []);

  const retry = () => {
    setProblem(null);
    router.refresh();
    window.location.reload();
  };

  return (
    <>
      {problem && pathname.startsWith('/admin') && (
        <Alert variant="destructive" className="fixed bottom-4 left-4 z-[120] w-[calc(100%-2rem)] max-w-md shadow-xl bg-background">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="pr-20">
            <span className="font-medium">No se pudo {problem.context}.</span>{' '}{problem.message}
          </AlertDescription>
          <Button size="sm" variant="outline" className="absolute right-3 top-3 gap-1" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </Button>
        </Alert>
      )}

      <div className="fixed bottom-4 right-4 z-[110] pointer-events-none">
        {!online || !apiAvailable ? (
          <div className="flex items-center gap-2 rounded-full border border-destructive/40 bg-background px-3 py-1.5 text-xs text-destructive shadow-lg">
            <CloudOff className="h-3.5 w-3.5" /> {!online ? 'Sin conexión' : 'Servidor no disponible'}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            <Cloud className="h-3.5 w-3.5 text-emerald-500" /> Conectado
          </div>
        )}
      </div>

      <AlertDialog open={sessionExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tu sesión expiró</AlertDialogTitle>
            <AlertDialogDescription>
              Por seguridad debes iniciar sesión nuevamente. Los cambios que ya fueron guardados se conservaron.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setSessionExpired(false);
              router.replace('/admin');
            }}>
              Volver a iniciar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
