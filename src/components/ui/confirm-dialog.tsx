"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppButton } from "@/src/components/ui/app-button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "destructive",
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "secondary" | "subtle" | "ghost" | "destructive";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!loading) {
        onOpenChange(nextOpen);
      }
    }}>
      <DialogContent
        showCloseButton={!loading}
        onEscapeKeyDown={(event) => {
          if (loading) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (loading) {
            event.preventDefault();
          }
        }}
        className="rounded-[24px] border-slate-200 bg-white sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-950">{title}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <AppButton tone="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </AppButton>
          <AppButton tone={confirmTone} disabled={loading} onClick={() => void onConfirm()}>
            {confirmLabel}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
