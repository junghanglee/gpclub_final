import { Loader2 } from "lucide-react";

type LoadingModalProps = {
  open: boolean;
  label?: string;
  description?: string;
};

export function LoadingModal({ open, label = "Loading...", description }: LoadingModalProps) {
  if (!open) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[80] grid place-items-center bg-background/80 px-4 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card px-8 py-7 text-center shadow-2xl">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">{label}</div>
          {description ? (
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
