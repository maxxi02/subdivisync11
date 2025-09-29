"use client";

import type * as React from "react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CustomModalProps {
  opened: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

function CustomModal({
  opened,
  onClose,
  children,
}: CustomModalProps) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      {children}
    </Dialog>
  );
}

function ModalContent({ children, className }: ModalContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        className={cn(
          "w-full max-w-[90vw] sm:max-w-4xl h-[90vh] max-h-[90vh] overflow-y-auto overflow-x-hidden fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-background p-6 rounded-lg z-50 shadow-lg border",
          className
        )}
      >
        {children}
      </div>
    </DialogPortal>
  );
}

export { CustomModal, ModalContent };
