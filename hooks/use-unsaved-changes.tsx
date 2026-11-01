'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function useUnsavedChanges(isDirty: boolean) {
  const [open, setOpen] = useState(false);
  const pendingAction = useRef<null | (() => void)>(null);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty]);

  const requestDiscard = useCallback((action: () => void) => {
    if (!isDirty) {
      action();
      return;
    }
    pendingAction.current = action;
    setOpen(true);
  }, [isDirty]);

  const discardDialog = (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Descartar cambios sin guardar?</AlertDialogTitle>
          <AlertDialogDescription>
            Hay información modificada que todavía no se ha guardado. Si continúas, esos cambios se perderán.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { pendingAction.current = null; }}>Seguir editando</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              const action = pendingAction.current;
              pendingAction.current = null;
              setOpen(false);
              action?.();
            }}
          >
            Descartar cambios
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { requestDiscard, discardDialog };
}
