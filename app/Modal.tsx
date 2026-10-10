"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";
import { Button } from "@/app/Button";

interface ModalProps {
  title?: string;
  onClose?: () => void;
  children: ReactNode;
  actions?: ReactNode;
  secondaryActions?: ReactNode;
  // Stacked above the close button in the footer's first column.
  aboveClose?: ReactNode;
  className?: string;
  closeText?: string;
}

export default function Modal({
  title,
  onClose,
  closeText = "close",
  children,
  actions,
  secondaryActions,
  aboveClose,
  className = "",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title ?? ""}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      className={`fixed inset-0 m-auto h-[95dvh] max-h-none w-[95vw] max-w-none overflow-hidden rounded-2xl bg-white p-4 text-rose-950 shadow-2xl backdrop:bg-black/60 sm:p-6 ${className}`}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        {title && <h2 className="shrink-0 text-center text-2xl font-semibold">{title}</h2>}
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        <footer className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-stretch gap-2">
          {onClose && (<div className="flex flex-col items-stretch justify-self-start">
            {aboveClose}
            <Button theme="secondary" onClick={onClose}>{closeText}</Button>
          </div>)}
          <div className="flex items-stretch justify-center">
            {secondaryActions ? actions : null}
          </div>
          <div className="flex items-stretch justify-end">
            {secondaryActions ?? actions}
          </div>
        </footer>
      </div>
    </dialog>
  );
}
