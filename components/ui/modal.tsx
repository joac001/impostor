import { useEffect, useRef } from "react";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "default";
}

export function Modal({
  open,
  onClose,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        ) : null}
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" size="full" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            size="full"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={variant === "danger" ? "danger" : "primary"}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
