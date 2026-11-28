"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDialog({
  portalContainer,
  title,
  subject,
  description,
  cancelLabel,
  confirmLabel,
  confirmVariant = "default",
  pending = false,
  onCancel,
  onConfirm,
}: {
  portalContainer: HTMLElement | null;
  title: string;
  subject?: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!portalContainer) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) {
          onCancel();
        }
      }}
    >
      <DialogContent portalContainer={portalContainer} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subject !== undefined && (
            <p className="text-sm font-medium">{subject}</p>
          )}
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
