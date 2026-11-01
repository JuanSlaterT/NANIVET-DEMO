'use client';

import { ReactNode, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { AuditRepository } from '@/lib/repositories';
import type { AuditLog } from '@/lib/models';
import { formatDateTime } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AuditedActionDialogProps {
  children: ReactNode;
  title: string;
  description: string;
  entity?: string;
  entityId?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export function AuditedActionDialog({
  children,
  title,
  description,
  entity,
  entityId,
  confirmLabel = 'Confirmar',
  onConfirm,
}: AuditedActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen || !entity || !entityId) return;
    setLoadingHistory(true);
    const records = await AuditRepository.getByEntidad(entity, entityId);
    setHistory(records.slice(0, 5));
    setLoadingHistory(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {entity && entityId && (
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-medium">
              <History className="h-3.5 w-3.5" /> Historial reciente
            </p>
            {loadingHistory ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando historial...</div>
            ) : history.length > 0 ? (
              <div className="space-y-2">
                {history.map(log => (
                  <div key={log.id} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px]">{log.accion}</Badge>
                    <span className="min-w-0 flex-1 truncate">{log.usuario}</span>
                    <span className="text-muted-foreground">{formatDateTime(log.fechaHora)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay cambios anteriores registrados para este elemento.</p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async event => {
              event.preventDefault();
              setSubmitting(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Procesando...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
